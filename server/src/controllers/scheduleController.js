const { Schedule, WhatsAppInstance } = require('../models/associations');

module.exports = {
  getSchedules: async (req, res) => {
    try {
      const userId = req.user.id;
      const schedules = await Schedule.findAll({
        where: { userId },
        order: [['targetDateTime', 'ASC']]
      });
      res.json(schedules);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
    }
  },

  createSchedule: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, instanceKey, targetDate, targetTime, recipients, message } = req.body;

      if (!instanceKey) {
        return res.status(400).json({ success: false, message: 'instanceKey is required' });
      }
      if (!targetDate || !targetTime) {
        return res.status(400).json({ success: false, message: 'Target date and time are required' });
      }
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, message: 'recipients list is required' });
      }
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message content is required' });
      }

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });
      if (!instance) {
        return res.status(404).json({ success: false, message: 'Instance not found or unauthorized' });
      }

      const targetDateTime = new Date(`${targetDate}T${targetTime}`);
      if (targetDateTime.getTime() <= Date.now()) {
        return res.status(400).json({ success: false, message: 'Target date/time must be in the future' });
      }

      const schedule = await Schedule.create({
        userId,
        instanceKey,
        name: name ? name.trim() : `Campaign ${targetDate} ${targetTime}`,
        targetDate,
        targetTime,
        targetDateTime,
        recipients,
        message,
        status: 'scheduled'
      });

      res.status(201).json({ success: true, message: 'Campaign scheduled successfully', schedule });
    } catch (err) {
      console.error('Error creating schedule:', err);
      res.status(500).json({ success: false, message: 'Failed to schedule campaign' });
    }
  },

  deleteSchedule: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const schedule = await Schedule.findOne({
        where: { id, userId }
      });

      if (!schedule) {
        return res.status(404).json({ success: false, message: 'Scheduled campaign not found or unauthorized' });
      }

      await schedule.destroy();
      res.json({ success: true, message: 'Scheduled campaign canceled successfully' });
    } catch (err) {
      console.error('Error canceling schedule:', err);
      res.status(500).json({ success: false, message: 'Failed to cancel scheduled campaign' });
    }
  }
};
