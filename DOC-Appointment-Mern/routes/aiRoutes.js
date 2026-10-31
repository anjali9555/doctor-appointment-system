import express from "express";
import {
  chatWithAI,
  getKnowledgeArticles,
  addKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
  seedKnowledgeBase,
} from "../controllers/aiController.js";
import { userAuth, isAdmin, optionalAuth } from "../middlewares/authMiddlewares.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// CHAT WITH MEDIASSIST AI || POST
router.post("/chat", aiLimiter, optionalAuth, chatWithAI);

// GET KNOWLEDGE ARTICLES || GET (Public)
router.get("/knowledge", getKnowledgeArticles);

// ADD ARTICLE || POST (Admin only)
router.post("/knowledge", userAuth, isAdmin, addKnowledgeArticle);

// UPDATE ARTICLE || PUT (Admin only)
router.put("/knowledge/:id", userAuth, isAdmin, updateKnowledgeArticle);

// DELETE ARTICLE || DELETE (Admin only)
router.delete("/knowledge/:id", userAuth, isAdmin, deleteKnowledgeArticle);

// SEED KNOWLEDGE BASE || POST (Admin only or Setup)
router.post("/seed-knowledge", userAuth, isAdmin, seedKnowledgeBase);

export default router;
