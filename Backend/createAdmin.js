// Backend/ folder mein naya file banao
// naam: createAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("DB connected ✅");

    // Check karo admin already hai ya nahi
    const exists = await User.findOne({ role: "admin" });
    if (exists) {
      console.log("Admin already hai:", exists.email);
      process.exit();
    }

    // Password hash karo
    const hashed = await bcrypt.hash("Admin@123", 12);

    // Admin banao
    await User.create({
      name: "Super Admin",
      email: "admin@nexora.com",
      password: hashed,
      role: "admin",
      isApproved: true, // admin auto approved
    });

    console.log("✅ Admin ban gaya!");
    console.log("📧 Email:    admin@nexora.com");
    console.log("🔑 Password: Admin@123");
    process.exit();
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit();
  });
