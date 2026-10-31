import express from "express";
import { isAdmin, isAdminOrDoctor, userAuth } from "../middlewares/authMiddlewares.js";
import { bookingLimiter, adminLimiter } from "../middlewares/rateLimiter.js";
import {
  bookAppointment,
  getAllAppointments,
  getAppointmentDetails,
  updateAppointmentStatus,
  getMyPatientAppointments,
  getUserAppointments,
  getUserAppointmentDetails,
  cancelAppointment,
  rescheduleAppointment,
} from "../controllers/appointmentsController.js";
import { getEligibleForReviewAppointments } from "../controllers/reviewController.js";

const router = express.Router();

// CREATE / BOOK APPOINTMENT || POST (Patient Auth + Booking Rate Limiter)
router.post("/create", userAuth, bookingLimiter, bookAppointment);

// GET ALL APPOINTMENTS || GET (Admin only)
router.get("/get-all", userAuth, isAdmin, adminLimiter, getAllAppointments);

// DEDICATED PATIENT "MY APPOINTMENTS" ROUTE (Must be declared before dynamic /:id routes)
router.get("/my", userAuth, getMyPatientAppointments);

// COMPLETED APPOINTMENTS ELIGIBLE FOR REVIEW || GET (Patient only)
router.get("/eligible-for-review", userAuth, getEligibleForReviewAppointments);

// GET APPOINTMENT DETAILS || GET (Admin or Owner)
router.get("/get-details/:id", userAuth, getAppointmentDetails);

// UPDATE STATUS || PATCH (Admin or authorized Doctor)
router.patch("/update-status/:id", userAuth, isAdminOrDoctor, updateAppointmentStatus);

// GET ALL USER APPOINTMENTS || GET (Owner or Admin)
router.get("/get-user-appointments/:id", userAuth, getUserAppointments);

// GET USER APPOINTMENT DETAILS || GET (Owner or Admin)
router.get("/get-user-appointment-details/:id", userAuth, getUserAppointmentDetails);

// CANCEL APPOINTMENT || POST (Owner or Admin)
router.post("/cancel/:id", userAuth, cancelAppointment);

// RESCHEDULE APPOINTMENT || POST (Owner or Admin)
router.post("/reschedule/:id", userAuth, rescheduleAppointment);

export default router;
