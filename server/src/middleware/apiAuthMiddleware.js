const ApiToken = require("../models/apiTokenModel");
const User = require("../models/userModel");

const apiAuthMiddleware = async (req, res, next) => {
  try {
    let token = req.headers["x-api-token"] || req.query.token;

    // Check for Authorization: Bearer header
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "API Token is required (Authorization: Bearer or x-api-token header)" });
    }

    const apiTokenRecord = await ApiToken.findOne({ 
      where: { token, isActive: true } 
    });

    if (!apiTokenRecord) {
      return res.status(401).json({ success: false, message: "Invalid or inactive API Token" });
    }

    const user = await User.findByPk(apiTokenRecord.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("API Auth Middleware Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = apiAuthMiddleware;
