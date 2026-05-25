const { Schedule, WhatsAppInstance, MessageLog } = require('../models/associations');
const { getSock } = require('./whatsappService');
const { Op } = require('sequelize');

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

const initScheduler = () => {
  console.log('[Scheduler] Initializing backend message scheduler background worker...');
  // Poll database every 10 seconds
  setInterval(processSchedules, 10000);
};

module.exports = { initScheduler };
