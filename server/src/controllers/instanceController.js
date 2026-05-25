const crypto = require("crypto");
const WhatsAppInstance = require("../models/instanceModel");
const { Package } = require("../models/associations");
const { startSession, disconnect, getStatus, getSock } = require("../services/whatsappService");

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
          qr: liveStatus.qr,
          pushName: liveStatus.pushName || inst.pushName,
          profilePic: liveStatus.profilePic || inst.profilePic
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
      const instanceKey = req.params.instanceKey || req.query.instanceKey || req.body.instanceKey;
      const userId = req.user.id;

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });

      if (!instance) {
        return res.status(404).json({ success: false, message: "Instance not found" });
      }

      // Disconnect if active (this now also deletes from DB and cleans folder)
      await disconnect(instanceKey);

      res.status(200).json({ success: true, message: "Instance deleted successfully" });
    } catch (error) {
      console.error("Delete Instance Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  initiateSession: async (req, res) => {
    try {
      let { instanceKey, name: customName } = req.body;
      const userId = req.user.id;

      // If no instanceKey provided (External API flow), create a new one automatically
      if (!instanceKey) {
        const count = await WhatsAppInstance.count({ where: { userId } });
        const name = customName || `Session ${count + 1}`;
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

      if (result && result.connected) {
        let profileImage = null;
        if (result.profilePic) {
          try {
            const axios = require('axios');
            const response = await axios.get(result.profilePic, { responseType: 'arraybuffer' });
            const base64 = Buffer.from(response.data, 'binary').toString('base64');
            profileImage = `data:image/jpeg;base64,${base64}`;
          } catch (e) { }
        }

        return res.status(200).json({
          success: true,
          message: "Instance already connected",
          status: "connected",
          instanceKey,
          profileImage,
          name: result.pushName || "",
          phone: result.phone || ""
        });
      }

      res.status(200).json({
        success: true,
        message: result ? (result.qr ? "QR generated successfully" : "Session initialization started") : "Session initialization started",
        status: result ? result.status : 'connecting',
        qr: result ? result.qr : null,
        validinsecond: 40,
        instanceKey
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
      
      let profileImage = null;
      const picUrl = liveStatus.profilePic || instance.profilePic;
      if (picUrl) {
        try {
          const axios = require('axios');
          const response = await axios.get(picUrl, { responseType: 'arraybuffer' });
          const base64 = Buffer.from(response.data, 'binary').toString('base64');
          profileImage = `data:image/jpeg;base64,${base64}`;
        } catch (e) { }
      }

      res.status(200).json({
        success: true,
        status: liveStatus.status,
        qr: liveStatus.qr,
        connected: liveStatus.connected,
        instanceKey,
        profileImage,
        name: liveStatus.pushName || instance.pushName || "",
        phone: liveStatus.phone || instance.phone || ""
      });
    } catch (error) {
      console.error("Fetch Status Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  getGroups: async (req, res) => {
    try {
      const instanceKey = req.params.instanceKey || req.query.instanceKey;
      const userId = req.user.id;

      if (!instanceKey) {
        return res.status(400).json({ success: false, message: "instanceKey is required" });
      }

      const instance = await WhatsAppInstance.findOne({ where: { instanceKey, userId } });
      if (!instance) {
        return res.status(404).json({ success: false, message: "Instance not found or unauthorized" });
      }

      const sock = getSock(instanceKey);
      if (!sock) {
        return res.status(400).json({ success: false, message: "WhatsApp not connected for this instance" });
      }

      const groups = await sock.groupFetchAllParticipating();
      
      const mappedGroups = Object.keys(groups).map(key => ({
        id: key,
        subject: groups[key].subject || 'Unnamed Group',
        participantsCount: groups[key].participants ? groups[key].participants.length : 0
      }));

      // Sort alphabetically by subject (case-insensitive)
      const sortedGroups = mappedGroups.sort((a, b) => 
        a.subject.toLowerCase().localeCompare(b.subject.toLowerCase())
      );

      res.status(200).json({ success: true, groups: sortedGroups });
    } catch (error) {
      console.error("Fetch Groups Error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }
};

module.exports = instanceController;
