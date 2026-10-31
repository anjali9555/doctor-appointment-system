import express from "express";
import {
  userLogin,
  userRegister,
  updateUser,
  updatePassword,
  forgotPassword,
  resetPasswordWithToken,
  getAllUsers,
  getStats,
  getUserDetails,
  getLoginUser,
} from "../controllers/userController.js";
import { userAuth, isAdmin } from "../middlewares/authMiddlewares.js";
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  adminLimiter,
} from "../middlewares/rateLimiter.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// REGISTER || POST (Strict bot & brute-force limit)
router.post("/register", registerLimiter, userRegister);

// LOGIN || POST (Brute-force protection)
router.post("/login", loginLimiter, userLogin);

// FORGOT & RESET PASSWORD (Strict limit)
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPasswordWithToken);

// UPDATE PROFILE || PATCH
router.patch("/update/:id", userAuth, upload.single("image"), updateUser);

// UPDATE PASSWORD || PATCH
router.patch("/update-password/:id", userAuth, updatePassword);

// GET ALL USERS || GET (Admin only)
router.get("/get-all", userAuth, isAdmin, adminLimiter, getAllUsers);

// GET ALL STATS || GET (Admin only)
router.get("/get-stats", userAuth, isAdmin, adminLimiter, getStats);

// GET USER DETAILS || GET (Admin or Self)
router.get("/get-user/:id", userAuth, getUserDetails);

// GET LOGIN USER DETAILS || GET (Self or Admin)
router.get("/get-login-user/:id", userAuth, getLoginUser);

export default router;
