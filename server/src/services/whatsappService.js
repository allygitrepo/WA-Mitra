let makeWASocket;
let useMultiFileAuthState;
let DisconnectReason;
let Browsers;

async function loadBaileys() {
    const baileys = await import('@whiskeysockets/baileys');

    makeWASocket = baileys.default;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    Browsers = baileys.Browsers;
}
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const { getIO } = require('../config/socket');
const WhatsAppInstance = require('../models/instanceModel');
const MessageLog = require('../models/messageLogModel');

const pino = require('pino');
const QRCode = require('qrcode');

// Store all active sessions: Map<instanceKey, sessionData>
const sessions = new Map();

// Store temporary connection errors: Map<instanceKey, errorMessage>
const connectionErrors = new Map();

async function syncInstanceRules(instanceKey, rules) {
    try {
        const { AutoReplyRule } = require("../models/associations");
        await AutoReplyRule.destroy({ where: { instanceKey } });
        if (rules && rules.length > 0) {
            const rulesToCreate = rules.map(rule => ({
                instanceKey,
                keyword: rule.keyword,
                replyText: rule.replyText,
                matchType: rule.matchType || 'exact',
                isActive: rule.isActive !== undefined ? rule.isActive : true
            }));
            await AutoReplyRule.bulkCreate(rulesToCreate);
        }
    } catch (e) {
        console.error("Error syncing instance rules to DB:", e);
    }
}

async function getInstanceRules(instanceKey) {
    try {
        const { AutoReplyRule } = require("../models/associations");
        return await AutoReplyRule.findAll({ where: { instanceKey } });
    } catch (e) {
        console.error("Error getting instance rules from DB:", e);
        return [];
    }
}

function getSessionPath(instanceKey) {
    return path.join(__dirname, '../../sessions', `instance_${instanceKey}`);
}

