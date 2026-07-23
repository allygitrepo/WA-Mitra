const { getSock } = require('../services/whatsappService');
const path = require('path');
const fs = require('fs');
const WhatsAppInstance = require('../models/instanceModel');
const MessageLog = require('../models/messageLogModel');
const { Package } = require('../models/associations');
const { getIO } = require('../config/socket');

const logMessage = async (instanceId, recipient, type, status, error = null) => {
    try {
        let userId = null;
        if (instanceId) {
            const instance = await WhatsAppInstance.findByPk(instanceId);
            if (instance) {
                userId = instance.userId;
            }
        }
        await MessageLog.create({
            instanceId,
            userId,
            recipient,
            messageType: type,
            status,
            errorMessage: error
        });
        if (status === 'sent' && instanceId) {
            await WhatsAppInstance.increment('messageCount', { where: { id: instanceId } });
        }
    } catch (e) {
        console.error("Logging Error:", e);
    }
};

const checkMessageQuota = async (user, count = 1) => {
    const pkg = await user.getPackage();
    if (!pkg) return true; // No package means no limit? (Or assume trial)

    const totalSent = await MessageLog.count({
        where: {
            userId: user.id,
            status: 'sent'
        }
    });
    if (pkg.messageLimit === -1) return true; // Unlimited
    if (totalSent + count > pkg.messageLimit) {
        return false;
    }
    return true;
};

