import express from "express";
import { isAdmin, userAuth } from "../middlewares/authMiddlewares.js";
import {
  bookAppointment,
  getAllAppointments,
  getAppointmentDetails,
  updateAppointmentStatus,
  getUserAppointments,
  getUserAppointmentDetails,
  cancelAppointment // <-- Naya import add kiya
} from "../controllers/appointmentsController.js";

const router = express.Router();

// CREATE || POST
router.post("/create", userAuth, bookAppointment);

// GET ALL || GET (Admin only)
router.get("/get-all", userAuth, isAdmin, getAllAppointments);

// GET DETAILS || GET (Admin only)
router.get("/get-details/:id", userAuth, isAdmin, getAppointmentDetails);

// UPDATE STATUS || PATCH (Admin only)
router.patch("/update-status/:id", userAuth, isAdmin, updateAppointmentStatus);

// GET ALL USER APPOINTMENTS || GET
router.get("/get-user-appointments/:id", userAuth, getUserAppointments);

// GET USER APPOINTMENT DETAILS || GET
router.get("/get-user-appointment-details/:id", userAuth, getUserAppointmentDetails);

// CANCEL USER APPOINTMENT || POST (Naya route)
router.post("/cancel/:id", userAuth, cancelAppointment);

export default router;