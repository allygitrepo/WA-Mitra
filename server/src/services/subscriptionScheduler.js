const { User, Package } = require('../models/associations');
const { Op } = require('sequelize');
const emailService = require('./emailService');
const emailTemplates = require('./emailTemplate');

const subscriptionScheduler = {
  /**
   * Evaluates a single user's subscription state.
   * If current plan is expired and a nextPackageId is scheduled, it activates the next package.
   */
  processUserSubscription: async (userId) => {
    try {
      const user = await User.findByPk(userId, {
        include: [
          { model: Package, as: 'package' },
          { model: Package, as: 'nextPackage' }
        ]
      });

      if (!user) return;

      const now = new Date();

      // Check if current plan is expired and there is a queued nextPackage
      if (user.expiresAt && new Date(user.expiresAt) <= now && user.nextPackageId) {
        const nextPkg = user.nextPackage || await Package.findByPk(user.nextPackageId);

        if (nextPkg) {
          let newExpiryDate = null;
          if (nextPkg.duration !== -1) {
            newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + (nextPkg.duration || 30));
          }

          // Activate scheduled package
          user.packageId = nextPkg.id;
          user.expiresAt = newExpiryDate;
          user.nextPackageId = null;
          user.nextPackageStartsAt = null;
          await user.save();

          console.log(`[SubscriptionScheduler] Auto-activated queued package ${nextPkg.name} for User ID ${user.id}`);

          // Send activation notification email
          emailService.sendEmail(
            user.email,
            emailTemplates.planChangeEmail(
              user.username,
              nextPkg.name,
              nextPkg.price,
              nextPkg.duration,
              nextPkg.instanceLimit,
              nextPkg.messageLimit,
              newExpiryDate
            )
          ).catch(err => console.error("Error sending scheduled plan activation email:", err));
        }
      }
    } catch (error) {
      console.error("[SubscriptionScheduler] Error processing user subscription:", error);
    }
  },

  /**
   * Scans all users with scheduled plans where current plan has expired and processes them.
   */
  processAllExpiredSubscriptions: async () => {
    try {
      const now = new Date();
      const expiredUsersWithNextPlan = await User.findAll({
        where: {
          expiresAt: { [Op.lte]: now },
          nextPackageId: { [Op.ne]: null }
        }
      });

      for (const user of expiredUsersWithNextPlan) {
        await subscriptionScheduler.processUserSubscription(user.id);
      }
    } catch (error) {
      console.error("[SubscriptionScheduler] Error checking all subscriptions:", error);
    }
  }
};

module.exports = subscriptionScheduler;
