let makeWASocket;
let useMultiFileAuthState;
let DisconnectReason;
let Browsers;

async function loadBaileys() {
    if (makeWASocket) return;
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

// Memory Storage
const sessions = new Map();             // Map<instanceKey, sessionData>
const connectionErrors = new Map();     // Map<instanceKey, errorMessage>
const connectingInFlight = new Map();   // Map<instanceKey, Promise> - Mutex for startSession
const reconnectTimers = new Map();      // Map<instanceKey, Timeout> - Track pending reconnect timers
const reconnectAttempts = new Map();    // Map<instanceKey, number> - Exponential backoff tracker
const lastDbStateCache = new Map();     // Map<instanceKey, Object> - In-memory DB state cache
const rulesCache = new Map();           // Map<instanceKey, Array> - In-memory auto-reply rules cache

function getSessionPath(instanceKey) {
    return path.join(__dirname, '../../sessions', `instance_${instanceKey}`);
}

/**
 * Safely updates instance database status ONLY if current status differs or additional data changed.
 * Uses in-memory cache to eliminate preliminary SELECT queries and avoid SQL update storms.
 */
async function updateInstanceStatusSafely(instanceKey, newStatus, updateFields = {}) {
    try {
        const sessionData = sessions.get(instanceKey);
        if (sessionData) {
            sessionData.connectionStatus = newStatus;
        }

        const desiredState = { status: newStatus, ...updateFields };
        const cachedState = lastDbStateCache.get(instanceKey);

        if (cachedState) {
            let hasChanges = false;
            for (const [key, value] of Object.entries(desiredState)) {
                if (cachedState[key] !== value) {
                    hasChanges = true;
                    break;
                }
            }
            if (!hasChanges) {
                return; // State is identical - skip DB operation entirely!
            }
        }

        await WhatsAppInstance.update(
            desiredState,
            { where: { instanceKey } }
        );

        if (!cachedState) {
            lastDbStateCache.set(instanceKey, { ...desiredState });
        } else {
            Object.assign(cachedState, desiredState);
        }
    } catch (e) {
        console.error(`[DB STATUS UPDATE ERROR] Failed to update status for ${instanceKey}:`, e.message);
    }
}

/**
 * Strips listeners and closes socket safely
 */
function cleanupSocket(instanceKey) {
    if (reconnectTimers.has(instanceKey)) {
        clearTimeout(reconnectTimers.get(instanceKey));
        reconnectTimers.delete(instanceKey);
    }

    const sessionData = sessions.get(instanceKey);
    if (sessionData && sessionData.sock) {
        try {
            sessionData.sock.ev.removeAllListeners();
            sessionData.sock.terminate();
        } catch (e) {
            // Ignore socket termination errors
        }
        sessionData.sock = null;
    }
}

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
        const updatedRules = await AutoReplyRule.findAll({ where: { instanceKey } });
        rulesCache.set(instanceKey, updatedRules);
    } catch (e) {
        console.error("Error syncing instance rules to DB:", e);
    }
}

async function getInstanceRules(instanceKey) {
    if (rulesCache.has(instanceKey)) {
        return rulesCache.get(instanceKey);
    }
    try {
        const { AutoReplyRule } = require("../models/associations");
        const rules = await AutoReplyRule.findAll({ where: { instanceKey } });
        rulesCache.set(instanceKey, rules);
        return rules;
    } catch (e) {
        console.error("Error getting instance rules from DB:", e);
        return [];
    }
}

/**
 * Thread-safe startSession wrapped in Mutex
 */
async function startSession(instanceKey) {
    if (connectingInFlight.has(instanceKey)) {
        console.log(`[SESSION MUTEX] Connection initialization already in progress for ${instanceKey}. Returning active promise.`);
        return connectingInFlight.get(instanceKey);
    }

    const connectPromise = (async () => {
        try {
            return await _internalStartSession(instanceKey);
        } finally {
            connectingInFlight.delete(instanceKey);
        }
    })();

    connectingInFlight.set(instanceKey, connectPromise);
    return connectPromise;
}

