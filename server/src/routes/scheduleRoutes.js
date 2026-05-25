const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', scheduleController.getSchedules);
router.post('/', upload.single('file'), scheduleController.createSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
