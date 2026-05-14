const express = require("express");
const { Package } = require("../models/associations");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const packages = await Package.findAll({
      where: { isActive: true },
      order: [['price', 'ASC']]
    });
    res.status(200).json({ packages });
  } catch (error) {
    console.error("Fetch Plans Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/availability", authMiddleware, async (req, res) => {
  try {
    const { Payment } = require("../models/associations");
    const userId = req.user?.id;
    if (!userId) return res.status(200).json({ purchasedPackageIds: [] });

    const purchased = await Payment.findAll({
      where: { userId, status: 'completed' },
      attributes: ['packageId'],
      raw: true
    });

    const uniqueIds = [...new Set(purchased.map(p => p.packageId))];
    res.status(200).json({ purchasedPackageIds: uniqueIds });
  } catch (error) {
    console.error("Check Availability Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
