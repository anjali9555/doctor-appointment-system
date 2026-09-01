import express from 'express';
import {
  createMessage,
  getAllMessages,
  deleteWebMessage // FIX: Import the delete controller
} from "../controllers/webMessageController.js";

// FIX: Import userAuth along with isAdmin
import { userAuth, isAdmin } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// CREATE MESSAGE || POST
router.post("/create", createMessage);

// GET ALL MESSAGES || GET
router.get("/get-all", getAllMessages);

// DELETE MSG || DELETE
// FIX: Added userAuth before isAdmin so req.user is properly populated
router.delete("/delete/:id", userAuth, isAdmin, deleteWebMessage);

export default router;