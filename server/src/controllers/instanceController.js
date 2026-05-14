const crypto = require("crypto");
const WhatsAppInstance = require("../models/instanceModel");
const { Package } = require("../models/associations");
const { startSession, disconnect, getStatus } = require("../services/whatsappService");

const instanceController = {
  createInstance: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name: customName } = req.body;

      // Check package limits
      const userWithPackage = await req.user.getPackage();
      const currentInstances = await WhatsAppInstance.count({ where: { userId } });

      if (userWithPackage && 
          userWithPackage.instanceLimit !== -1 && 
          currentInstances >= userWithPackage.instanceLimit) {
        return res.status(403).json({
          success: false,
          message: `Limit reached. Your current package allows maximum ${userWithPackage.instanceLimit} instances.`
        });
      }

      // Use custom name or count existing instances to name it Session 1, 2, etc.
      const name = customName || `Session ${currentInstances + 1}`;
      const instanceKey = `inst_${crypto.randomBytes(8).toString("hex")}`;

      const instance = await WhatsAppInstance.create({
        userId,
        instanceKey,
        name,
      });

      res.status(201).json({
        success: true,
        message: "Instance created successfully",
        instance,
      });
    } catch (error) {
      console.error("Create Instance Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  listInstances: async (req, res) => {
    try {
      const userId = req.user.id;
      const { Op } = require("sequelize");

      // Show all sessions for the user
      const instances = await WhatsAppInstance.findAll({
        where: { userId },
        order: [['id', 'ASC']]
      });

      // Add live status from memory
      const instancesWithStatus = instances.map(inst => {
        const liveStatus = getStatus(inst.instanceKey);
        return {
          ...inst.toJSON(),
          liveStatus: liveStatus.status,
          qr: liveStatus.qr
        };
      });

      res.status(200).json({ success: true, instances: instancesWithStatus });
    } catch (error) {
      console.error("List Instances Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  deleteInstance: async (req, res) => {
    try {
      const { instanceKey } = req.params;
      const userId = req.user.id;

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });

      if (!instance) {
        return res.status(404).json({ success: false, message: "Instance not found" });
      }

      // Disconnect if active
      await disconnect(instanceKey);

      // Delete from DB
      await instance.destroy();

      res.status(200).json({ success: true, message: "Instance deleted successfully" });
    } catch (error) {
      console.error("Delete Instance Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  initiateSession: async (req, res) => {
    try {
      let { instanceKey } = req.body;
      const userId = req.user.id;

      // If no instanceKey provided (External API flow), create a new one automatically
      if (!instanceKey) {
        const count = await WhatsAppInstance.count({ where: { userId } });
        const name = `Session ${count + 1}`;
        instanceKey = `inst_${crypto.randomBytes(8).toString("hex")}`;

        await WhatsAppInstance.create({
          userId,
          instanceKey,
          name,
        });
      }

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });
      if (!instance) {
        return res.status(404).json({ success: false, message: "Instance not found" });
      }

      await startSession(instanceKey);

      // Wait a moment to see if QR is generated immediately
      let attempts = 0;
      const checkQR = async () => {
        const liveStatus = getStatus(instanceKey);
        if (liveStatus.qr || liveStatus.connected) {
          return liveStatus;
        }
        if (attempts > 10) return null; // Wait max 10 seconds for initial QR
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return checkQR();
      };

      const result = await checkQR();

      res.status(200).json({
        success: true,
        message: "Session initialization started",
        status: result ? result.status : 'connecting',
        qr: result ? result.qr : null,
        instanceKey // Always return the key so the user can use it for subsequent calls
      });
    } catch (error) {
      console.error("Initiate Session Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  fetchStatus: async (req, res) => {
    try {
      const { instanceKey } = req.query;
      const userId = req.user.id;

      if (!instanceKey) return res.status(400).json({ success: false, message: "instanceKey is required" });

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });
      if (!instance) {
        return res.status(404).json({ success: false, message: "Instance not found" });
      }

      const liveStatus = getStatus(instanceKey);
      res.status(200).json({
        success: true,
        status: liveStatus.status,
        qr: liveStatus.qr,
        connected: liveStatus.connected,
        phone: liveStatus.phone,
        instanceKey
      });
    } catch (error) {
      console.error("Fetch Status Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
};

module.exports = instanceController;
