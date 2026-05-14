const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const razorpayService = {
  createOrder: async (amount, currency = "INR") => {
    try {
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error("Razorpay Create Order Error:", error);
      throw error;
    }
  },

  verifyPayment: (razorpayOrderId, razorpayPaymentId, signature) => {
    try {
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
      console.error("Razorpay Verify Payment Error:", error);
      return false;
    }
  },
};

module.exports = razorpayService;
