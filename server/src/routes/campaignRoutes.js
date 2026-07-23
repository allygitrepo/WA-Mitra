const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', campaignController.saveCampaign);
router.get('/', campaignController.getCampaigns);
router.delete('/:id', campaignController.deleteCampaign);
router.get('/:id/status', campaignController.getCampaignStatus);
router.put('/:id', campaignController.updateCampaign);

module.exports = router;
