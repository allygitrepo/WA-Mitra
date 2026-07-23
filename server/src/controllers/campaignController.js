const { BulkCampaign, BulkMessageStatus } = require("../models/associations");

module.exports = {
  saveCampaign: async (req, res) => {
    try {
      const { name, template, contacts } = req.body;
      const userId = req.user.id;

      if (!name || !template || !contacts || !Array.isArray(contacts)) {
        return res.status(400).json({ success: false, message: "Campaign name, template, and contacts list are required." });
      }

      const campaign = await BulkCampaign.create({
        userId,
        name,
        template,
        contacts
      });

      res.status(201).json({ success: true, campaign });
    } catch (error) {
      console.error("Save Campaign Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  getCampaigns: async (req, res) => {
    try {
      const campaigns = await BulkCampaign.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, campaigns });
    } catch (error) {
      console.error("Get Campaigns Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await BulkCampaign.findOne({ where: { id, userId: req.user.id } });
      if (!campaign) {
        return res.status(404).json({ success: false, message: "Campaign not found or unauthorized" });
      }
      await campaign.destroy();
      res.json({ success: true, message: "Campaign list deleted successfully." });
    } catch (error) {
      console.error("Delete Campaign Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  getCampaignStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await BulkCampaign.findOne({ where: { id, userId: req.user.id } });
      if (!campaign) {
        return res.status(404).json({ success: false, message: "Campaign not found or unauthorized" });
      }

      const statuses = await BulkMessageStatus.findAll({
        where: { campaignId: id },
        order: [['createdAt', 'ASC']]
      });

      res.json({ success: true, campaign, statuses });
    } catch (error) {
      console.error("Get Campaign Status Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Campaign name is required." });
      }

      const campaign = await BulkCampaign.findOne({ where: { id, userId: req.user.id } });
      if (!campaign) {
        return res.status(404).json({ success: false, message: "Campaign not found or unauthorized" });
      }

      campaign.name = name.trim();
      await campaign.save();

      res.json({ success: true, message: "Campaign renamed successfully.", campaign });
    } catch (error) {
      console.error("Update Campaign Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
};
