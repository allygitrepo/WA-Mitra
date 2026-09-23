const { Schedule, Cycle, WhatsAppInstance, MessageLog, User } = require('../models/associations');
const { getSock, startSession } = require('./whatsappService');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

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
    console.error('[Scheduler] Logging Error:', e);
  }
};

const sendWhatsAppPayload = async (sock, targetJid, messageText, mediaPath) => {
  if (mediaPath && fs.existsSync(mediaPath)) {
    const mediaBuffer = fs.readFileSync(mediaPath);
    const ext = path.extname(mediaPath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    const isVideo = ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);
    const isAudio = ['.mp3', '.ogg', '.wav', '.m4a', '.aac'].includes(ext);

    if (isImage) {
      const mimetype = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
      return await sock.sendMessage(targetJid, {
        image: mediaBuffer,
        mimetype,
        caption: messageText || ''
      });
    } else if (isVideo) {
      return await sock.sendMessage(targetJid, {
        video: mediaBuffer,
        mimetype: 'video/mp4',
        caption: messageText || ''
      });
    } else if (isAudio) {
      return await sock.sendMessage(targetJid, {
        audio: mediaBuffer,
        mimetype: 'audio/mp4'
      });
    } else {
      return await sock.sendMessage(targetJid, {
        document: mediaBuffer,
        mimetype: 'application/octet-stream',
        fileName: path.basename(mediaPath),
        caption: messageText || ''
      });
    }
  } else {
    return await sock.sendMessage(targetJid, { text: messageText || '' });
  }
};

