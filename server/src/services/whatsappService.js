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

const pino = require('pino');
const QRCode = require('qrcode');

// Store all active sessions: Map<instanceKey, sessionData>
const sessions = new Map();

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

    return sock;
}

function getStatus(instanceKey) {
    const sessionData = sessions.get(instanceKey);
    if (!sessionData) {
        const exists = fs.existsSync(getSessionPath(instanceKey));
        return {
            connected: false,
            status: exists ? 'connecting' : 'disconnected',
            qr: null,
            phone: null
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
        profilePic: sessionData.profilePic
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
    getSock
};
