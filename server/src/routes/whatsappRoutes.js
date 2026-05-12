const express = require("express");
const whatsappController = require("../controllers/whatsappController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/status", whatsappController.status);
router.post("/start", whatsappController.start);
router.post("/logout", whatsappController.logout);

module.exports = router;
