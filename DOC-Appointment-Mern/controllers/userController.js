import crypto from "crypto";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentsModel.js";
import WebMessageModel from "../models/webMessage.js";
import { createNotification } from "../services/notificationService.js";

// Helper: Generate JWT Token
const generateToken = (user) => {
  const isAdminUser = Boolean(user.isAdmin === true || user.role === "admin");
  const userRole = isAdminUser ? "admin" : (user.role || "patient");
  return JWT.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: userRole,
      isAdmin: isAdminUser,
    },
    process.env.JWT_SECRET || "yoursecretKey",
    { expiresIn: "7d" }
  );
};

// ==========================================
// REGISTER USER (Always creates Patient role)
// ==========================================
export const userRegister = async (req, res, next) => {
  try {
    const { name, email, password, phone, dob, gender, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    // Hash password exactly once with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Security Rule: Public registration always provisions patient accounts
    const user = new userModel({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || "",
      dob: dob || "",
      gender: gender || "",
      address: address || "",
      role: "patient",
      isAdmin: false,
    });

    await user.save();

    const token = generateToken(user);
    const userSafe = user.toJSON();
    userSafe.role = "patient";
    userSafe.isAdmin = false;

    // Trigger welcome notification
    createNotification({
      userId: user._id,
      title: "Welcome to MediCare",
      message: `Hello ${user.name}, your healthcare portal account is ready.`,
      type: "account",
      emailData: {
        to: user.email,
        templateName: "welcome",
        data: user.name,
      },
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userSafe,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LOGIN USER
// ==========================================
export const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (user.isDeactivated) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact clinic support.",
      });
    }

    // Verify password against stored bcrypt hash
    // Check if account is temporarily locked due to excessive failed attempts
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        await user.save();
        return res.status(423).json({
          success: false,
          message: "Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.",
        });
      }
      await user.save();
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Reset failed login tracking on successful authentication
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const isAdminUser = Boolean(user.isAdmin === true || user.role === "admin");
    const userRole = isAdminUser ? "admin" : (user.role || "patient");

    const token = generateToken(user);
    const userSafe = user.toJSON();
    userSafe.role = userRole;
    userSafe.isAdmin = isAdminUser;

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: userSafe,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET LOGGED-IN / CURRENT USER PROFILE
// ==========================================
export const getLoginUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reqUserId = req.user.id.toString();

    // Strict Authorization / IDOR Protection
    if (reqUserId !== id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot access another user's profile.",
      });
    }

    const user = await userModel.findById(id).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE USER PROFILE
// ==========================================
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reqUserId = req.user.id.toString();

    // Strict Authorization / IDOR Protection
    if (reqUserId !== id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot modify another user's profile.",
      });
    }

    const { name, phone, dob, gender, address } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (address !== undefined) updateData.address = address;

    if (req.file) {
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .select("-password -resetPasswordToken -resetPasswordExpires");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE PASSWORD
// ==========================================
export const updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reqUserId = req.user.id.toString();

    // Strict Authorization / IDOR Protection
    if (reqUserId !== id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot modify another user's password.",
      });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both old and new passwords.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password does not match.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FORGOT & RESET PASSWORD
// ==========================================
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const user = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 with generic message to avoid email enumeration
      return res.status(200).json({
        success: true,
        message: "If that email exists in our system, a password reset link has been dispatched.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    return res.status(200).json({
      success: true,
      message: "If that email exists in our system, password reset instructions have been generated.",
      resetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordWithToken = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid or has expired.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL USERS (Admin Only - with Pagination)
// ==========================================
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      userModel
        .find(query)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      userModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      users: users || [],
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET USER DETAILS (Admin or Self)
// ==========================================
export const getUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reqUserId = req.user.id.toString();

    if (reqUserId !== id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot inspect another patient's medical details.",
      });
    }

    const user = await userModel
      .findById(id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this ID.",
      });
    }

    const appointments = await appointmentModel
      .find({ userId: user._id })
      .populate("doctorId", "name speciality fees image phone")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "User details and medical appointment history fetched successfully",
      user,
      appointments: appointments || [],
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET CLINIC & ADMIN DASHBOARD STATS (Admin Only)
// ==========================================
export const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      rejectedCount,
      revenueResult,
      monthlyRevenueResult,
      recentAppointments,
      recentUsers,
      recentMessages,
    ] = await Promise.all([
      userModel.countDocuments({ role: "patient" }),
      doctorModel.countDocuments({}),
      appointmentModel.countDocuments({}),
      appointmentModel.countDocuments({ status: "pending" }),
      appointmentModel.countDocuments({ status: "confirmed" }),
      appointmentModel.countDocuments({ status: "completed" }),
      appointmentModel.countDocuments({ status: { $in: ["cancelled", "cancel"] } }),
      appointmentModel.countDocuments({ status: "rejected" }),
      appointmentModel.aggregate([
        { $match: { payment: true } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } },
      ]),
      appointmentModel.aggregate([
        { $match: { payment: true } },
        {
          $group: {
            _id: { $substr: ["$slotDate", 0, 7] },
            revenue: { $sum: { $toDouble: "$amount" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 6 },
      ]),
      appointmentModel
        .find({})
        .populate("userId", "name email phone")
        .populate("doctorId", "name speciality fees")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      userModel
        .find({ role: "patient" })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      WebMessageModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const actualRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return res.status(200).json({
      success: true,
      message: "Clinic platform statistics fetched successfully",
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments: pendingCount,
      confirmedAppointments: confirmedCount,
      completedAppointments: completedCount,
      cancelledAppointments: cancelledCount,
      rejectedAppointments: rejectedCount,
      earnings: actualRevenue,
      actualRevenue,
      monthlyRevenue: monthlyRevenueResult || [],
      recentAppointments: recentAppointments || [],
      recentUsers: recentUsers || [],
      recentMessages: recentMessages || [],
    });
  } catch (error) {
    next(error);
  }
};
