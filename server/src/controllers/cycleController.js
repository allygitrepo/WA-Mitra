const { Cycle, WhatsAppInstance } = require('../models/associations');
const fs = require('fs');

module.exports = {
  getCycles: async (req, res) => {
    try {
      const userId = req.user.id;
      const cycles = await Cycle.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      res.json(cycles);
    } catch (err) {
      console.error('Error fetching cycles:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch cycles' });
    }
  },

  createCycle: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, instanceKey, frequency, frequencyConfig, sendTime, message } = req.body;
      const file = req.file;

      // In case recipients is sent as string (e.g. from FormData)
      let parsedRecipients = req.body.recipients;
      if (typeof parsedRecipients === 'string') {
        try {
          parsedRecipients = JSON.parse(parsedRecipients);
        } catch (e) {
          if (file) fs.unlinkSync(file.path);
          return res.status(400).json({ success: false, message: 'Invalid recipients format' });
        }
      }

      // In case frequencyConfig is sent as string (e.g. from FormData)
      let parsedFreqConfig = frequencyConfig;
      if (typeof parsedFreqConfig === 'string') {
        try {
          parsedFreqConfig = JSON.parse(parsedFreqConfig);
        } catch (e) {
          if (file) fs.unlinkSync(file.path);
          return res.status(400).json({ success: false, message: 'Invalid frequencyConfig format' });
        }
      }

      if (!instanceKey) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, message: 'instanceKey is required' });
      }
      if (!name || !name.trim()) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, message: 'Campaign name is required' });
      }
      if (!frequency) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, message: 'Frequency is required' });
      }
      if (!sendTime) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, message: 'Send time is required' });
      }
      if (!parsedRecipients || !Array.isArray(parsedRecipients) || parsedRecipients.length === 0) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, message: 'recipients list is required' });
      }
      if (!message || !message.trim()) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, message: 'Message content is required' });
      }

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });
      if (!instance) {
        if (file) fs.unlinkSync(file.path);
        return res.status(404).json({ success: false, message: 'Instance not found or unauthorized' });
      }

      const cycle = await Cycle.create({
        userId,
        instanceKey,
        name: name.trim(),
        recipients: parsedRecipients,
        frequency,
        frequencyConfig: parsedFreqConfig || {},
        sendTime,
        message,
        mediaPath: file ? file.path : null,
        status: 'active'
      });

      res.status(201).json({ success: true, message: 'Campaign cycle scheduled successfully', cycle });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('Error creating cycle:', err);
      res.status(500).json({ success: false, message: 'Failed to schedule campaign cycle' });
    }
  },

  deleteCycle: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const cycle = await Cycle.findOne({
        where: { id, userId }
      });

      if (!cycle) {
        return res.status(404).json({ success: false, message: 'Campaign cycle not found or unauthorized' });
      }

      if (cycle.mediaPath && fs.existsSync(cycle.mediaPath)) {
        try {
          fs.unlinkSync(cycle.mediaPath);
        } catch (e) {
          console.error('Failed to delete media file:', e);
        }
      }

      await cycle.destroy();
      res.json({ success: true, message: 'Campaign cycle deleted successfully' });
    } catch (err) {
      console.error('Error deleting cycle:', err);
      res.status(500).json({ success: false, message: 'Failed to delete campaign cycle' });
    }
  }
};
