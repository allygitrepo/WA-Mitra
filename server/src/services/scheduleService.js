const { Schedule, Cycle, WhatsAppInstance, MessageLog, User } = require('../models/associations');
const { getSock } = require('./whatsappService');
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
    console.error("Logging Error:", e);
  }
};

const processSchedules = async () => {
  try {
    const now = new Date();
    // Find all schedules that are scheduled and targetDateTime is <= now
    const pendingSchedules = await Schedule.findAll({
      where: {
        status: 'scheduled',
        targetDateTime: {
          [Op.lte]: now
        }
      }
    });

    if (pendingSchedules.length === 0) return;

    console.log(`[Scheduler] Found ${pendingSchedules.length} pending campaign(s) to execute`);

    for (const campaign of pendingSchedules) {
      // Mark as processing immediately to prevent duplicate runs
      campaign.status = 'processing';
      await campaign.save();

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey: campaign.instanceKey } });
      if (!instance) {
        campaign.status = 'failed';
        await campaign.save();
        continue;
      }

      const sock = getSock(campaign.instanceKey);
      if (!sock) {
        console.log(`[Scheduler] Sock not connected for instanceKey: ${campaign.instanceKey}`);
        campaign.status = 'failed';
        await campaign.save();
        await logMessage(instance.id, 'all', 'text', 'failed', 'WhatsApp instance not connected at target schedule time');
        continue;
      }

      const recipients = campaign.recipients; // Array of numbers
      const message = campaign.message;
      let sentCount = 0;
      let failedCount = 0;

      for (const number of recipients) {
        try {
          const isJid = number.includes('@');
          const cleanNumber = number.replace(/\D/g, '');
          const targetJid = isJid ? number : `${cleanNumber}@s.whatsapp.net`;

          if (campaign.mediaPath && fs.existsSync(campaign.mediaPath)) {
            const ext = path.extname(campaign.mediaPath).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
            const mimetype = isImage ? `image/${ext.substring(1)}` : 'application/octet-stream';

            if (isImage) {
              await sock.sendMessage(targetJid, { image: { url: campaign.mediaPath }, caption: message || '' });
            } else {
              await sock.sendMessage(targetJid, {
                document: { url: campaign.mediaPath },
                mimetype: mimetype,
                fileName: path.basename(campaign.mediaPath),
                caption: message || ''
              });
            }
          } else {
            await sock.sendMessage(targetJid, { text: message });
          }
          sentCount++;
          await logMessage(instance.id, number, campaign.mediaPath ? 'media' : 'text', 'sent');
        } catch (err) {
          failedCount++;
          await logMessage(instance.id, number, campaign.mediaPath ? 'media' : 'text', 'failed', err.message);
        }

        // Delay between dispatches (e.g. 1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Delete media file once campaign processing is complete
      if (campaign.mediaPath && fs.existsSync(campaign.mediaPath)) {
        try {
          fs.unlinkSync(campaign.mediaPath);
        } catch (e) {
          console.error('[Scheduler] Failed to clean up completed schedule media:', e);
        }
      }

      campaign.status = failedCount === recipients.length ? 'failed' : 'completed';
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

      const sock = getSock(cycle.instanceKey);
      if (!sock) {
        console.log(`[Scheduler] Sock not connected for cycle instance: ${cycle.instanceKey}`);
        await logMessage(instance.id, 'all', 'text', 'failed', 'WhatsApp instance not connected at recurring schedule time');
        continue;
      }

      const recipients = cycle.recipients;
      const message = cycle.message;
      const mediaPath = cycle.mediaPath;

      for (const number of recipients) {
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
              await logMessage(instance.id, number, mediaPath ? 'media' : 'text', 'failed', 'Number is not on WhatsApp');
              continue;
            }
          }

          if (mediaPath && fs.existsSync(mediaPath)) {
            const ext = path.extname(mediaPath).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
            const mimetype = isImage ? `image/${ext.substring(1)}` : 'application/octet-stream';

            if (isImage) {
              await sock.sendMessage(targetJid, { image: { url: mediaPath }, caption: message || '' });
            } else {
              await sock.sendMessage(targetJid, {
                document: { url: mediaPath },
                mimetype: mimetype,
                fileName: path.basename(mediaPath),
                caption: message || ''
              });
            }
          } else {
            await sock.sendMessage(targetJid, { text: message });
          }

          await logMessage(instance.id, number, mediaPath ? 'media' : 'text', 'sent');
        } catch (err) {
          console.error(`[Scheduler] Cycle sending error for number ${number}:`, err);
          await logMessage(instance.id, number, mediaPath ? 'media' : 'text', 'failed', err.message);
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