async function _internalStartSession(instanceKey) {
    await loadBaileys();

    // Clear any existing reconnect timer
    if (reconnectTimers.has(instanceKey)) {
        clearTimeout(reconnectTimers.get(instanceKey));
        reconnectTimers.delete(instanceKey);
    }

    // Check existing session state
    if (sessions.has(instanceKey)) {
        const session = sessions.get(instanceKey);
        if (session.connectionStatus === 'connected' && session.sock) {
            console.log(`Instance ${instanceKey} is already connected.`);
            return session.sock;
        }
        cleanupSocket(instanceKey);
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

    // Initialize session state object
    const sessionData = {
        sock,
        qrCodeData: null,
        qrTimestamp: null,
        connectionStatus: 'connecting',
        userPhone: null,
        pushName: null,
        profilePic: null
    };
    sessions.set(instanceKey, sessionData);

    // Creds update handler
    sock.ev.on('creds.update', async (update) => {
        await saveCreds();
        if (update.me && update.me.name) {
            const currentSession = sessions.get(instanceKey);
            if (currentSession && (!currentSession.pushName || currentSession.pushName === 'WhatsApp User')) {
                currentSession.pushName = update.me.name;
                await updateInstanceStatusSafely(instanceKey, currentSession.connectionStatus, { pushName: update.me.name });
                getIO().emit('connected', {
                    instanceKey,
                    pushName: update.me.name,
                    phone: currentSession.userPhone,
                    profilePic: currentSession.profilePic
                });
            }
        }
    });

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        const currentSession = sessions.get(instanceKey);
        if (!currentSession) return;

        // QR Code Received
        if (qr) {
            try {
                const qrDataURL = await QRCode.toDataURL(qr);
                currentSession.qrCodeData = qrDataURL;
                currentSession.qrTimestamp = Date.now();
                await updateInstanceStatusSafely(instanceKey, 'qr_ready');
                getIO().emit('qr', { instanceKey, qr: qrDataURL });
            } catch (err) {
                console.error('Failed to generate QR Data URL:', err);
                currentSession.qrCodeData = qr;
                currentSession.qrTimestamp = Date.now();
            }
        }

        // Connection Opened
        if (connection === 'open') {
            reconnectAttempts.delete(instanceKey);
            currentSession.qrCodeData = null;
            currentSession.qrTimestamp = null;
            currentSession.connectionStatus = 'connected';
            currentSession.userPhone = sock.user.id.split(':')[0];
            currentSession.pushName = sock.user.name || sock.user.notify || (state.creds.me && state.creds.me.name) || 'WhatsApp User';

            // Duplicate phone check across instances
            const instance = await WhatsAppInstance.findOne({ where: { instanceKey } });
            if (instance) {
                const { Op } = require('sequelize');
                const duplicatePhone = await WhatsAppInstance.findOne({
                    where: {
                        phone: currentSession.userPhone,
                        id: { [Op.ne]: instance.id }
                    }
                });
                if (duplicatePhone) {
                    console.log(`[INSTANCE REJECTED] Phone ${currentSession.userPhone} linked to another instance.`);
                    connectionErrors.set(instanceKey, "This WhatsApp number is already connected to another instance.");
                    setTimeout(() => connectionErrors.delete(instanceKey), 15000);

                    cleanupSocket(instanceKey);
                    sessions.delete(instanceKey);
                    if (fs.existsSync(sessionDir)) {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    }

                    await updateInstanceStatusSafely(instanceKey, 'disconnected', {
                        phone: null,
                        pushName: null,
                        profilePic: null
                    });

                    getIO().emit('disconnected', {
                        instanceKey,
                        error: "This WhatsApp number is already connected to another instance."
                    });
                    return;
                }
            }

            // Fetch profile picture safely
            let profilePic = null;
            try {
                profilePic = await sock.profilePictureUrl(sock.user.id, 'image');
            } catch (e) { }
            currentSession.profilePic = profilePic;

            await updateInstanceStatusSafely(instanceKey, 'connected', {
                phone: currentSession.userPhone,
                pushName: currentSession.pushName,
                profilePic,
                lastConnected: new Date()
            });

            getIO().emit('connected', {
                instanceKey,
                phone: currentSession.userPhone,
                pushName: currentSession.pushName,
                profilePic
            });
        }

        // Connecting State
        if (connection === 'connecting') {
            await updateInstanceStatusSafely(instanceKey, 'connecting');
        }

        // Connection Closed
        if (connection === 'close') {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            cleanupSocket(instanceKey);

            cleanupSocket(instanceKey);

            if (statusCode !== DisconnectReason.loggedOut) {
                await updateInstanceStatusSafely(instanceKey, 'connecting');
                getIO().emit('loading', { instanceKey, message: 'Reconnecting...' });

                // Bounded exponential backoff delay (min 5s, max 30s)
                const attempts = (reconnectAttempts.get(instanceKey) || 0) + 1;
                reconnectAttempts.set(instanceKey, attempts);
                const delay = Math.min(5000 * Math.pow(1.5, attempts - 1), 30000);
                const timer = setTimeout(() => {
                    reconnectTimers.delete(instanceKey);
                    startSession(instanceKey).catch(err => {
                        console.error(`[RECONNECT FAILED] Instance ${instanceKey}:`, err.message);
                    });
                }, delay);

                reconnectTimers.set(instanceKey, timer);
            } else {
                reconnectAttempts.delete(instanceKey);
                sessions.delete(instanceKey);
                rulesCache.delete(instanceKey);

                await WhatsAppInstance.destroy({ where: { instanceKey } });
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
                getIO().emit('disconnected', { instanceKey });
            }
        }
    });

    // Auto-reply message handler
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe && msg.key.remoteJid && !msg.key.remoteJid.endsWith('@g.us')) {
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
                                console.log(`[AUTO-REPLY] Match keyword "${rule.keyword}" for ${instanceKey}. Replying: "${rule.replyText}"`);
                                try {
                                    await sock.sendMessage(msg.key.remoteJid, { text: rule.replyText });

                                    const instance = await WhatsAppInstance.findOne({ where: { instanceKey } });
                                    if (instance) {
                                        const cleanNumber = msg.key.remoteJid.split('@')[0];
                                        await MessageLog.create({
                                            instanceId: instance.id,
                                            userId: instance.userId,
                                            recipient: cleanNumber,
                                            messageType: 'text',
                                            status: 'sent',
                                            errorMessage: 'Auto Reply'
                                        });
                                        await WhatsAppInstance.increment('messageCount', { where: { id: instance.id } });
                                    }
                                } catch (err) {
                                    console.error(`[AUTO-REPLY ERROR] Failed to send auto reply for ${instanceKey}:`, err);
                                }
                                break;
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

    let currentQR = sessionData.qrCodeData;
    if (sessionData.qrTimestamp && (Date.now() - sessionData.qrTimestamp > 40000)) {
        currentQR = null;
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
    if (sessionData && sessionData.sock && sessionData.connectionStatus === 'connected') {
        try {
            await sessionData.sock.logout();
        } catch (e) {
            console.error(`[Baileys Logout Error] Failed to log out session for ${instanceKey}:`, e.message);
        }
    }

    cleanupSocket(instanceKey);
    sessions.delete(instanceKey);
    rulesCache.delete(instanceKey);
    reconnectAttempts.delete(instanceKey);

    const sessionDir = getSessionPath(instanceKey);
    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
    }

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
