const { Template } = require('../models/associations');

module.exports = {
  getTemplates: async (req, res) => {
    try {
      const userId = req.user.id;
      const templates = await Template.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      res.json(templates);
    } catch (err) {
      console.error('Error fetching templates:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch templates' });
    }
  },

  createTemplate: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, content } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Template name is required' });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Template content is required' });
      }

      // Check if template with same name already exists for this user
      const existing = await Template.findOne({
        where: { userId, name: name.trim() }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A template with this name already exists' });
      }

      const template = await Template.create({
        userId,
        name: name.trim(),
        content: content
      });

      res.status(201).json({ success: true, message: 'Template created successfully', template });
    } catch (err) {
      console.error('Error creating template:', err);
      res.status(500).json({ success: false, message: 'Failed to create template' });
    }
  },

  deleteTemplate: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const template = await Template.findOne({
        where: { id, userId }
      });

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found or unauthorized' });
      }

      await template.destroy();
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (err) {
      console.error('Error deleting template:', err);
      res.status(500).json({ success: false, message: 'Failed to delete template' });
    }
  }
};
