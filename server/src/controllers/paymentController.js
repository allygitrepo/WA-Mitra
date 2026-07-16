const { User, Package, Payment } = require("../models/associations");
const razorpayService = require("../services/razorpayService");
const emailService = require("../services/emailService");
const emailTemplates = require("../services/emailTemplate");

const paymentController = {
  createOrder: async (req, res) => {
    try {
      const { packageId } = req.body;
      const userId = req.user.id;

      const pkg = await Package.findByPk(packageId);
      if (!pkg) return res.status(404).json({ message: "Package not found" });

      const user = await User.findByPk(userId);

      // Check one-time package restriction
      if (pkg.isOneTime) {
        const existingPayment = await Payment.findOne({
          where: { userId, packageId, status: 'completed' }
        });
        if (existingPayment) {
          return res.status(400).json({ message: "You have already used this one-time package." });
        }
      }

      // Path A: Free Package
      if (parseFloat(pkg.price) === 0) {
        let expiryDate = null;
        if (pkg.duration !== -1) {
          expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + (pkg.duration || 30));
        }

        // Update User
        user.packageId = pkg.id;
        user.expiresAt = expiryDate;
        await user.save();

        // Create Payment Record
        await Payment.create({
          userId,
          packageId: pkg.id,
          amount: 0,
          currency: 'INR',
          status: 'completed',
          paymentMethod: 'free',
          transactionId: `FREE_${Date.now()}`,
          razorpayOrderId: 'FREE_PLAN'
        });

        // Send plan update email to user asynchronously
        emailService.sendEmail(
          user.email,
          emailTemplates.planChangeEmail(
            user.username,
            pkg.name,
            pkg.price,
            pkg.duration,
            pkg.instanceLimit,
            pkg.messageLimit,
            expiryDate
          )
        ).catch(err => console.error("Error sending free plan activation email:", err));

        return res.status(200).json({ 
          message: "Package activated successfully", 
          isFree: true,
          packageId: pkg.id,
          expiresAt: expiryDate 
        });
      }

      // Path B: Paid Package
      const order = await razorpayService.createOrder(pkg.price);

      // Create Pending Payment Record
      const paymentRecord = await Payment.create({
        userId,
        packageId: pkg.id,
        amount: pkg.price,
        currency: 'INR',
        status: 'pending',
        paymentMethod: 'razorpay',
        razorpayOrderId: order.id
      });

      res.status(200).json({
        isFree: false,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        paymentRecordId: paymentRecord.id
      });

    } catch (error) {
      console.error("Create Order Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  verifyPayment: async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        paymentRecordId 
      } = req.body;

      const isValid = razorpayService.verifyPayment(
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature
      );

      if (!isValid) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      const paymentRecord = await Payment.findByPk(paymentRecordId);
      if (!paymentRecord) return res.status(404).json({ message: "Payment record not found" });

      const pkg = await Package.findByPk(paymentRecord.packageId);
      const user = await User.findByPk(paymentRecord.userId);

      // Check one-time package restriction
      if (pkg.isOneTime) {
        const existingPayment = await Payment.findOne({
          where: { userId: user.id, packageId: pkg.id, status: 'completed' }
        });
        if (existingPayment) {
          return res.status(400).json({ message: "You have already used this one-time package." });
        }
      }

      // Update Payment Record
      paymentRecord.status = 'completed';
      paymentRecord.razorpayPaymentId = razorpay_payment_id;
      paymentRecord.razorpaySignature = razorpay_signature;
      paymentRecord.transactionId = razorpay_payment_id;
      await paymentRecord.save();

      // Update User
      let expiryDate = null;
      if (pkg.duration !== -1) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (pkg.duration || 30));
      }

      user.packageId = pkg.id;
      user.expiresAt = expiryDate;
      await user.save();

      // Send plan update email to user asynchronously
      emailService.sendEmail(
        user.email,
        emailTemplates.planChangeEmail(
          user.username,
          pkg.name,
          pkg.price,
          pkg.duration,
          pkg.instanceLimit,
          pkg.messageLimit,
          expiryDate
        )
      ).catch(err => console.error("Error sending paid plan activation email:", err));

      res.status(200).json({ 
        message: "Payment verified and package activated", 
        packageId: pkg.id,
        expiresAt: expiryDate 
      });

    } catch (error) {
      console.error("Verify Payment Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

module.exports = paymentController;
