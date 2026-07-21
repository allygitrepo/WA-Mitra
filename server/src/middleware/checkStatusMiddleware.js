const User = require("../models/userModel");

const checkStatusMiddleware = async (req, res, next) => {
  if (req.user && req.user.status === "suspended") {
    const message = req.user.suspendReason
      ? `Your account has been suspended. Reason: ${req.user.suspendReason}`
      : "Your account has been suspended by the administrator. Please contact support.";
    return res.status(403).json({
      message,
      suspended: true
    });
  }
  next();
};

module.exports = checkStatusMiddleware;
