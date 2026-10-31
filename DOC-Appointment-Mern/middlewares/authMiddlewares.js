import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Verify user authentication
export const userAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token && req.headers.cookie) {
      // Check cookies if present
      const cookieToken = req.headers.cookie
        .split(";")
        .find((c) => c.trim().startsWith("token="));
      if (cookieToken) {
        token = cookieToken.split("=")[1];
      }
    }

    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Authentication token missing or invalid",
      });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET || "yoursecretKey");
    req.user = {
      id: (decoded.id || decoded._id).toString(),
      email: decoded.email,
      role: decoded.role || (decoded.isAdmin ? "admin" : "patient"),
      isAdmin: Boolean(decoded.isAdmin || decoded.role === "admin"),
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({
        success: false,
        message: "Session expired. Please log in again.",
        expired: true,
      });
    }
    return res.status(401).send({
      success: false,
      message: "Invalid authentication token",
      error: error.message,
    });
  }
};

// Verify admin authorization
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User account not found",
      });
    }

    const isUserAdmin = Boolean(user.isAdmin === true || user.role === "admin");
    if (!isUserAdmin) {
      return res.status(403).send({
        success: false,
        message: "Forbidden: Admin privileges required",
      });
    }

    // Refresh req.user admin status
    req.user.isAdmin = true;
    req.user.role = "admin";
    next();
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error verifying admin privileges",
      error: error.message,
    });
  }
};

// Verify admin or doctor authorization
export const isAdminOrDoctor = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User account not found",
      });
    }

    const isUserAdmin = Boolean(user.isAdmin === true || user.role === "admin");
    const isUserDoctor = Boolean(user.role === "doctor");

    if (!isUserAdmin && !isUserDoctor) {
      return res.status(403).send({
        success: false,
        message: "Forbidden: Admin or Doctor privileges required",
      });
    }

    req.user.isAdmin = isUserAdmin;
    req.user.role = user.role || (isUserAdmin ? "admin" : "doctor");
    req.user.email = user.email;
    next();
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error verifying privileges",
      error: error.message,
    });
  }
};

// Optional auth for public endpoints that personalize when logged in
export const optionalAuth = (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token) {
      if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length).trim();
      }
      const decoded = JWT.verify(token, process.env.JWT_SECRET || "yoursecretKey");
      req.user = {
        id: (decoded.id || decoded._id).toString(),
        email: decoded.email,
        role: decoded.role,
        isAdmin: Boolean(decoded.isAdmin),
      };
    }
  } catch {
    // Non-blocking
  }
  next();
};
