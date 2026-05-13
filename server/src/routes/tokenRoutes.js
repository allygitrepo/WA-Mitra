const express = require("express");
const tokenController = require("../controllers/tokenController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate", tokenController.generateToken);
router.get("/", tokenController.getToken);
router.post("/toggle", tokenController.toggleTokenStatus);

module.exports = router;