async function startSession(instanceKey) {
    await loadBaileys();
    // Check if session already exists
    if (sessions.has(instanceKey)) {
        const session = sessions.get(instanceKey);
        if (session.connectionStatus === 'connected') {
            console.log(`Instance ${instanceKey} is already connected.`);
            return session.sock;
        }
        // If it's already connecting or has a QR, close the old socket before starting a new one
        if (session.sock) {
            try {
                session.sock.ev.removeAllListeners();
                session.sock.terminate();
            } catch (e) { }
        }
    }

    const sessionDir = getSessionPath(instanceKey);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.windows('Chrome'),
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    // Initialize session data
    sessions.set(instanceKey, {
        sock,
        qrCodeData: null,
        qrTimestamp: null,
        connectionStatus: 'connecting',
        userPhone: null
    });

    sock.ev.on('creds.update', async (update) => {
        await saveCreds();
        // Capture name if it arrives late in creds
        if (update.me && update.me.name) {
            const sessionData = sessions.get(instanceKey);
            if (sessionData && (!sessionData.pushName || sessionData.pushName === 'WhatsApp User')) {
                sessionData.pushName = update.me.name;
                try {
                    await WhatsAppInstance.update({ pushName: update.me.name }, { where: { instanceKey } });
                    getIO().emit('connected', {
                        instanceKey,
                        pushName: update.me.name,
                        phone: sessionData.userPhone,
                        profilePic: sessionData.profilePic
                    });
                } catch (e) { }
            }
        }
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        const sessionData = sessions.get(instanceKey);
        if (!sessionData) return;

        if (qr) {
            try {
                const qrDataURL = await QRCode.toDataURL(qr);
                sessionData.qrCodeData = qrDataURL;
                sessionData.qrTimestamp = Date.now();
                sessionData.connectionStatus = 'qr_ready';
                await WhatsAppInstance.update({ status: 'qr_ready' }, { where: { instanceKey } });
                getIO().emit('qr', { instanceKey, qr: qrDataURL });
            } catch (err) {
                console.error('Failed to generate QR Data URL:', err);
                sessionData.qrCodeData = qr; // Fallback to raw string
                sessionData.qrTimestamp = Date.now();
            }
        }

        if (connection === 'open') {
            console.log(`[INSTANCE] ${instanceKey} connected!`);
            sessionData.qrCodeData = null;
            sessionData.qrTimestamp = null;
            sessionData.connectionStatus = 'connected';
            sessionData.userPhone = sock.user.id.split(':')[0];
            sessionData.pushName = sock.user.name || sock.user.notify || (state.creds.me && state.creds.me.name) || 'WhatsApp User';

            // Check if this phone number is already connected to any other instance
            const instance = await WhatsAppInstance.findOne({ where: { instanceKey } });
            if (instance) {
                const duplicatePhone = await WhatsAppInstance.findOne({
                    where: {
                        phone: sessionData.userPhone,
                        id: { [require('sequelize').Op.ne]: instance.id }
                    }
                });
                if (duplicatePhone) {
                    console.log(`[INSTANCE REJECTED] Phone ${sessionData.userPhone} is already linked to another instance.`);
                    
                    connectionErrors.set(instanceKey, "This WhatsApp number is already connected to another instance.");
                    setTimeout(() => {
                        connectionErrors.delete(instanceKey);
                    }, 15000);

                    try {
                        await sock.logout();
                    } catch (e) {
                        try {
                            sock.terminate();
                        } catch (err) {}
                    }
                    sessions.delete(instanceKey);
                    
                    const sessionDir = getSessionPath(instanceKey);
                    if (fs.existsSync(sessionDir)) {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    }
                    
                    await WhatsAppInstance.update({
                        status: 'disconnected',
                        phone: null,
                        pushName: null,
                        profilePic: null
                    }, { where: { instanceKey } });
                    
                    getIO().emit('disconnected', { 
                        instanceKey, 
                        error: "This WhatsApp number is already connected to another instance." 
                    });
                    return;
                }
            }

            // Fetch profile picture if possible
            let profilePic = null;
            try {
                profilePic = await sock.profilePictureUrl(sock.user.id, 'image');
            } catch (e) {
                console.log("Could not fetch profile picture:", e.message);
            }

            await WhatsAppInstance.update({
                status: 'connected',
                phone: sessionData.userPhone,
                pushName: sessionData.pushName,
                profilePic: profilePic,
                lastConnected: new Date()
            }, { where: { instanceKey } });

            getIO().emit('connected', {
                instanceKey,
                phone: sessionData.userPhone,
                pushName: sessionData.pushName,
                profilePic: profilePic
            });
        }

        if (connection === 'connecting') {
            sessionData.connectionStatus = 'connecting';
            await WhatsAppInstance.update({ status: 'connecting' }, { where: { instanceKey } });
        }

        if (connection === 'close') {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`[INSTANCE] ${instanceKey} closed. Reason: ${statusCode}`);

            if (statusCode !== DisconnectReason.loggedOut) {
                sessionData.connectionStatus = 'connecting';
                getIO().emit('loading', { instanceKey, message: 'Reconnecting...' });
                setTimeout(() => startSession(instanceKey), 5000);
            } else {
                sessionData.connectionStatus = 'disconnected';
                sessionData.sock = null;
                sessionData.qrCodeData = null;
                sessionData.userPhone = null;
                sessionData.pushName = null;
                sessionData.profilePic = null;
                sessions.delete(instanceKey);

                // Remove from DB entirely per user request
                await WhatsAppInstance.destroy({ where: { instanceKey } });

                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
                getIO().emit('disconnected', { instanceKey });
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                // Ignore messages sent by ourselves and group chats
                if (!msg.key.fromMe && msg.key.remoteJid && !msg.key.remoteJid.endsWith('@g.us')) {
                    // Extract text content from message
                    const text = msg.message?.conversation ||
                        msg.message?.extendedTextMessage?.text ||
                        msg.message?.imageMessage?.caption || "";

                    if (text) {
                        const rules = await getInstanceRules(instanceKey);
                        const incomingText = text.trim().toLowerCase();

                        for (const rule of rules) {
                            if (!rule.isActive) continue;

                            let isMatch = false;
                            const ruleKeyword = (rule.keyword || '').trim().toLowerCase();

                            if (rule.matchType === 'exact' && incomingText === ruleKeyword) {
                                isMatch = true;
                            } else if (rule.matchType === 'contains' && incomingText.includes(ruleKeyword)) {
                                isMatch = true;
                            }

                            if (isMatch) {
                                console.log(`[AUTO-REPLY] Matching keyword "${rule.keyword}" for instance ${instanceKey}. Replying to ${msg.key.remoteJid}: "${rule.replyText}"`);
                                try {
                                    await sock.sendMessage(msg.key.remoteJid, { text: rule.replyText });

                                    // Log the auto-reply in the MessageLog table so it appears in the user dashboard logs and stats
                                    const instance = await WhatsAppInstance.findOne({ where: { instanceKey } });
                                    if (instance) {
                                        const cleanNumber = msg.key.remoteJid.split('@')[0];
                                        await MessageLog.create({
                                            instanceId: instance.id,
                                            recipient: cleanNumber,
                                            messageType: 'text',
                                            status: 'sent',
                                            errorMessage: 'Auto Reply' // Mark it so we know it was auto-reply
                                        });
                                        await WhatsAppInstance.increment('messageCount', { where: { id: instance.id } });
                                    }
                                } catch (err) {
                                    console.error(`[AUTO-REPLY ERROR] Failed to send auto reply for ${instanceKey}:`, err);
                                }
                                break; // Only trigger first matching rule
                            }
                        }
                    }
                }
            }
        }
    });

    return sock;
}

function getStatus(instanceKey) {
    const sessionData = sessions.get(instanceKey);
    const error = connectionErrors.get(instanceKey) || null;
    
    if (!sessionData) {
        const exists = fs.existsSync(getSessionPath(instanceKey));
        return {
            connected: false,
            status: exists ? 'connecting' : 'disconnected',
            qr: null,
            phone: null,
            error
        };
    }

    // Check if QR is expired (40 seconds)
    let currentQR = sessionData.qrCodeData;
    if (sessionData.qrTimestamp && (Date.now() - sessionData.qrTimestamp > 40000)) {
        currentQR = null; // QR expired
    }

    return {
        connected: sessionData.connectionStatus === 'connected',
        status: sessionData.connectionStatus,
        qr: currentQR,
        phone: sessionData.userPhone,
        pushName: sessionData.pushName,
        profilePic: sessionData.profilePic,
        error
    };
}

async function disconnect(instanceKey) {
    const sessionData = sessions.get(instanceKey);
    if (sessionData && sessionData.sock) {
        try {
            await sessionData.sock.logout();
        } catch (e) { }
    }
    sessions.delete(instanceKey);

    const sessionDir = getSessionPath(instanceKey);
    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    // Remove from DB entirely per user request
    await WhatsAppInstance.destroy({ where: { instanceKey } });
    getIO().emit('disconnected', { instanceKey });
}

function getSock(instanceKey) {
    const sessionData = sessions.get(instanceKey);
    return sessionData ? sessionData.sock : null;
}

module.exports = {
    startSession,
    getStatus,
    disconnect,
    getSock,
    syncInstanceRules,
    getInstanceRules
};
