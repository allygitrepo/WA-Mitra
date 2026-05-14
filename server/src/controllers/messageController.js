const { getSock } = require('../services/whatsappService');
const path = require('path');
const fs = require('fs');
const WhatsAppInstance = require('../models/instanceModel');
const MessageLog = require('../models/messageLogModel');
const { Package } = require('../models/associations');

const logMessage = async (instanceId, recipient, type, status, error = null) => {
    try {
        await MessageLog.create({
            instanceId,
            recipient,
            messageType: type,
            status,
            errorMessage: error
        });
        if (status === 'sent') {
            await WhatsAppInstance.increment('messageCount', { where: { id: instanceId } });
        }
    } catch (e) {
        console.error("Logging Error:", e);
    }
};

const checkMessageQuota = async (user, count = 1) => {
    const pkg = await user.getPackage();
    if (!pkg) return true; // No package means no limit? (Or assume trial)

    const instances = await WhatsAppInstance.findAll({ where: { userId: user.id } });
    const instanceIds = instances.map(i => i.id);

    const totalSent = await MessageLog.count({
        where: {
            instanceId: instanceIds,
            status: 'sent'
        }
    });

    if (totalSent + count > pkg.messageLimit) {
        return false;
    }
    return true;
};

const messageController = {
    sendBulkMessage: async (req, res) => {
        try {
            const { messages, instanceKey } = req.body;
            
            if (!instanceKey) return res.status(400).json({ success: false, message: 'instanceKey is required' });
            if (!messages || !Array.isArray(messages)) return res.status(400).json({ success: false, message: 'messages array is required' });

            const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId: req.user.id } });
            if (!instance) return res.status(404).json({ success: false, message: 'Instance not found or unauthorized' });

            const hasQuota = await checkMessageQuota(req.user, messages.length);
            if (!hasQuota) {
                return res.status(403).json({ success: false, message: 'Message quota exceeded. Please upgrade your package.' });
            }

            const sock = getSock(instanceKey);
            if (!sock) return res.status(500).json({ success: false, message: 'WhatsApp not connected for this instance' });

            const QUEUE_INTERVAL_MS = 1000;
            const results = {
                total: messages.length,
                sent: 0,
                failed: 0,
                errors: []
            };
            
            for (const msg of messages) {
                const { number, message } = msg;
                let status = 'failed';
                let errorMsg = null;
                
                try {
                    const cleanNumber = number.replace(/\D/g, '');
                    const [result] = await sock.onWhatsApp(cleanNumber);

                    if (result && result.exists) {
                        await sock.sendMessage(result.jid, { text: message });
                        status = 'sent';
                        results.sent++;
                    } else {
                        errorMsg = 'Number is not on WhatsApp';
                        results.failed++;
                        results.errors.push({ number, error: errorMsg });
                    }
                } catch (error) {
                    errorMsg = error.message;
                    results.failed++;
                    results.errors.push({ number, error: errorMsg });
                }

                await logMessage(instance.id, number, 'text', status, errorMsg);
                if (messages.indexOf(msg) < messages.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, QUEUE_INTERVAL_MS));
                }
            }

            res.json({ 
                success: true, 
                message: 'Bulk processing completed', 
                results 
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    sendMessage: async (req, res) => {
        try {
            const { number, message, instanceKey } = req.body;
            const file = req.file;

            if (!instanceKey) {
                if (file) fs.unlinkSync(file.path);
                return res.status(400).json({ success: false, message: 'instanceKey is required' });
            }

            const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId: req.user.id } });
            if (!instance) {
                if (file) fs.unlinkSync(file.path);
                return res.status(404).json({ success: false, message: 'Instance not found or unauthorized' });
            }

            const hasQuota = await checkMessageQuota(req.user, 1);
            if (!hasQuota) {
                if (file) fs.unlinkSync(file.path);
                return res.status(403).json({ success: false, message: 'Message quota exceeded. Please upgrade your package.' });
            }

            const sock = getSock(instanceKey);
            if (!sock) {
                if (file) fs.unlinkSync(file.path);
                return res.status(500).json({ success: false, message: 'WhatsApp not connected for this instance' });
            }

            const cleanNumber = number.replace(/\D/g, '');
            const [result] = await sock.onWhatsApp(cleanNumber);

            if (!result || !result.exists) {
                if (file) fs.unlinkSync(file.path);
                await logMessage(instance.id, number, file ? 'media' : 'text', 'failed', 'Number not on WhatsApp');
                return res.status(400).json({ success: false, message: 'Number is not on WhatsApp' });
            }

            let type = 'text';
            if (file) {
                type = 'media';
                const ext = path.extname(file.originalname).toLowerCase();
                const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);

                if (isImage) {
                    await sock.sendMessage(result.jid, { image: { url: file.path }, caption: message || '' });
                } else {
                    await sock.sendMessage(result.jid, { 
                        document: { url: file.path }, 
                        mimetype: file.mimetype, 
                        fileName: file.originalname, 
                        caption: message || '' 
                    });
                }
                fs.unlinkSync(file.path);
            } else {
                await sock.sendMessage(result.jid, { text: message });
            }

            await logMessage(instance.id, number, type, 'sent');
            res.json({ success: true, message: 'Message sent successfully' });

        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    getMessageLogs: async (req, res) => {
        try {
            const instances = await WhatsAppInstance.findAll({ where: { userId: req.user.id } });
            const instanceIds = instances.map(i => i.id);
            
            const logs = await MessageLog.findAll({
                where: { instanceId: instanceIds },
                order: [['createdAt', 'DESC']],
                limit: 50,
                include: [{
                    model: WhatsAppInstance,
                    as: 'instance',
                    attributes: ['name']
                }]
            });

            res.json({ success: true, logs });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    getReports: async (req, res) => {
        try {
            const instances = await WhatsAppInstance.findAll({ where: { userId: req.user.id } });
            const instanceIds = instances.map(i => i.id);

            const sequelize = require('../config/db');

            const reportsRaw = await MessageLog.findAll({
                where: { 
                    instanceId: instanceIds
                },
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('MessageLog.createdAt')), 'date'],
                    'instanceId',
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('MessageLog.id')), 'count']
                ],
                group: [
                    sequelize.fn('DATE', sequelize.col('MessageLog.createdAt')), 
                    'instanceId',
                    'status'
                ],
                order: [[sequelize.fn('DATE', sequelize.col('MessageLog.createdAt')), 'DESC']],
                raw: true
            });

            // Attach instance names manually to avoid SQL group by issues with joined tables
            const reports = reportsRaw.map(rep => {
                const inst = instances.find(i => i.id === rep.instanceId);
                return {
                    ...rep,
                    instance: inst ? { name: inst.name } : { name: 'Unknown' }
                };
            });

            res.json({ success: true, reports });
        } catch (error) {
            console.error("Reports Error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = messageController;
