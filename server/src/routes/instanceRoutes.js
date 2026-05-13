const express = require("express");
const instanceController = require("../controllers/instanceController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/create", instanceController.createInstance);
router.get("/list", instanceController.listInstances);
router.delete("/:instanceKey", instanceController.deleteInstance);
router.post("/initiate", instanceController.initiateSession);

module.exports = router;
