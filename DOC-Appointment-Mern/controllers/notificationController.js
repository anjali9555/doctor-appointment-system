import NotificationModel from "../models/notificationModel.js";

// ==========================================
// GET USER NOTIFICATIONS (In-App)
// ==========================================
export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await NotificationModel.countDocuments({
      userId: req.user.id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await NotificationModel.updateMany({ userId: req.user.id, read: false }, { $set: { read: true } });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    next(error);
  }
};
