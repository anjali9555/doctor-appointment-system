import { GoogleGenerativeAI } from "@google/generative-ai";
import KnowledgeBaseModel from "../models/knowledgeBaseModel.js";
import DoctorModel from "../models/doctorModel.js";

const AI_DISCLAIMER =
  "MediAssist AI is an automated healthcare assistant for general guidance and appointment support only. It does not provide medical diagnoses, treatment plans, or emergency care. For emergencies, please call 112 / 108 / 911 immediately.";

/**
 * Retrieve relevant knowledge base articles and doctor directory entries
 */
export const retrieveKnowledge = async (query) => {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "with", "are", "can", "how", "what", "who"].includes(w));

  // 1. Search knowledge base
  const allDocs = await KnowledgeBaseModel.find({ active: true }).lean();
  const scoredDocs = allDocs.map((doc) => {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const tagsLower = (doc.tags || []).map((t) => t.toLowerCase());

    queryWords.forEach((word) => {
      if (titleLower.includes(word)) score += 5;
      if (tagsLower.includes(word)) score += 4;
      if (contentLower.includes(word)) score += 1;
    });

    return { ...doc, score };
  });

  const relevantArticles = scoredDocs
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // 2. Search doctor directory for doctor or specialty specific questions
  const allDoctors = await DoctorModel.find({ available: true })
    .select("name speciality fees experience degree about")
    .lean();

  const matchedDoctors = allDoctors.filter((doc) => {
    const docName = doc.name.toLowerCase();
    const docSpec = doc.speciality.toLowerCase();
    return queryWords.some((word) => docName.includes(word) || docSpec.includes(word));
  });

  return {
    articles: relevantArticles,
    doctors: matchedDoctors.slice(0, 3),
  };
};

/**
 * Core RAG Generation Pipeline
 */
export const askMediAssistAI = async ({ message, chatHistory = [], userContext = null }) => {
  const userQuery = message.trim();

  // Safety filter: Emergency check
  const emergencyKeywords = ["suicide", "chest pain", "heart attack", "can't breathe", "cannot breathe", "severe bleeding", "overdose", "stroke", "unconscious"];
  if (emergencyKeywords.some((k) => userQuery.toLowerCase().includes(k))) {
    return {
      reply:
        "⚠️ **CRITICAL MEDICAL EMERGENCY ALERT**\n\nIf you or someone nearby is experiencing life-threatening symptoms (such as severe chest pain, difficulty breathing, or severe bleeding), **please contact emergency services (112 / 108 / 911) or visit the nearest emergency room immediately**.\n\nMediAssist AI cannot treat or diagnose medical emergencies.",
      sources: ["Emergency Medical Protocol"],
      disclaimer: AI_DISCLAIMER,
    };
  }

  // Retrieve relevant knowledge
  const { articles, doctors } = await retrieveKnowledge(userQuery);

  // Build context payload
  let contextText = "KNOWLEDGE BASE CONTEXT:\n";
  const sources = [];

  if (articles.length > 0) {
    articles.forEach((art) => {
      contextText += `[${art.category.toUpperCase()}] ${art.title}: ${art.content}\n`;
      sources.push(art.title);
    });
  }

  if (doctors.length > 0) {
    contextText += "\nDOCTOR DIRECTORY CONTEXT:\n";
    doctors.forEach((d) => {
      contextText += `- Dr. ${d.name} (${d.speciality}), Experience: ${d.experience} yrs, Degree: ${d.degree}, Consultation Fee: ₹${d.fees}. Bio: ${d.about}\n`;
      sources.push(`Dr. ${d.name} Profile`);
    });
  }

  // System instructions with guardrails
  const systemPrompt = `You are MediAssist AI, the official, intelligent healthcare & appointment assistant for the MediCare Platform.
Your responsibilities:
1. Help patients understand clinic services, specialties, doctor schedules, booking steps, cancellation policies, and fee information.
2. Ground your answers strictly in the provided KNOWLEDGE BASE CONTEXT and DOCTOR DIRECTORY CONTEXT.
3. If the context does not contain the answer, politely state: "I don't have that specific information in my clinic knowledge base. Please contact our front desk or support desk directly."
4. CRITICAL SAFETY RULES:
   - Identify as an AI assistant.
   - NEVER prescribe medications, dosages, or offer clinical diagnoses.
   - Recommend consulting a verified doctor on our platform for clinical concerns.
   - Keep answers clear, polite, and professionally formatted with markdown.

${contextText}
`;

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      });

      // Construct history for multi-turn chat
      const formattedHistory = (chatHistory || []).slice(-6).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: `System Instructions: ${systemPrompt}` }],
          },
          {
            role: "model",
            parts: [{ text: "Understood. I am MediAssist AI, grounded in clinic policies and doctor records." }],
          },
          ...formattedHistory,
        ],
      });

      const result = await chat.sendMessage(userQuery);
      const response = await result.response;
      const text = response.text();

      return {
        reply: text,
        sources: sources.length > 0 ? sources : ["MediCare General Information"],
        disclaimer: AI_DISCLAIMER,
      };
    } catch (llmError) {
      console.warn("LLM API Call failed, falling back to grounded heuristic answer:", llmError.message);
    }
  }

  // Grounded Deterministic Fallback Synthesis (when GEMINI_API_KEY is not yet provided)
  let fallbackReply = "";
  if (articles.length > 0 || doctors.length > 0) {
    fallbackReply += `Hello! I'm **MediAssist AI**. Based on our clinic records:\n\n`;

    if (doctors.length > 0) {
      fallbackReply += `### Available Specialists Matching Your Query:\n`;
      doctors.forEach((d) => {
        fallbackReply += `* **Dr. ${d.name}** — *${d.speciality}* (${d.experience} years experience)\n  Fee: **₹${d.fees}** | Degree: ${d.degree}\n  ${d.about}\n\n`;
      });
    }

    if (articles.length > 0) {
      fallbackReply += `### Clinic Information & Guidelines:\n`;
      articles.forEach((a) => {
        fallbackReply += `**${a.title}**\n${a.content}\n\n`;
      });
    }

    fallbackReply += `You can book an appointment with any of our verified doctors directly from the **Doctors** tab in the navigation bar.`;
  } else {
    fallbackReply =
      `Hello! I'm **MediAssist AI**, your healthcare assistant.\n\n` +
      `I can help you with:\n` +
      `• Finding available doctors and specialties (Cardiology, Dermatology, Pediatrics, etc.)\n` +
      `• Consultation fees and clinic timings (Mon-Sat, 9:00 AM - 5:00 PM)\n` +
      `• Appointment booking, rescheduling, and cancellation rules\n` +
      `• Payment and refund policies\n\n` +
      `Could you please clarify your request, or visit the Doctors page to book a consultation?`;
  }

  return {
    reply: fallbackReply,
    sources: sources.length > 0 ? sources : ["MediCare Verified Handbook"],
    disclaimer: AI_DISCLAIMER,
    unconfiguredProvider: !geminiApiKey,
  };
};
