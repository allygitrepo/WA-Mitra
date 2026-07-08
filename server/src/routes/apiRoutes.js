const express = require("express");
const messageController = require("../controllers/messageController");
const instanceController = require("../controllers/instanceController");
const scheduleController = require("../controllers/scheduleController");
const cycleController = require("../controllers/cycleController");
const apiAuthMiddleware = require("../middleware/apiAuthMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// All routes here require the Master API Token (x-api-token header)
router.use(apiAuthMiddleware);

// Instance Management (External)
router.post("/instance/create", instanceController.createInstance);
router.get("/instance/list", instanceController.listInstances);
router.post("/instance/initiate", instanceController.initiateSession);
router.get("/instance/status", instanceController.fetchStatus);
router.delete("/instance/delete", instanceController.deleteInstance); // Added delete route
router.delete("/instance/:instanceKey", instanceController.deleteInstance); // Support both query and param if needed

// Messaging (External)
router.post("/messages/send", upload.single('file'), messageController.sendMessage);
router.post("/messages/bulk", messageController.sendBulkMessage);
router.post("/messages/schedule", upload.single('file'), scheduleController.createSchedule);
router.post("/messages/cycle", upload.single('file'), cycleController.createCycle);

module.exports = router;
