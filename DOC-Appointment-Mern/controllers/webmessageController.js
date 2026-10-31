import WebMessageModel from "../models/webMessage.js";

// ==========================================
// CREATE CONTACT MESSAGE (Public)
// ==========================================
export const createMessage = async (req, res, next) => {
  try {
    const { name, contact, message } = req.body;

    if (!name || !contact || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, contact details (phone or email), and message are required.",
      });
    }

    const newMessage = new WebMessageModel({
      name: name.trim(),
      contact: contact.trim(),
      message: message.trim(),
      status: "pending",
    });

    await newMessage.save();

    return res.status(201).json({
      success: true,
      message: "Your message has been received. Our clinical support team will reach out shortly.",
      messageData: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL CONTACT MESSAGES (Admin Only)
// ==========================================
export const getAllMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const [messages, totalCount] = await Promise.all([
      WebMessageModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WebMessageModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Contact messages fetched successfully",
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE MESSAGE STATUS (Admin Only)
// ==========================================
export const updateMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const message = await WebMessageModel.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (status) message.status = status;
    if (notes !== undefined) message.notes = notes;
    if (status === "resolved") message.resolvedAt = new Date();

    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message status updated successfully",
      messageData: message,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE MESSAGE (Admin Only)
// ==========================================
export const deleteWebMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await WebMessageModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
