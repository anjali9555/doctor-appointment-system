import express from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";
import { userAuth } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// GET MY NOTIFICATIONS || GET (User Auth)
router.get("/my", userAuth, getUserNotifications);

// MARK SINGLE AS READ || PATCH (User Auth)
router.patch("/:id/read", userAuth, markNotificationAsRead);

// MARK ALL AS READ || PATCH (User Auth)
router.patch("/mark-all-read", userAuth, markAllNotificationsAsRead);

export default router;
