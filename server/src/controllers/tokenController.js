const crypto = require("crypto");
const ApiToken = require("../models/apiTokenModel");

const tokenController = {
  generateToken: async (req, res) => {
    try {
      const userId = req.user.id;

      // Check if token already exists for this user
      let apiToken = await ApiToken.findOne({ where: { userId } });

      const newTokenValue = `mitra_${crypto.randomBytes(24).toString("hex")}`;

      if (apiToken) {
        apiToken.token = newTokenValue;
        await apiToken.save();
      } else {
        apiToken = await ApiToken.create({
          userId,
          token: newTokenValue,
        });
      }

      res.status(200).json({
        success: true,
        message: "API Token generated successfully",
        token: apiToken.token,
      });
    } catch (error) {
      console.error("Generate Token Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  getToken: async (req, res) => {
    try {
      const userId = req.user.id;
      const apiToken = await ApiToken.findOne({ where: { userId } });

      res.status(200).json({
        success: true,
        tokens: apiToken ? [apiToken] : [],
      });
    } catch (error) {
      console.error("Get Token Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  toggleTokenStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      const apiToken = await ApiToken.findOne({ where: { userId } });

      if (!apiToken) {
        return res.status(404).json({ success: false, message: "No API token found" });
      }

      apiToken.isActive = !apiToken.isActive;
      await apiToken.save();

      res.status(200).json({
        success: true,
        message: `Token ${apiToken.isActive ? "enabled" : "disabled"} successfully`,
        isActive: apiToken.isActive,
      });
    } catch (error) {
      console.error("Toggle Token Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = tokenController;
