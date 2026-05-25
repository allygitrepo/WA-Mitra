const express = require('express');
const router = express.Router();
const cycleController = require('../controllers/cycleController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', cycleController.getCycles);
router.post('/', upload.single('file'), cycleController.createCycle);
router.delete('/:id', cycleController.deleteCycle);

module.exports = router;
