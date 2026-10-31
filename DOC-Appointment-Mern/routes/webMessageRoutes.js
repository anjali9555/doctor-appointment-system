import express from "express";
import {
  createMessage,
  getAllMessages,
  updateMessageStatus,
  deleteWebMessage,
} from "../controllers/webmessageController.js";
import { userAuth, isAdmin } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// CREATE MESSAGE || POST (Public)
router.post("/create", createMessage);

// GET ALL MESSAGES || GET (Admin Only - FIXED)
router.get("/get-all", userAuth, isAdmin, getAllMessages);

// UPDATE MESSAGE STATUS || PATCH (Admin Only)
router.patch("/update-status/:id", userAuth, isAdmin, updateMessageStatus);

// DELETE MESSAGE || DELETE (Admin Only)
router.delete("/delete/:id", userAuth, isAdmin, deleteWebMessage);

export default router;