const processSchedules = async () => {
  try {
    const now = new Date();
    // Find all scheduled campaigns
    const allScheduled = await Schedule.findAll({
      where: {
        status: 'scheduled'
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (allScheduled.length === 0) return;

    // Filter pending schedules based on either targetDateTime or user's local timezone target
    const pendingSchedules = allScheduled.filter(campaign => {
      const timezone = campaign.user?.timezone || 'UTC';
      const localTargetMoment = moment.tz(`${campaign.targetDate}T${campaign.targetTime}`, timezone);
      const isLocalDue = localTargetMoment.isValid() && localTargetMoment.toDate() <= now;
      const isDbDue = campaign.targetDateTime && new Date(campaign.targetDateTime) <= now;
      return isLocalDue || isDbDue;
    });

    if (pendingSchedules.length === 0) return;

    console.log(`[Scheduler] Found ${pendingSchedules.length} pending campaign(s) ready to execute`);

    for (const campaign of pendingSchedules) {
      // Mark as processing immediately to prevent duplicate runs
      campaign.status = 'processing';
      await campaign.save();

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey: campaign.instanceKey } });
      if (!instance) {
        campaign.status = 'failed';
        await campaign.save();
        console.error(`[Scheduler] Instance not found for campaign: ${campaign.id}`);
        continue;
      }

      let sock = getSock(campaign.instanceKey);
      if (!sock) {
        try {
          console.log(`[Scheduler] Sock not connected for ${campaign.instanceKey}, attempting startSession...`);
          await startSession(campaign.instanceKey);
          await new Promise(resolve => setTimeout(resolve, 3000));
          sock = getSock(campaign.instanceKey);
        } catch (sErr) {
          console.error(`[Scheduler] Failed to auto-start session:`, sErr.message);
        }
      }

      if (!sock) {
        console.log(`[Scheduler] Sock not connected for instanceKey: ${campaign.instanceKey}`);
        campaign.status = 'failed';
        await campaign.save();
        await logMessage(instance.id, 'all', 'text', 'failed', 'WhatsApp instance not connected at target schedule time');
        continue;
      }

      const recipients = Array.isArray(campaign.recipients) ? campaign.recipients : [];
      let sentCount = 0;
      let failedCount = 0;

      for (const item of recipients) {
        let rawNumber = '';
        let targetMessage = campaign.message || '';

        if (typeof item === 'object' && item !== null) {
          rawNumber = String(item.number || item.phone || item.recipient || item.jid || '');
          if (item.message && typeof item.message === 'string' && item.message.trim()) {
            targetMessage = item.message;
          }
        } else {
          rawNumber = String(item || '');
        }

        rawNumber = rawNumber.trim();
        if (!rawNumber) continue;

        const isJid = rawNumber.includes('@');
        let targetJid;

        if (isJid) {
          targetJid = rawNumber;
        } else {
          const cleanNumber = rawNumber.replace(/\D/g, '');
          if (!cleanNumber || cleanNumber.length < 5) {
            failedCount++;
            await logMessage(instance.id, rawNumber, campaign.mediaPath ? 'media' : 'text', 'failed', 'Invalid phone number format');
            continue;
          }

          try {
            const [onWa] = await sock.onWhatsApp(cleanNumber);
            if (onWa && onWa.exists && onWa.jid) {
              targetJid = onWa.jid;
            } else {
              targetJid = `${cleanNumber}@s.whatsapp.net`;
            }
          } catch (e) {
            targetJid = `${cleanNumber}@s.whatsapp.net`;
          }
        }

        try {
          await sendWhatsAppPayload(sock, targetJid, targetMessage, campaign.mediaPath);
          sentCount++;
          await logMessage(instance.id, rawNumber, campaign.mediaPath ? 'media' : 'text', 'sent');
        } catch (err) {
          failedCount++;
          console.error(`[Scheduler] Error sending scheduled message to ${rawNumber}:`, err.message);
          await logMessage(instance.id, rawNumber, campaign.mediaPath ? 'media' : 'text', 'failed', err.message);
        }

        // Delay between dispatches (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Delete media file once campaign processing is complete
      if (campaign.mediaPath && fs.existsSync(campaign.mediaPath)) {
        try {
          fs.unlinkSync(campaign.mediaPath);
        } catch (e) {
          console.error('[Scheduler] Failed to clean up completed schedule media:', e.message);
        }
      }

      campaign.status = (recipients.length > 0 && failedCount === recipients.length) ? 'failed' : 'completed';
      await campaign.save();
      console.log(`[Scheduler] Campaign "${campaign.name}" processing complete. Sent: ${sentCount}, Failed: ${failedCount}`);
    }
  } catch (err) {
    console.error('[Scheduler] Error processing pending schedules:', err);
  }
};

const processCycles = async () => {
  try {
    const activeCycles = await Cycle.findAll({
      where: {
        status: 'active'
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (activeCycles.length === 0) return;

    for (const cycle of activeCycles) {
      const user = cycle.user;
      const timezone = user?.timezone || 'UTC';
      const userNow = moment().tz(timezone);
      const currentTimeStr = userNow.format('HH:mm');

      if (cycle.sendTime !== currentTimeStr) {
        continue;
      }

      const todayDateStr = userNow.format('YYYY-MM-DD');

      // Prevent running multiple times within the same minute
      if (cycle.lastRunDate === todayDateStr) {
        continue;
      }

      const currentDayOfWeek = userNow.format('dddd');
      const dayDate = userNow.date();

      // Check frequency rules
      let shouldRun = false;

      if (cycle.frequency === 'daily') {
        shouldRun = true;
      } else if (cycle.frequency === 'alternate') {
        const config = cycle.frequencyConfig || {};
        const yesterdayDateStr = userNow.clone().subtract(1, 'day').format('YYYY-MM-DD');
        const createdDateStr = moment(cycle.createdAt).tz(timezone).format('YYYY-MM-DD');

        if (cycle.lastRunDate === yesterdayDateStr) {
          shouldRun = false;
        } else {
          // If startFrom is tomorrow and lastRunDate is empty, check if today is the creation day
          if (config.startFrom === 'tomorrow' && !cycle.lastRunDate && todayDateStr === createdDateStr) {
            shouldRun = false;
          } else {
            shouldRun = true;
          }
        }
      } else if (cycle.frequency === 'weekly') {
        const config = cycle.frequencyConfig || {};
        if (config.selectedDay === currentDayOfWeek) {
          shouldRun = true;
        }
      } else if (cycle.frequency === 'monthly') {
        const config = cycle.frequencyConfig || {};
        if (Number(config.selectedDate) === Number(dayDate)) {
          shouldRun = true;
        }
      } else if (cycle.frequency === 'custom') {
        const config = cycle.frequencyConfig || {};
        if (config.selectedDays && Array.isArray(config.selectedDays)) {
          if (config.selectedDays.includes(currentDayOfWeek)) {
            shouldRun = true;
          }
        }
        if (config.selectedDates && Array.isArray(config.selectedDates)) {
          const currentDayNum = Number(dayDate);
          if (
            config.selectedDates.includes(todayDateStr) ||
            config.selectedDates.includes(currentDayNum) ||
            config.selectedDates.includes(String(currentDayNum))
          ) {
            shouldRun = true;
          }
        }
      }

      if (!shouldRun) continue;

      // Update lastRunDate immediately to prevent duplicate runs in case of async delays
      cycle.lastRunDate = todayDateStr;
      await cycle.save();

      console.log(`[Scheduler] Triggering recurring cycle campaign: "${cycle.name}"`);

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey: cycle.instanceKey } });
      if (!instance) continue;

      let sock = getSock(cycle.instanceKey);
      if (!sock) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        sock = getSock(cycle.instanceKey);
      }

      if (!sock) {
        console.log(`[Scheduler] Sock not connected for cycle instance: ${cycle.instanceKey}`);
        await logMessage(instance.id, 'all', 'text', 'failed', 'WhatsApp instance not connected at recurring schedule time');
        continue;
      }

      const recipients = Array.isArray(cycle.recipients) ? cycle.recipients : [];
      const mediaPath = cycle.mediaPath;

      for (const item of recipients) {
        let rawNumber = '';
        let targetMessage = cycle.message || '';

        if (typeof item === 'object' && item !== null) {
          rawNumber = String(item.number || item.phone || item.recipient || item.jid || '');
          if (item.message && typeof item.message === 'string' && item.message.trim()) {
            targetMessage = item.message;
          }
        } else {
          rawNumber = String(item || '');
        }

        rawNumber = rawNumber.trim();
        if (!rawNumber) continue;

        try {
          const isJid = rawNumber.includes('@');
          let targetJid;
          if (isJid) {
            targetJid = rawNumber;
          } else {
            const cleanNumber = rawNumber.replace(/\D/g, '');
            if (!cleanNumber || cleanNumber.length < 5) {
              await logMessage(instance.id, rawNumber, mediaPath ? 'media' : 'text', 'failed', 'Invalid phone number');
              continue;
            }
            targetJid = `${cleanNumber}@s.whatsapp.net`;
          }

          await sendWhatsAppPayload(sock, targetJid, targetMessage, mediaPath);
          await logMessage(instance.id, rawNumber, mediaPath ? 'media' : 'text', 'sent');
        } catch (err) {
          console.error(`[Scheduler] Cycle sending error for number ${rawNumber}:`, err.message);
          await logMessage(instance.id, rawNumber, mediaPath ? 'media' : 'text', 'failed', err.message);
        }

        // Delay between dispatches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error processing cycles:', err);
  }
};

let isRunningSchedules = false;
let isRunningCycles = false;

const safeProcessSchedules = async () => {
  if (isRunningSchedules) return;
  isRunningSchedules = true;
  try {
    await processSchedules();
  } finally {
    isRunningSchedules = false;
  }
};

const safeProcessCycles = async () => {
  if (isRunningCycles) return;
  isRunningCycles = true;
  try {
    await processCycles();
  } finally {
    isRunningCycles = false;
  }
};

const initScheduler = () => {
  console.log('[Scheduler] Initializing backend message scheduler background worker...');
  setInterval(async () => {
    await safeProcessSchedules();
    await safeProcessCycles();
  }, 10000);
};

module.exports = { initScheduler };
