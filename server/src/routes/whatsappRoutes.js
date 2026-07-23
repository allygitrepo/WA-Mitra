const express = require("express");
const whatsappController = require("../controllers/whatsappController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/status", whatsappController.status);
router.post("/start", whatsappController.start);
router.post("/logout", whatsappController.logout);
router.post("/auto-reply/sync", whatsappController.syncRules);
router.get("/auto-reply/rules", whatsappController.getRules);
router.post("/check-numbers", whatsappController.checkNumbers);

module.exports = router;
