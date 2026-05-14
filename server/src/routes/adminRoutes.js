const express = require("express");
const adminController = require("../controllers/adminController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(adminAuthMiddleware);

// Dashboard Stats
router.get("/stats", adminController.getSystemStats);
router.get('/payments', adminController.getAllPayments);
router.get("/analytics/daily", adminController.getDailyAnalytics);
router.get("/analytics/revenue", adminController.getRevenueAnalytics);
router.get("/analytics/activity", adminController.getRecentActivity);

// User Management
router.get("/users", adminController.getAllUsers);
router.post("/users/status", adminController.updateUserStatus);
router.post("/users/assign-package", adminController.assignPackage);

// Package Management
router.get("/packages", adminController.getAllPackages);
router.post("/packages", adminController.createPackage);
router.put("/packages/:id", adminController.updatePackage);
router.delete("/packages/:id", adminController.deletePackage);

module.exports = router;
