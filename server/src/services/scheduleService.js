const { Schedule, Cycle, WhatsAppInstance, MessageLog } = require('../models/associations');
const { getSock } = require('./whatsappService');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

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
          let targetJid;
          if (isJid) {
            targetJid = number;
          } else {
            const cleanNumber = number.replace(/\D/g, '');
            const [result] = await sock.onWhatsApp(cleanNumber);
            if (result && result.exists) {
              targetJid = result.jid;
            } else {
              failedCount++;
              await logMessage(instance.id, number, 'text', 'failed', 'Number is not on WhatsApp');
              continue;
            }
          }

          await sock.sendMessage(targetJid, { text: message });
          sentCount++;
          await logMessage(instance.id, number, 'text', 'sent');
        } catch (err) {
          failedCount++;
          await logMessage(instance.id, number, 'text', 'failed', err.message);
        }

        // Delay between dispatches (e.g. 1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
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
    const now = new Date();
    
    // Get time in local format 'HH:MM'
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    // Get today's date in local format YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dayDate = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${year}-${month}-${dayDate}`;

    // Get day of week (e.g. 'Sunday', 'Monday')
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayOfWeek = daysOfWeek[now.getDay()];

    // Find active cycles that match the sendTime
    const activeCycles = await Cycle.findAll({
      where: {
        status: 'active',
        sendTime: currentTimeStr
      }
    });

    if (activeCycles.length === 0) return;

    for (const cycle of activeCycles) {
      // Prevent running multiple times within the same minute
      if (cycle.lastRunDate === todayDateStr) {
        continue;
      }

      // Check frequency rules
      let shouldRun = false;

      if (cycle.frequency === 'daily') {
        shouldRun = true;
      } else if (cycle.frequency === 'alternate') {
        const config = cycle.frequencyConfig || {};
        // Check if it ran yesterday
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yYear = yesterday.getFullYear();
        const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
        const yDayDate = String(yesterday.getDate()).padStart(2, '0');
        const yesterdayDateStr = `${yYear}-${yMonth}-${yDayDate}`;

        // Get creation date in local YYYY-MM-DD
        const createdDate = new Date(cycle.createdAt);
        const cYear = createdDate.getFullYear();
        const cMonth = String(createdDate.getMonth() + 1).padStart(2, '0');
        const cDayDate = String(createdDate.getDate()).padStart(2, '0');
        const createdDateStr = `${cYear}-${cMonth}-${cDayDate}`;

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

const initScheduler = () => {
  console.log('[Scheduler] Initializing backend message scheduler background worker...');
  setInterval(async () => {
    await processSchedules();
    await processCycles();
  }, 10000);
};

module.exports = { initScheduler };
