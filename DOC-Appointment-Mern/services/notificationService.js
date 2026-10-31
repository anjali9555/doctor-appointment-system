import NotificationModel from "../models/notificationModel.js";

/**
 * Creates an in-app database notification for the user
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = "appointment",
  link = "",
}) => {
  try {
    const notification = await NotificationModel.create({
      userId,
      title,
      message,
      type,
      link,
    });

    return notification;
  } catch (error) {
    console.error("[NotificationService] Error creating notification:", error.message);
    return null;
  }
};