const messageController = {
    sendBulkMessage: async (req, res) => {
        const file = req.file;
        try {
            const { instanceKey } = req.body;
            let parsedMessages = req.body.messages;

            if (typeof parsedMessages === 'string') {
                try {
                    parsedMessages = JSON.parse(parsedMessages);
                } catch (e) {
                    if (file) fs.unlinkSync(file.path);
                    return res.status(400).json({ success: false, message: 'Invalid messages format' });
                }
            }

            if (!instanceKey) {
                if (file) fs.unlinkSync(file.path);
                return res.status(400).json({ success: false, message: 'instanceKey is required' });
            }
            if (!parsedMessages || !Array.isArray(parsedMessages)) {
                if (file) fs.unlinkSync(file.path);
                return res.status(400).json({ success: false, message: 'messages array is required' });
            }

            const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId: req.user.id } });
            if (!instance) {
                if (file) fs.unlinkSync(file.path);
                return res.status(404).json({ success: false, message: 'Instance not found or unauthorized' });
            }

            const hasQuota = await checkMessageQuota(req.user, parsedMessages.length);
            if (!hasQuota) {
                if (file) fs.unlinkSync(file.path);
                return res.status(403).json({ success: false, message: 'Message quota exceeded. Please upgrade your package.' });
            }

            const sock = getSock(instanceKey);
            if (!sock) {
                if (file) fs.unlinkSync(file.path);
                return res.status(500).json({ success: false, message: 'WhatsApp not connected for this instance' });
            }

            // Set headers for NDJSON streaming
            res.setHeader('Content-Type', 'application/x-ndjson');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Sockets helper
            const io = getIO();
            const emitSocket = (eventName, payload) => {
                io.to(instanceKey).emit(eventName, payload);
                io.emit(eventName, { ...payload, instanceKey }); // fallback broadcast for simple filtering
            };

            const results = {
                total: parsedMessages.length,
                sent: 0,
                failed: 0,
                errors: []
            };

            emitSocket('bulk_progress', {
                type: 'start',
                total: parsedMessages.length,
                sent: 0,
                failed: 0
            });

            let index = 0;
            let batchCounter = 0;
            let nextBatchThreshold = Math.floor(Math.random() * 6) + 15; // 15 to 20

            for (const msg of parsedMessages) {
                const { number, message } = msg;
                let status = 'failed';
                let errorMsg = null;
                let type = file ? 'media' : 'text';
                index++;

                try {
                    const isJid = number.includes('@');
                    let targetJid;
                    if (isJid) {
                        targetJid = number;
                    } else {
                        const cleanNumber = number.replace(/\D/g, '');
                        const [result] = await sock.onWhatsApp(cleanNumber);

                        if (result && result.exists) {
                            targetJid = result.jid;
                        } else {
                            errorMsg = 'Number is not on WhatsApp';
                            results.failed++;
                            results.errors.push({ number, error: errorMsg });
                            await logMessage(instance.id, number, type, status, errorMsg);

                            res.write(JSON.stringify({
                                type: 'progress',
                                index,
                                total: results.total,
                                sent: results.sent,
                                failed: results.failed,
                                currentNumber: number,
                                status: 'failed',
                                error: errorMsg
                            }) + '\n');

                            emitSocket('bulk_progress', {
                                type: 'progress',
                                index,
                                total: results.total,
                                sent: results.sent,
                                failed: results.failed,
                                currentNumber: number,
                                status: 'failed',
                                error: errorMsg
                            });

                            // Delay calculation inside check-failed path
                            batchCounter++;
                            if (index < parsedMessages.length) {
                                if (batchCounter >= nextBatchThreshold) {
                                    emitSocket('bulk_progress', {
                                        type: 'pause',
                                        message: `Taking a 15-second pause to prevent rate limiting...`,
                                        nextBatchSize: nextBatchThreshold,
                                        sent: results.sent,
                                        failed: results.failed
                                    });
                                    await new Promise(resolve => setTimeout(resolve, 15000));
                                    batchCounter = 0;
                                    nextBatchThreshold = Math.floor(Math.random() * 6) + 15;
                                } else {
                                    const delay = Math.floor(Math.random() * 7000) + 1000;
                                    await new Promise(resolve => setTimeout(resolve, delay));
                                }
                            }
                            continue;
                        }
                    }

                    if (file) {
                        const ext = path.extname(file.originalname).toLowerCase();
                        const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
                        if (isImage) {
                            await sock.sendMessage(targetJid, { image: { url: file.path }, caption: message || '' });
                        } else {
                            await sock.sendMessage(targetJid, {
                                document: { url: file.path },
                                mimetype: file.mimetype,
                                fileName: file.originalname,
                                caption: message || ''
                            });
                        }
                    } else {
                        await sock.sendMessage(targetJid, { text: message });
                    }
                    status = 'sent';
                    results.sent++;
                } catch (error) {
                    errorMsg = error.message;
                    results.failed++;
                    results.errors.push({ number, error: errorMsg });
                }

                await logMessage(instance.id, number, type, status, errorMsg);

                res.write(JSON.stringify({
                    type: 'progress',
                    index,
                    total: results.total,
                    sent: results.sent,
                    failed: results.failed,
                    currentNumber: number,
                    status,
                    error: errorMsg
                }) + '\n');

                emitSocket('bulk_progress', {
                    type: 'progress',
                    index,
                    total: results.total,
                    sent: results.sent,
                    failed: results.failed,
                    currentNumber: number,
                    status,
                    error: errorMsg
                });

                // Delay calculation inside standard path
                batchCounter++;
                if (index < parsedMessages.length) {
                    if (batchCounter >= nextBatchThreshold) {
                        emitSocket('bulk_progress', {
                            type: 'pause',
                            message: `Taking a 15-second pause to prevent rate limiting...`,
                            nextBatchSize: nextBatchThreshold,
                            sent: results.sent,
                            failed: results.failed
                        });
                        await new Promise(resolve => setTimeout(resolve, 15000));
                        batchCounter = 0;
                        nextBatchThreshold = Math.floor(Math.random() * 6) + 15;
                    } else {
                        const delay = Math.floor(Math.random() * 7000) + 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            res.write(JSON.stringify({
                type: 'done',
                results
            }) + '\n');
            res.end();

            emitSocket('bulk_progress', {
                type: 'done',
                results
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        } finally {
            if (file && fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                } catch (e) {
                    console.error("Failed to clean up bulk upload file:", e);
                }
            }
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

            const isJid = number.includes('@');
            let targetJid;

            if (isJid) {
                targetJid = number;
            } else {
                const cleanNumber = number.replace(/\D/g, '');
                const [result] = await sock.onWhatsApp(cleanNumber);

                if (!result || !result.exists) {
                    if (file) fs.unlinkSync(file.path);
                    await logMessage(instance.id, number, file ? 'media' : 'text', 'failed', 'Number not on WhatsApp');
                    return res.status(400).json({ success: false, message: 'Number is not on WhatsApp' });
                }
                targetJid = result.jid;
            }

            let type = 'text';
            if (file) {
                type = 'media';
                const ext = path.extname(file.originalname).toLowerCase();
                const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);

                if (isImage) {
                    await sock.sendMessage(targetJid, { image: { url: file.path }, caption: message || '' });
                } else {
                    await sock.sendMessage(targetJid, {
                        document: { url: file.path },
                        mimetype: file.mimetype,
                        fileName: file.originalname,
                        caption: message || ''
                    });
                }
                fs.unlinkSync(file.path);
            } else {
                await sock.sendMessage(targetJid, { text: message });
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
            const logs = await MessageLog.findAll({
                where: { userId: req.user.id },
                order: [['createdAt', 'DESC']],
                limit: 50,
                include: [{
                    model: WhatsAppInstance,
                    as: 'instance',
                    attributes: ['name']
                }]
            });

            const logsWithInstanceName = logs.map(log => {
                const logJson = log.toJSON();
                if (!logJson.instance) {
                    logJson.instance = { name: 'Deleted Instance' };
                }
                return logJson;
            });

            const totalMessagesSent = await MessageLog.count({
                where: {
                    userId: req.user.id,
                    status: 'sent'
                }
            });

            res.json({ success: true, logs: logsWithInstanceName, totalMessagesSent });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    getReports: async (req, res) => {
        try {
            const instances = await WhatsAppInstance.findAll({ where: { userId: req.user.id } });
            const sequelize = require('../config/db');

            const reportsRaw = await MessageLog.findAll({
                where: {
                    userId: req.user.id
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
                    instance: inst ? { name: inst.name } : { name: 'Deleted Instance' }
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
