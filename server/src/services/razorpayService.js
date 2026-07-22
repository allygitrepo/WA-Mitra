const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing in server environment (.env)");
  }
  return new Razorpay({ key_id, key_secret });
};

const razorpayService = {
  createOrder: async (amount, currency = "INR") => {
    try {
      const parsedAmount = Math.round(parseFloat(amount) * 100);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Invalid order amount provided");
      }
      const options = {
        amount: parsedAmount, // amount in smallest currency unit (paise)
        currency,
        receipt: `receipt_${Date.now()}`,
      };
      const razorpay = getRazorpayInstance();
      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      const errorMsg = error.error?.description || error.description || error.message || "Failed to create Razorpay order";
      console.error("Razorpay Create Order Error:", errorMsg);
      throw new Error(errorMsg);
    }
  },

  verifyPayment: (razorpayOrderId, razorpayPaymentId, signature) => {
    try {
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_secret) {
        console.error("Razorpay verifyPayment Error: RAZORPAY_KEY_SECRET is missing");
        return false;
      }
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
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
