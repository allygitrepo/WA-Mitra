const { startSession, getStatus, disconnect } = require("../services/whatsappService");

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
};

module.exports = whatsappController;
