const { User, Package } = require("../models/associations");
const bcrypt = require("bcryptjs");

const seedAdmin = async () => {
  try {
    // 1. Create Default Package if not exists

    // 2. Create Admin User if not exists
    const adminEmail = "admin@wamitra.com";
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("@lly4792", 10);
      await User.create({
        username: "System Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        status: "active",
        isVerified: true,
        packageId: packageId,
      });
      console.log("System Admin user created.");
    }
  } catch (error) {
    console.error("Seeder Error:", error);
  }
};

module.exports = { seedAdmin };
