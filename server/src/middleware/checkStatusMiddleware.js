const User = require("../models/userModel");

const checkStatusMiddleware = async (req, res, next) => {
  if (req.user && req.user.status === "suspended") {
    return res.status(403).json({
      message: "Your account has been suspended by the administrator. Please contact support.",
      suspended: true
    });
  }
  next();
};

module.exports = checkStatusMiddleware;
