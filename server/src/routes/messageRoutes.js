const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/send', upload.single('file'), messageController.sendMessage);
router.post('/bulk', messageController.sendBulkMessage);
router.get('/logs', messageController.getMessageLogs);
router.get('/reports', messageController.getReports);

module.exports = router;
