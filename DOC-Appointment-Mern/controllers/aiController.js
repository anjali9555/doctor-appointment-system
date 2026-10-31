import KnowledgeBaseModel from "../models/knowledgeBaseModel.js";
import { askMediAssistAI } from "../services/aiService.js";

// ==========================================
// CHAT WITH MEDIASSIST AI
// ==========================================
export const chatWithAI = async (req, res, next) => {
  try {
    const { message, chatHistory } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message string is required.",
      });
    }

    const response = await askMediAssistAI({
      message,
      chatHistory: chatHistory || [],
      userContext: req.user || null,
    });

    return res.status(200).json({
      success: true,
      ...response,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET KNOWLEDGE BASE ARTICLES (Admin or Public)
// ==========================================
export const getKnowledgeArticles = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { active: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const articles = await KnowledgeBaseModel.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADD KNOWLEDGE ARTICLE (Admin Only)
// ==========================================
export const addKnowledgeArticle = async (req, res, next) => {
  try {
    const { title, category, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const article = new KnowledgeBaseModel({
      title: title.trim(),
      category: category || "faq",
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map((t) => t.trim()) : []),
    });

    await article.save();

    return res.status(201).json({
      success: true,
      message: "Knowledge base article added successfully",
      article,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE KNOWLEDGE ARTICLE (Admin Only)
// ==========================================
export const updateKnowledgeArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, content, tags, active } = req.body;

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (category) updateData.category = category;
    if (content) updateData.content = content.trim();
    if (tags) updateData.tags = Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim());
    if (active !== undefined) updateData.active = Boolean(active);

    const article = await KnowledgeBaseModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Knowledge base article updated successfully",
      article,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE KNOWLEDGE ARTICLE (Admin Only)
// ==========================================
export const deleteKnowledgeArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await KnowledgeBaseModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Article removed from knowledge base",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SEED KNOWLEDGE BASE WITH INITIAL CLINIC DATA
// ==========================================
export const seedKnowledgeBase = async (req, res, next) => {
  try {
    const defaultArticles = [
      {
        title: "Clinic Working Hours & Location",
        category: "general",
        content:
          "MediCare Outpatient Clinic is open Monday through Saturday from 9:00 AM to 5:00 PM. Emergency triage operates 24/7. We are located at MediCare Plaza, Healthcare Avenue.",
        tags: ["timings", "hours", "location", "address", "open"],
      },
      {
        title: "Appointment Booking Process",
        category: "appointment",
        content:
          "To book an appointment: Navigate to 'Doctors', select your specialist, choose an available date from their live schedule, pick a genuine open time slot, and confirm. Your booking is instantaneously confirmed in the clinic schedule.",
        tags: ["booking", "schedule", "how to book", "slots"],
      },
      {
        title: "Cancellation & Refund Policy",
        category: "policy",
        content:
          "Appointments can be cancelled or rescheduled up to 2 hours prior to the booked time slot directly from 'My Appointments'. If paid online via Razorpay, refunds are processed within 3-5 business days back to the original payment source.",
        tags: ["cancellation", "refund", "cancel", "policy"],
      },
      {
        title: "Available Medical Specialties",
        category: "specialty",
        content:
          "Our clinic offers verified specialists across General Medicine, Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology, Gynecology, and Gastroenterology.",
        tags: ["speciality", "specialties", "departments", "cardiology", "dermatology", "pediatrics"],
      },
      {
        title: "Payment Methods Accepted",
        category: "policy",
        content:
          "We accept UPI, Credit/Debit cards, and Net Banking via Razorpay online payment gateway, as well as Cash at the clinic front desk upon arrival.",
        tags: ["payment", "fee", "upi", "card", "razorpay", "cash"],
      },
      {
        title: "Emergency Protocol",
        category: "policy",
        content:
          "For acute emergencies such as chest pain, severe shortness of breath, sudden numbness, or heavy trauma, please dial 112 / 108 / 911 immediately or proceed directly to our Emergency Department. Do not rely on scheduled outpatient appointments for life-threatening situations.",
        tags: ["emergency", "ambulance", "urgent", "chest pain", "critical"],
      },
    ];

    let inserted = 0;
    for (const art of defaultArticles) {
      const exists = await KnowledgeBaseModel.findOne({ title: art.title });
      if (!exists) {
        await KnowledgeBaseModel.create(art);
        inserted++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Knowledge base seeded successfully (${inserted} new articles created).`,
    });
  } catch (error) {
    next(error);
  }
};
