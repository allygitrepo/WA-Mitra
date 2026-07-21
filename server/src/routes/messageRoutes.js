const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { messageLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.post('/send', messageLimiter, upload.single('file'), messageController.sendMessage);
router.post('/bulk', messageLimiter, upload.single('file'), messageController.sendBulkMessage);
router.get('/logs', messageController.getMessageLogs);
router.get('/reports', messageController.getReports);

module.exports = router;
