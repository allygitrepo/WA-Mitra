const { User, Package, WhatsAppInstance, MessageLog, Payment, AutoReplyRule, ApiToken, Template, Schedule, Cycle } = require("../models/associations");
const whatsappService = require("../services/whatsappService");
const emailService = require("../services/emailService");
const emailTemplates = require("../services/emailTemplate");
const { Op } = require("sequelize");

const adminController = {
  // User Management
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        where: {
          [Op.or]: [
            { role: 'admin' },
            { role: 'user', isVerified: true }
          ]
        },
        attributes: { exclude: ["password", "otp", "otpExpiry"] },
        include: [
          { model: Package, as: "package" },
          { model: Package, as: "nextPackage" },
          { model: WhatsAppInstance, as: "instances", attributes: ["id", "name", "instanceKey", "phone", "status", "messageCount"] },
          {
            model: Payment,
            as: "payments",
            limit: 1,
            order: [['createdAt', 'DESC']],
            where: { status: 'completed' },
            required: false
          }
        ],
      });
      res.status(200).json({ users });
    } catch (error) {
      console.error("Get All Users Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  createUser: async (req, res) => {
    try {
      const { username, email, phone, orgName, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required." });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        email,
        phone,
        orgName,
        password: hashedPassword,
        role: role || "user",
        status: "active",
        isVerified: true
      });

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status
        }
      });
    } catch (error) {
      console.error("Create User Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { userId, status, reason } = req.body; // 'active' or 'suspended', optional reason
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.status = status;
      if (status === "suspended") {
        user.suspendReason = reason || null;
        // Disconnect all active WhatsApp instances for this user
        const instances = await WhatsAppInstance.findAll({ where: { userId } });
        for (const instance of instances) {
          try {
            await whatsappService.disconnect(instance.instanceKey);
          } catch (disconnectErr) {
            console.error(`Error disconnecting instance ${instance.instanceKey} during user suspension:`, disconnectErr);
          }
        }
      } else {
        // Clear suspendReason when reactivating
        user.suspendReason = null;
      }
      await user.save();

      res.status(200).json({
        message: `User status updated to ${status}`,
        suspendReason: user.suspendReason
      });
    } catch (error) {
      console.error("Update User Status Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if trying to delete an admin
      if (user.role === 'admin') {
        return res.status(400).json({ message: "Cannot delete admin accounts" });
      }

      // 1. Fetch all WhatsApp instances for this user
      const instances = await WhatsAppInstance.findAll({ where: { userId: id } });
      const instanceIds = instances.map(inst => inst.id);
      const instanceKeys = instances.map(inst => inst.instanceKey);

      // 2. Delete MessageLogs for these instances
      if (instanceIds.length > 0) {
        await MessageLog.destroy({ where: { instanceId: { [Op.in]: instanceIds } } });
      }

      // 3. Delete AutoReplyRules for these instances
      if (instanceKeys.length > 0) {
        await AutoReplyRule.destroy({ where: { instanceKey: { [Op.in]: instanceKeys } } });
      }

      // 4. Disconnect and delete sessions from Baileys & memory
      for (const instance of instances) {
        try {
          await whatsappService.disconnect(instance.instanceKey);
        } catch (err) {
          console.error(`Error disconnecting instance ${instance.instanceKey} during user delete:`, err);
        }
      }

      // 5. Delete other associations
      await ApiToken.destroy({ where: { userId: id } });
      await Template.destroy({ where: { userId: id } });
      await Schedule.destroy({ where: { userId: id } });
      await Cycle.destroy({ where: { userId: id } });
      await Payment.destroy({ where: { userId: id } });

      // 6. Finally delete the user
      await user.destroy();

      res.status(200).json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
      console.error("Delete User Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  assignPackage: async (req, res) => {
    try {
      const { userId, packageId } = req.body;
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!packageId) {
        user.packageId = null;
        user.expiresAt = null;
        await user.save();
        return res.status(200).json({ message: "Package removed from user" });
      }

      const pkg = await Package.findByPk(packageId);
      if (!pkg) return res.status(404).json({ message: "Package not found" });

      let expiryDate = null;
      if (pkg.duration !== -1) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (pkg.duration || 30));
      }

      user.packageId = packageId;
      user.expiresAt = expiryDate;
      await user.save();

      // Record a manual payment record for record-keeping
      await Payment.create({
        userId: user.id,
        packageId: pkg.id,
        amount: 0, // Manual assignment should not count towards revenue
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'manual_admin',
        transactionId: `ADMIN_ASSIGN_${Date.now()}`,
        razorpayOrderId: 'MANUALLY_ASSIGNED'
      });

      // Send plan update email to user asynchronously
      emailService.sendEmail(
        user.email,
        emailTemplates.planChangeEmail(
          user.username,
          pkg.name,
          pkg.price,
          pkg.duration,
          pkg.instanceLimit,
          pkg.messageLimit,
          expiryDate
        )
      ).catch(err => console.error("Error sending plan assignment email:", err));

      res.status(200).json({ message: "Package assigned successfully", expiresAt: expiryDate });
    } catch (error) {
      console.error("Assign Package Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  extendExpiry: async (req, res) => {
    try {
      const { userId, expiresAt } = req.body;
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.expiresAt = expiresAt ? new Date(expiresAt) : null;
      await user.save();

      // Send validity update email to user asynchronously
      emailService.sendEmail(
        user.email,
        emailTemplates.expiryExtensionEmail(user.username, user.expiresAt)
      ).catch(err => console.error("Error sending expiry extension email:", err));

      res.status(200).json({ message: "User expiry date updated successfully", expiresAt: user.expiresAt });
    } catch (error) {
      console.error("Extend Expiry Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Package Management
  getAllPackages: async (req, res) => {
    try {
      const packages = await Package.findAll();
      res.status(200).json({ packages });
    } catch (error) {
      console.error("Get All Packages Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  createPackage: async (req, res) => {
    try {
      const pkg = await Package.create(req.body);
      res.status(201).json({ message: "Package created successfully", pkg });
    } catch (error) {
      console.error("Create Package Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  updatePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const pkg = await Package.findByPk(id);
      if (!pkg) return res.status(404).json({ message: "Package not found" });

      await pkg.update(req.body);
      res.status(200).json({ message: "Package updated successfully", pkg });
    } catch (error) {
      console.error("Update Package Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  deletePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const pkg = await Package.findByPk(id);
      if (!pkg) return res.status(404).json({ message: "Package not found" });

      await pkg.destroy();
      res.status(200).json({ message: "Package deleted successfully" });
    } catch (error) {
      console.error("Delete Package Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Stats
  getSystemStats: async (req, res) => {
    try {
      const totalUsers = await User.count({ where: { role: { [Op.ne]: 'admin' }, isVerified: true } });
      const totalInstances = await WhatsAppInstance.count({
        include: [{
          model: User,
          as: 'user',
          required: true,
          where: { role: { [Op.ne]: 'admin' }, isVerified: true }
        }]
      });
      const totalMessages = await MessageLog.count({
        include: [{
          model: WhatsAppInstance,
          as: 'instance',
          required: true,
          include: [{
            model: User,
            as: 'user',
            required: true,
            where: { role: { [Op.ne]: 'admin' }, isVerified: true }
          }]
        }]
      });
      const totalRevenue = await Payment.sum('amount', { where: { status: 'completed' } }) || 0;

      res.status(200).json({
        totalUsers,
        totalInstances,
        totalMessages,
        totalRevenue
      });
    } catch (error) {
      console.error("Get Stats Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getAllPayments: async (req, res) => {
    try {
      const sequelize = require("../config/db");
      const payments = await Payment.findAll({
        where: {
          amount: { [Op.gt]: 0 }
        },
        include: [
          { model: User, as: 'user', attributes: ['username', 'email'] },
          { model: Package, as: 'package', attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json({ payments });
    } catch (error) {
      console.error("Get Payments Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getDailyAnalytics: async (req, res) => {
    try {
      const sequelize = require("../config/db");
      const { range } = req.query;

      let days = 6;
      if (range === 'monthly') days = 29;

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - days);

      // 1. Unique users sending messages
      const messageInteractions = await MessageLog.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('MessageLog.createdAt')), 'date'],
          [sequelize.col('instance.userId'), 'userId']
        ],
        include: [{
          model: WhatsAppInstance,
          as: 'instance',
          attributes: [],
          required: true,
          include: [{
            model: User,
            as: 'user',
            attributes: [],
            required: true,
            where: { role: { [Op.ne]: 'admin' }, isVerified: true }
          }]
        }],
        where: { createdAt: { [Op.gte]: startDate } },
        group: [
          sequelize.fn('DATE', sequelize.col('MessageLog.createdAt')),
          sequelize.col('instance.userId')
        ],
        raw: true
      });

      // 2. New User registrations
      const userRegistrations = await User.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          ['id', 'userId']
        ],
        where: {
          createdAt: { [Op.gte]: startDate },
          role: { [Op.ne]: 'admin' },
          isVerified: true
        },
        raw: true
      });

      // 3. New Instance creations
      const instanceCreations = await WhatsAppInstance.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('WhatsAppInstance.createdAt')), 'date'],
          ['userId', 'userId']
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: [],
          required: true,
          where: { role: { [Op.ne]: 'admin' }, isVerified: true }
        }],
        where: { createdAt: { [Op.gte]: startDate } },
        group: [
          sequelize.fn('DATE', sequelize.col('WhatsAppInstance.createdAt')),
          sequelize.col('userId')
        ],
        raw: true
      });

      // Combine all activities into a daily unique user interaction map
      const dailyMap = {};

      const processActivity = (data) => {
        data.forEach(item => {
          if (!item.userId) return;
          const dateStr = item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date;
          if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = new Set();
          }
          dailyMap[dateStr].add(item.userId.toString());
        });
      };

      processActivity(messageInteractions);
      processActivity(userRegistrations);
      processActivity(instanceCreations);

      let totalInteractions = 0;
      const formattedData = [];
      for (let i = days; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const activeUsersSet = dailyMap[dateStr] || new Set();
        const count = activeUsersSet.size;
        totalInteractions += count;

        formattedData.push({
          date: d.toLocaleDateString('en-US', {
            weekday: range === 'monthly' ? undefined : 'short',
            month: 'short',
            day: 'numeric'
          }),
          users: count
        });
      }

      res.status(200).json({
        dailyInteractions: formattedData,
        totalInteractions
      });
    } catch (error) {
      console.error("Daily Analytics Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  },

  getRevenueAnalytics: async (req, res) => {
    try {
      const sequelize = require("../config/db");
      const { range } = req.query;

      let days = 6;
      if (range === 'monthly') days = 29;

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - days);

      const revenueData = await Payment.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        where: {
          status: 'completed',
          createdAt: { [Op.gte]: startDate }
        },
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        raw: true
      });

      const dailyMap = {};
      revenueData.forEach(item => {
        const dateStr = item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date;
        dailyMap[dateStr] = parseFloat(item.total) || 0;
      });

      let totalRevenue = 0;
      const formattedData = [];
      for (let i = days; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const amount = dailyMap[dateStr] || 0;
        totalRevenue += amount;

        formattedData.push({
          date: d.toLocaleDateString('en-US', {
            weekday: range === 'monthly' ? undefined : 'short',
            month: 'short',
            day: 'numeric'
          }),
          amount: amount
        });
      }

      res.status(200).json({
        dailyRevenue: formattedData,
        totalRevenue
      });
    } catch (error) {
      console.error("Revenue Analytics Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  },

  getRecentActivity: async (req, res) => {
    try {
      const logs = await MessageLog.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: WhatsAppInstance,
            as: 'instance',
            attributes: ['name'],
            required: true,
            include: [{
              model: User,
              as: 'user',
              attributes: ['username'],
              required: true,
              where: { role: { [Op.ne]: 'admin' } }
            }]
          }
        ]
      });

      const formattedLogs = logs.map(log => ({
        id: log.id,
        type: 'message',
        status: log.status,
        recipient: log.recipient,
        instanceName: log.instance?.name || 'Unknown',
        username: log.instance?.user?.username || 'Unknown',
        time: log.createdAt
      }));

      res.status(200).json({ activity: formattedLogs });
    } catch (error) {
      console.error("Recent Activity Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

module.exports = adminController;
