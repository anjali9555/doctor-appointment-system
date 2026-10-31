import express from "express";
import { isAdmin, userAuth } from "../middlewares/authMiddlewares.js";
import { reviewLimiter } from "../middlewares/rateLimiter.js";
import upload from "../middlewares/multer.js";
import {
  addDoctor,
  getAllDoctor,
  getDoctorDetails,
  getSpecialities,
  updateDoctor,
  deleteDoctor,
  updateAvailableStatus,
  getDoctorSlots,
} from "../controllers/doctorController.js";
import {
  createReview,
  getDoctorReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

// ADD DOCTOR || POST (Admin only)
router.post("/add-doctor", userAuth, isAdmin, upload.single("image"), addDoctor);

// GET ALL DOCTORS || GET (Public - with search, filtering, and pagination)
router.get("/get-all", getAllDoctor);

// GET DISTINCT SPECIALITIES || GET (Public - cached)
router.get("/specialities", getSpecialities);

// GET DOCTOR DETAILS || GET (Public)
router.get("/get-details/:id", getDoctorDetails);

// DYNAMIC AVAILABLE SLOTS || GET (Public)
router.get("/:id/slots", getDoctorSlots);

// UPDATE DOCTOR || PATCH (Admin only)
router.patch("/update/:id", userAuth, isAdmin, upload.single("image"), updateDoctor);

// DELETE DOCTOR || DELETE (Admin only)
router.delete("/delete/:id", userAuth, isAdmin, deleteDoctor);

// DOCTOR AVAILABLE STATUS || PATCH (Admin only)
router.patch("/update-status/:id", userAuth, isAdmin, updateAvailableStatus);

// ==========================================
// RESTful Nested Review Endpoints
// ==========================================
// POST /api/v1/doctor/:id/reviews — Submit a review
router.post("/:id/reviews", userAuth, reviewLimiter, createReview);

// GET /api/v1/doctor/:id/reviews — Get reviews for a doctor
router.get("/:id/reviews", getDoctorReviews);

// PUT /api/v1/doctor/:id/reviews/:reviewId — Update the patient's own review
router.put("/:id/reviews/:reviewId", userAuth, reviewLimiter, updateReview);
router.patch("/:id/reviews/:reviewId", userAuth, reviewLimiter, updateReview);

// DELETE /api/v1/doctor/:id/reviews/:reviewId — Delete the patient's own review
router.delete("/:id/reviews/:reviewId", userAuth, reviewLimiter, deleteReview);

export default router;
