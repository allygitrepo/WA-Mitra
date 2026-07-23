const { startSession, getStatus, disconnect, getSock } = require("../services/whatsappService");
const WhatsAppInstance = require("../models/instanceModel");

const whatsappController = {
  start: async (req, res) => {
    try {
      const sessionId = `user_${req.user.id}`;
      await startSession(sessionId);
      res.status(200).json({ success: true, message: "Session initialization started" });
    } catch (error) {
      console.error("Start Session Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  status: async (req, res) => {
    try {
      const sessionId = `user_${req.user.id}`;
      const status = getStatus(sessionId);
      res.status(200).json({ success: true, ...status });
    } catch (error) {
      console.error("Get Status Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      const sessionId = `user_${req.user.id}`;
      await disconnect(sessionId);
      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  syncRules: async (req, res) => {
    try {
      const { instanceKey, rules } = req.body;
      const userId = req.user.id;

      if (!instanceKey) {
        return res.status(400).json({ success: false, message: "instanceKey is required" });
      }
      if (!Array.isArray(rules)) {
        return res.status(400).json({ success: false, message: "rules must be an array" });
      }

      // Verify ownership
      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });
      if (!instance) {
        return res.status(404).json({ success: false, message: "Instance not found or unauthorized" });
      }

      const { syncInstanceRules } = require("../services/whatsappService");
      await syncInstanceRules(instanceKey, rules);

      res.status(200).json({ success: true, message: "Rules synchronized successfully" });
    } catch (error) {
      console.error("Sync Rules Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  getRules: async (req, res) => {
    try {
      const { instanceKey } = req.query;
      const userId = req.user.id;

      if (!instanceKey) {
        return res.status(400).json({ success: false, message: "instanceKey is required" });
      }

      // Verify ownership
      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });
      if (!instance) {
        return res.status(404).json({ success: false, message: "Instance not found or unauthorized" });
      }

      const { getInstanceRules } = require("../services/whatsappService");
      const rules = await getInstanceRules(instanceKey);

      res.status(200).json({ success: true, rules });
    } catch (error) {
      console.error("Get Rules Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  checkNumbers: async (req, res) => {
    try {
      const { instanceKey, numbers } = req.body;
      if (!instanceKey || !Array.isArray(numbers)) {
        return res.status(400).json({ success: false, message: "instanceKey and numbers array are required" });
      }

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId: req.user.id } });
      if (!instance) {
        return res.status(404).json({ success: false, message: "Instance not found or unauthorized" });
      }

      const sock = getSock(instanceKey);
      if (!sock) {
        return res.status(400).json({ success: false, message: "WhatsApp not connected for this instance" });
      }

      const results = [];
      const batchSize = 10;
      for (let i = 0; i < numbers.length; i += batchSize) {
        const batch = numbers.slice(i, i + batchSize);
        const batchPromises = batch.map(async (num) => {
          try {
            const cleanNumber = num.replace(/\D/g, '');
            if (!cleanNumber) return { number: num, exists: false, error: 'Invalid number format' };
            const [waResult] = await sock.onWhatsApp(cleanNumber);
            return {
              number: num,
              exists: !!(waResult && waResult.exists),
              jid: waResult ? waResult.jid : null
            };
          } catch (e) {
            return { number: num, exists: false, error: e.message };
          }
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        if (i + batchSize < numbers.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.status(200).json({ success: true, results });
    } catch (error) {
      console.error("Check Numbers Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = whatsappController;
