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
        const now = new Date();
        const hasActivePlan = user.expiresAt && new Date(user.expiresAt) > now;
        const isSamePackage = user.packageId === pkg.id;

        let finalExpiryDate = null;
        let isQueued = false;

        if (hasActivePlan && isSamePackage) {
          // Extension of current active plan
          finalExpiryDate = new Date(user.expiresAt);
          if (pkg.duration !== -1) {
            finalExpiryDate.setDate(finalExpiryDate.getDate() + (pkg.duration || 30));
          } else {
            finalExpiryDate = null;
          }
          user.expiresAt = finalExpiryDate;
          await user.save();
        } else if (hasActivePlan && !isSamePackage) {
          // Queue the new plan to activate when current plan expires
          user.nextPackageId = pkg.id;
          user.nextPackageStartsAt = user.expiresAt;
          await user.save();
          isQueued = true;
          finalExpiryDate = user.expiresAt;
        } else {
          // Immediate activation
          if (pkg.duration !== -1) {
            finalExpiryDate = new Date();
            finalExpiryDate.setDate(finalExpiryDate.getDate() + (pkg.duration || 30));
          }
          user.packageId = pkg.id;
          user.expiresAt = finalExpiryDate;
          user.nextPackageId = null;
          user.nextPackageStartsAt = null;
          await user.save();
        }

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
            finalExpiryDate
          )
        ).catch(err => console.error("Error sending free plan activation email:", err));

        return res.status(200).json({ 
          message: isQueued ? `Package scheduled to activate on ${new Date(user.expiresAt).toLocaleDateString()}` : "Package activated successfully", 
          isFree: true,
          isQueued,
          packageId: user.packageId,
          nextPackageId: user.nextPackageId,
          expiresAt: user.expiresAt 
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
      res.status(500).json({ message: error.message || "Failed to create payment order" });
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

      // Update User Plan / Queue
      const now = new Date();
      const hasActivePlan = user.expiresAt && new Date(user.expiresAt) > now;
      const isSamePackage = user.packageId === pkg.id;

      let finalExpiryDate = null;
      let isQueued = false;

      if (hasActivePlan && isSamePackage) {
        // Renewal / Extension of current active plan
        finalExpiryDate = new Date(user.expiresAt);
        if (pkg.duration !== -1) {
          finalExpiryDate.setDate(finalExpiryDate.getDate() + (pkg.duration || 30));
        } else {
          finalExpiryDate = null;
        }
        user.expiresAt = finalExpiryDate;
        await user.save();
      } else if (hasActivePlan && !isSamePackage) {
        // Queue the new package to activate automatically when current plan expires
        user.nextPackageId = pkg.id;
        user.nextPackageStartsAt = user.expiresAt;
        await user.save();
        isQueued = true;
        finalExpiryDate = user.expiresAt;
      } else {
        // Immediate activation for new/expired user
        if (pkg.duration !== -1) {
          finalExpiryDate = new Date();
          finalExpiryDate.setDate(finalExpiryDate.getDate() + (pkg.duration || 30));
        }
        user.packageId = pkg.id;
        user.expiresAt = finalExpiryDate;
        user.nextPackageId = null;
        user.nextPackageStartsAt = null;
        await user.save();
      }

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
          finalExpiryDate
        )
      ).catch(err => console.error("Error sending paid plan activation email:", err));

      res.status(200).json({ 
        message: isQueued ? `Package scheduled to activate on ${new Date(user.expiresAt).toLocaleDateString()}` : "Payment verified and package activated", 
        isQueued,
        packageId: user.packageId,
        nextPackageId: user.nextPackageId,
        expiresAt: user.expiresAt 
      });

    } catch (error) {
      console.error("Verify Payment Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

module.exports = paymentController;
