const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/create-order", paymentController.createOrder);
router.post("/verify-payment", paymentController.verifyPayment);

module.exports = router;
