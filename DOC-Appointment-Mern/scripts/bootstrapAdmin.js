import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import UserModel from "../models/userModel.js";

dotenv.config();

const bootstrapAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    console.log("ℹ️  ADMIN_EMAIL is not set in environment or .env file.");
    console.log("Usage: ADMIN_EMAIL=admin@yourclinic.com ADMIN_PASSWORD=YourPassword npm run bootstrap:admin");
    process.exit(0);
  }

  const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;
  if (!mongoUrl) {
    console.error("❌ MONGO_URL is missing in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB for Admin Bootstrap...".cyan || "Connected to DB");

    const normalizedEmail = adminEmail.toLowerCase().trim();
    let user = await UserModel.findOne({ email: normalizedEmail });

    if (user) {
      user.role = "admin";
      user.isAdmin = true;
      if (adminPassword) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(adminPassword, salt);
      }
      await user.save();
      console.log(`✅ User ${normalizedEmail} successfully upgraded/synchronized with Administrator privileges.`);
    } else {
      if (!adminPassword) {
        console.error(`❌ User ${normalizedEmail} does not exist. Please also provide ADMIN_PASSWORD to create a new admin account.`);
        process.exit(1);
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      user = new UserModel({
        name: "Clinic Administrator",
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        isAdmin: true,
      });
      await user.save();
      console.log(`✅ New Administrator account created for ${normalizedEmail}.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Admin Bootstrap failed:", err.message);
    process.exit(1);
  }
};

bootstrapAdmin();
