import express from "express";
import {
  createReview,
  getDoctorReviews,
  updateReview,
  deleteReview,
  getEligibleForReviewAppointments,
} from "../controllers/reviewController.js";
import { userAuth } from "../middlewares/authMiddlewares.js";
import { reviewLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// CREATE REVIEW || POST (Verified Patient Auth + Rate Limiter)
router.post("/create", userAuth, reviewLimiter, createReview);

// GET DOCTOR REVIEWS || GET (Public)
router.get("/doctor/:doctorId", getDoctorReviews);

// GET ELIGIBLE APPOINTMENTS FOR REVIEW || GET (Verified Patient Auth)
router.get("/eligible-for-review", userAuth, getEligibleForReviewAppointments);

// UPDATE REVIEW || PUT & PATCH (Owner Auth + Rate Limiter)
router.patch("/update/:id", userAuth, reviewLimiter, updateReview);
router.put("/update/:id", userAuth, reviewLimiter, updateReview);
router.patch("/:id", userAuth, reviewLimiter, updateReview);
router.put("/:id", userAuth, reviewLimiter, updateReview);

// DELETE REVIEW || DELETE (Owner or Admin Auth + Rate Limiter)
router.delete("/delete/:id", userAuth, reviewLimiter, deleteReview);
router.delete("/:id", userAuth, reviewLimiter, deleteReview);

export default router;
