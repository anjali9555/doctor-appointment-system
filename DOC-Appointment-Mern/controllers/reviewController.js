import mongoose from "mongoose";
import ReviewModel from "../models/reviewModel.js";
import AppointmentModel from "../models/appointmentsModel.js";
import DoctorModel from "../models/doctorModel.js";
import { invalidateDoctorCaches } from "../services/cacheService.js";

/**
 * Helper to recalculate a doctor's average rating and total review count
 * Uses database aggregation for concurrency safety and precision
 */
export const recalculateDoctorRating = async (doctorId) => {
  const docObjectId = new mongoose.Types.ObjectId(doctorId.toString());

  const stats = await ReviewModel.aggregate([
    { $match: { doctorId: docObjectId } },
    {
      $group: {
        _id: "$doctorId",
        numReviews: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const numReviews = stats.length > 0 ? stats[0].numReviews : 0;
  const avgRating = stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 0;

  await DoctorModel.findByIdAndUpdate(docObjectId, {
    rating: avgRating,
    numReviews,
  });

  await invalidateDoctorCaches();
  return { avgRating, numReviews };
};

// ==========================================
// 1. SUBMIT PATIENT REVIEW
// ==========================================
export const createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const targetDoctorId = req.params.id || req.body.doctorId;
    const userId = req.user.id.toString();

    if (!appointmentId || rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID and numerical rating (1-5) are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID format.",
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a valid number between 1 and 5.",
      });
    }

    // 1. Verify the appointment exists
    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment record not found.",
      });
    }

    // 2. Strict Ownership: Patient can only review their own visit
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only review appointments you personally attended.",
      });
    }

    // 3. Completed visit rule: Only completed appointments can be reviewed
    if (appointment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "You can only leave a review after your appointment has been completed by the doctor.",
      });
    }

    // 4. If doctorId was supplied in route params, verify it matches the appointment's doctor
    if (targetDoctorId && appointment.doctorId.toString() !== targetDoctorId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Appointment does not belong to the specified doctor.",
      });
    }

    // 5. One review per appointment (Pre-check + DB unique constraint)
    const existingReview = await ReviewModel.findOne({ appointmentId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a review for this appointment. You can edit your existing review.",
        existingReviewId: existingReview._id,
      });
    }

    // 6. Save review (comment is optional, sanitized)
    const sanitizedComment = typeof comment === "string" ? comment.trim() : "";
    const review = new ReviewModel({
      userId,
      doctorId: appointment.doctorId,
      appointmentId,
      rating: numRating,
      comment: sanitizedComment,
    });
    await review.save();

    // 7. Recalculate doctor rating and review count atomically
    const stats = await recalculateDoctorRating(appointment.doctorId);

    return res.status(201).json({
      success: true,
      message: "Thank you! Your review has been submitted successfully.",
      review,
      doctorStats: stats,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A review has already been submitted for this appointment.",
      });
    }
    next(error);
  }
};

// ==========================================
// 2. GET DOCTOR REVIEWS (Public)
// ==========================================
export const getDoctorReviews = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId || req.params.id;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing doctor ID.",
      });
    }

    const reviews = await ReviewModel.find({ doctorId })
      .populate("userId", "name image")
      .sort({ createdAt: -1 })
      .lean();

    const numReviews = reviews.length;
    const avgRating =
      numReviews > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews).toFixed(1))
        : 0;

    return res.status(200).json({
      success: true,
      count: numReviews,
      averageRating: avgRating,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. UPDATE REVIEW (Owner Only)
// ==========================================
export const updateReview = async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId || req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user.id.toString();

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID format.",
      });
    }

    const review = await ReviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    // Strict Ownership
    if (review.userId.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only edit your own review.",
      });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be a valid number between 1 and 5.",
        });
      }
      review.rating = numRating;
    }

    if (comment !== undefined) {
      review.comment = typeof comment === "string" ? comment.trim() : "";
    }

    await review.save();
    const stats = await recalculateDoctorRating(review.doctorId);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review,
      doctorStats: stats,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. DELETE REVIEW (Owner or Admin)
// ==========================================
export const deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId || req.params.id;
    const userId = req.user.id.toString();

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID format.",
      });
    }

    const review = await ReviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    // Strict Ownership
    if (review.userId.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to delete this review.",
      });
    }

    const doctorId = review.doctorId;
    await ReviewModel.findByIdAndDelete(reviewId);
    const stats = await recalculateDoctorRating(doctorId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
      doctorStats: stats,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. GET COMPLETED APPOINTMENTS ELIGIBLE FOR REVIEW
// ==========================================
export const getEligibleForReviewAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Find all completed appointments for this user
    const completedAppointments = await AppointmentModel.find({
      userId,
      status: "completed",
    })
      .populate("doctorId", "name speciality fees phone email image degree rating numReviews")
      .sort({ createdAt: -1 })
      .lean();

    // 2. Find all reviews submitted by this user
    const userReviews = await ReviewModel.find({ userId }).lean();
    const reviewedApptIds = new Set(userReviews.map((r) => r.appointmentId.toString()));

    // 3. Filter to appointments that have NOT yet been reviewed
    const eligible = completedAppointments.filter(
      (appt) => !reviewedApptIds.has(appt._id.toString())
    );

    return res.status(200).json({
      success: true,
      count: eligible.length,
      appointments: eligible,
    });
  } catch (error) {
    next(error);
  }
};
