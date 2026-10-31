import mongoose from "mongoose";
import AppointmentModel from "../models/appointmentsModel.js";
import UserModel from "../models/userModel.js";
import DoctorModel from "../models/doctorModel.js";
import SlotReservationModel from "../models/slotReservationModel.js";
import ReviewModel from "../models/reviewModel.js";
import { createNotification } from "../services/notificationService.js";
import { invalidateDoctorCaches } from "../services/cacheService.js";
import { getAvailableSlotsForDoctor, normalizeSlotTime } from "../services/schedulingService.js";

// ==========================================
// 1. BOOK APPOINTMENT (Stage 1: Pending Request)
// ==========================================
export const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, slotDate, slotTime, patientNotes } = req.body;
    const userId = req.user.id;

    if (!doctorId || !slotDate || !slotTime) {
      return res.status(400).json({
        success: false,
        message: "Doctor, appointment date, and time slot are required.",
      });
    }

    // 1. Verify doctor existence and availability
    const doctor = await DoctorModel.findById(doctorId).lean();
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Selected doctor could not be found.",
      });
    }

    if (!doctor.available) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently not available for bookings.",
      });
    }

    // 2. Authoritative pricing calculated on backend
    const authoritativeAmount = Number(doctor.fees);
    const normalizedSlotTime = normalizeSlotTime(slotTime);

    // 3. Check if slot already has a CONFIRMED reservation
    const [confirmedReservation, confirmedAppointment] = await Promise.all([
      SlotReservationModel.findOne({
        doctorId,
        slotDate,
        slotTime: normalizedSlotTime,
      }).lean(),
      AppointmentModel.findOne({
        doctorId,
        slotDate,
        slotTime: normalizedSlotTime,
        status: "confirmed",
      }).lean(),
    ]);

    if (confirmedReservation || confirmedAppointment) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked and confirmed. Please select another time.",
      });
    }

    // 4. Create appointment in 'pending' status (does NOT lock the slot)
    const appointment = new AppointmentModel({
      userId,
      doctorId,
      slotDate,
      slotTime: normalizedSlotTime,
      amount: authoritativeAmount,
      status: "pending",
      payment: false,
      patientNotes: patientNotes || "",
    });

    await appointment.save();

    // 5. In-app notification for patient
    createNotification({
      userId,
      title: "Appointment Request Submitted",
      message: `Your appointment request with Dr. ${doctor.name} on ${slotDate} at ${slotTime} is pending confirmation.`,
      type: "appointment",
      link: `/my-appointments`,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Appointment request submitted successfully. Awaiting clinic confirmation.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET ALL APPOINTMENTS (Admin with Filters & Pagination)
// ==========================================
export const getAllAppointments = async (req, res, next) => {
  try {
    const {
      doctorId,
      userId,
      status,
      date,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (doctorId) query.doctorId = doctorId;
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (date) query.slotDate = date;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [appointments, totalCount] = await Promise.all([
      AppointmentModel.find(query)
        .populate("userId", "name email phone image")
        .populate("doctorId", "name speciality fees phone image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AppointmentModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      totalAppointments: totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. GET SINGLE APPOINTMENT DETAILS (Admin)
// ==========================================
export const getAppointmentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await AppointmentModel.findById(id)
      .populate("userId", "name email phone image address")
      .populate("doctorId", "name speciality fees email phone image degree")
      .lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment details retrieved successfully",
      appointment,
      appointmentDetails: {
        clientName: appointment.userId?.name || "Unknown",
        clientPhone: appointment.userId?.phone || "N/A",
        clientEmail: appointment.userId?.email || "N/A",
        doctorName: appointment.doctorId?.name || "Unknown",
        doctorPhone: appointment.doctorId?.phone || "N/A",
        doctorEmail: appointment.doctorId?.email || "N/A",
        bookingDate: appointment.slotDate,
        bookingTime: appointment.slotTime,
        amount: appointment.amount,
        bookingStatus: appointment.status,
        paymentMode: appointment.payment ? "Paid" : "Pending",
        createdAt: appointment.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// HELPER: Confirm Appointment with Database Concurrency Protection
// ==========================================
export const confirmAppointmentWithConcurrencyProtection = async (appointmentId, reqUser) => {
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (err) {
    if (session) {
      await session.endSession().catch(() => {});
      session = null;
    }
    useTransaction = false;
  }

  if (useTransaction && session) {
    try {
      // 1. Verify that the appointment exists and is currently pending
      const appointment = await AppointmentModel.findById(appointmentId).session(session);
      if (!appointment) {
        await session.abortTransaction();
        const error = new Error("Appointment not found.");
        error.statusCode = 404;
        throw error;
      }

      // Idempotency: If already confirmed, do not create duplicate reservation
      if (appointment.status === "confirmed") {
        await session.commitTransaction();
        return {
          alreadyConfirmed: true,
          appointment,
        };
      }

      if (appointment.status !== "pending") {
        await session.abortTransaction();
        const error = new Error(
          `Only pending appointment requests can be confirmed. Current status is '${appointment.status}'.`
        );
        error.statusCode = 400;
        throw error;
      }

      // 2. Verify that the user has permission to confirm it (Admin or assigned Doctor)
      if (reqUser) {
        const isUserAdmin = Boolean(reqUser.isAdmin || reqUser.role === "admin");
        let isAuthorizedDoc = false;
        if (reqUser.role === "doctor") {
          const doctorDoc = await DoctorModel.findById(appointment.doctorId).session(session);
          if (
            doctorDoc &&
            (doctorDoc.email?.toLowerCase() === reqUser.email?.toLowerCase() ||
              doctorDoc._id.toString() === reqUser.id?.toString())
          ) {
            isAuthorizedDoc = true;
          }
        }

        if (!isUserAdmin && !isAuthorizedDoc) {
          await session.abortTransaction();
          const permErr = new Error("Forbidden: You do not have permission to confirm this appointment.");
          permErr.statusCode = 403;
          throw permErr;
        }
      }

      const docId = appointment.doctorId._id || appointment.doctorId;
      const normalizedSlotTime = normalizeSlotTime(appointment.slotTime);

      // 3. Check whether the selected doctor/date/time is already reserved by another confirmed appointment
      const [existingReservation, existingConfirmed] = await Promise.all([
        SlotReservationModel.findOne({
          doctorId: docId,
          slotDate: appointment.slotDate,
          slotTime: normalizedSlotTime,
        }).session(session),
        AppointmentModel.findOne({
          _id: { $ne: appointment._id },
          doctorId: docId,
          slotDate: appointment.slotDate,
          slotTime: normalizedSlotTime,
          status: "confirmed",
        }).session(session),
      ]);

      if (
        (existingReservation && existingReservation.appointmentId.toString() !== appointment._id.toString()) ||
        existingConfirmed
      ) {
        await session.abortTransaction();
        const error = new Error(
          "This time slot has already been booked by another patient. Please select another appointment request."
        );
        error.statusCode = 409;
        throw error;
      }

      // 4. Attempt to reserve the slot atomically in MongoDB
      // Unique compound index on { doctorId: 1, slotDate: 1, slotTime: 1 } strictly prevents double reservation
      await SlotReservationModel.create(
        [
          {
            doctorId: docId,
            slotDate: appointment.slotDate,
            slotTime: normalizedSlotTime,
            appointmentId: appointment._id,
            userId: appointment.userId._id || appointment.userId,
            status: "confirmed",
          },
        ],
        { session }
      );

      // 5. Change the appointment status to confirmed only if slot reservation succeeds
      appointment.status = "confirmed";
      appointment.slotTime = normalizedSlotTime;
      await appointment.save({ session });

      // 6. Automatically change other pending requests for the same doctor/date/time to rejected
      await AppointmentModel.updateMany(
        {
          _id: { $ne: appointment._id },
          doctorId: docId,
          slotDate: appointment.slotDate,
          slotTime: normalizedSlotTime,
          status: "pending",
        },
        {
          $set: {
            status: "rejected",
            cancellationReason: "This slot was confirmed for another patient",
            cancelledBy: "system",
          },
        },
        { session }
      );

      await session.commitTransaction();

      // Trigger asynchronous in-app notifications for rejected patients
      AppointmentModel.find({
        _id: { $ne: appointment._id },
        doctorId: docId,
        slotDate: appointment.slotDate,
        slotTime: normalizedSlotTime,
        status: "rejected",
        cancellationReason: "This slot was confirmed for another patient",
      })
        .select("userId")
        .lean()
        .then((competingRejected) => {
          competingRejected.forEach((rej) => {
            if (rej.userId) {
              createNotification({
                userId: rej.userId,
                title: "Appointment Request Declined",
                message: `Your appointment request for ${appointment.slotDate} at ${appointment.slotTime} was declined because this slot was confirmed for another patient.`,
                type: "appointment",
                link: "/my-appointments",
              }).catch(() => {});
            }
          });
        })
        .catch(() => {});

      return {
        alreadyConfirmed: false,
        appointment,
      };
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction().catch(() => {});
      }
      if (
        err.code === 11000 ||
        (err.message && err.message.includes("11000")) ||
        err.code === 112 ||
        (err.errorLabels && err.errorLabels.includes("TransientTransactionError"))
      ) {
        const conflictErr = new Error(
          "This time slot has already been booked by another patient. Please select another appointment request."
        );
        conflictErr.statusCode = 409;
        throw conflictErr;
      }
      throw err;
    } finally {
      await session.endSession().catch(() => {});
    }
  } else {
    // Non-transactional fallback using atomic database unique index constraints
    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      const error = new Error("Appointment not found.");
      error.statusCode = 404;
      throw error;
    }

    if (appointment.status === "confirmed") {
      return { alreadyConfirmed: true, appointment };
    }

    if (appointment.status !== "pending") {
      const error = new Error(
        `Only pending appointment requests can be confirmed. Current status is '${appointment.status}'.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Verify permission (Admin or assigned Doctor)
    if (reqUser) {
      const isUserAdmin = Boolean(reqUser.isAdmin || reqUser.role === "admin");
      let isAuthorizedDoc = false;
      if (reqUser.role === "doctor") {
        const doctorDoc = await DoctorModel.findById(appointment.doctorId);
        if (
          doctorDoc &&
          (doctorDoc.email?.toLowerCase() === reqUser.email?.toLowerCase() ||
            doctorDoc._id.toString() === reqUser.id?.toString())
        ) {
          isAuthorizedDoc = true;
        }
      }

      if (!isUserAdmin && !isAuthorizedDoc) {
        const permErr = new Error("Forbidden: You do not have permission to confirm this appointment.");
        permErr.statusCode = 403;
        throw permErr;
      }
    }

    const docId = appointment.doctorId._id || appointment.doctorId;
    const normalizedSlotTime = normalizeSlotTime(appointment.slotTime);

    const [existingReservation, existingConfirmed] = await Promise.all([
      SlotReservationModel.findOne({
        doctorId: docId,
        slotDate: appointment.slotDate,
        slotTime: normalizedSlotTime,
      }),
      AppointmentModel.findOne({
        _id: { $ne: appointment._id },
        doctorId: docId,
        slotDate: appointment.slotDate,
        slotTime: normalizedSlotTime,
        status: "confirmed",
      }),
    ]);

    if (
      (existingReservation && existingReservation.appointmentId.toString() !== appointment._id.toString()) ||
      existingConfirmed
    ) {
      const error = new Error(
        "This time slot has already been booked by another patient. Please select another appointment request."
      );
      error.statusCode = 409;
      throw error;
    }

    try {
      await SlotReservationModel.create({
        doctorId: docId,
        slotDate: appointment.slotDate,
        slotTime: normalizedSlotTime,
        appointmentId: appointment._id,
        userId: appointment.userId._id || appointment.userId,
        status: "confirmed",
      });
    } catch (err) {
      if (
        err.code === 11000 ||
        (err.message && err.message.includes("11000")) ||
        err.code === 112
      ) {
        const conflictErr = new Error(
          "This time slot has already been booked by another patient. Please select another appointment request."
        );
        conflictErr.statusCode = 409;
        throw conflictErr;
      }
      throw err;
    }

    appointment.status = "confirmed";
    appointment.slotTime = normalizedSlotTime;
    await appointment.save();

    await AppointmentModel.updateMany(
      {
        _id: { $ne: appointment._id },
        doctorId: docId,
        slotDate: appointment.slotDate,
        slotTime: normalizedSlotTime,
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          cancellationReason: "This slot was confirmed for another patient",
          cancelledBy: "system",
        },
      }
    );

    // Trigger asynchronous in-app notifications for rejected patients
    AppointmentModel.find({
      _id: { $ne: appointment._id },
      doctorId: docId,
      slotDate: appointment.slotDate,
      slotTime: normalizedSlotTime,
      status: "rejected",
      cancellationReason: "This slot was confirmed for another patient",
    })
      .select("userId")
      .lean()
      .then((competingRejected) => {
        competingRejected.forEach((rej) => {
          if (rej.userId) {
            createNotification({
              userId: rej.userId,
              title: "Appointment Request Declined",
              message: `Your appointment request for ${appointment.slotDate} at ${appointment.slotTime} was declined because this slot was confirmed for another patient.`,
              type: "appointment",
              link: "/my-appointments",
            }).catch(() => {});
          }
        });
      })
      .catch(() => {});

    return { alreadyConfirmed: false, appointment };
  }
};

// ==========================================
// 4. UPDATE APPOINTMENT STATUS (Stage 2: Atomic Acceptance / Rejection)
// ==========================================
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedStatus = req.body.appointmentStatus || req.body.status;
    const { rejectionReason, cancellationReason } = req.body;

    if (!requestedStatus) {
      return res.status(400).json({
        success: false,
        message: "Status value is required.",
      });
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled", "cancel", "rejected", "no-show"];
    if (!validStatuses.includes(requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(", ")}`,
      });
    }

    const normalizedStatus = requestedStatus === "cancel" ? "cancelled" : requestedStatus;

    if (normalizedStatus === "confirmed") {
      try {
        const result = await confirmAppointmentWithConcurrencyProtection(id, req.user);
        await invalidateDoctorCaches();

        const appointment = await AppointmentModel.findById(id)
          .populate("userId", "name email")
          .populate("doctorId", "name speciality fees phone address");

        // In-app notification for patient
        if (appointment?.userId?._id || appointment?.userId) {
          createNotification({
            userId: appointment.userId._id || appointment.userId,
            title: "Appointment Confirmed",
            message: `Your appointment with Dr. ${appointment.doctorId?.name} on ${appointment.slotDate} at ${appointment.slotTime} has been confirmed.`,
            type: "appointment",
            link: `/my-appointments`,
          }).catch(() => {});
        }

        return res.status(200).json({
          success: true,
          message: result.alreadyConfirmed
            ? "Appointment is already confirmed."
            : "Appointment confirmed successfully and slot reserved.",
          appointment,
        });
      } catch (err) {
        if (err.statusCode) {
          return res.status(err.statusCode).json({
            success: false,
            message: err.message,
          });
        }
        if (err.code === 11000 || (err.message && err.message.includes("11000"))) {
          return res.status(409).json({
            success: false,
            message:
              "This time slot has already been booked by another patient. Please select another appointment request.",
          });
        }
        throw err;
      }
    }

    // For statuses other than 'confirmed':
    const appointment = await AppointmentModel.findById(id)
      .populate("userId", "name email")
      .populate("doctorId", "name speciality fees phone address");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (appointment.status === normalizedStatus) {
      return res.status(200).json({
        success: true,
        message: `Appointment is already ${normalizedStatus}.`,
        appointment,
      });
    }

    // If cancelling or rejecting, release any existing slot reservation ONLY IF it was confirmed!
    // Pending appointment cancellation/rejection must NOT release a slot because it never reserved one.
    if (normalizedStatus === "cancelled" || normalizedStatus === "rejected") {
      if (appointment.status === "confirmed") {
        await SlotReservationModel.deleteOne({ appointmentId: appointment._id });
      }
      appointment.cancelledBy = req.user?.isAdmin ? "admin" : "clinic";
      if (rejectionReason || cancellationReason) {
        appointment.cancellationReason = rejectionReason || cancellationReason;
      } else if (normalizedStatus === "rejected") {
        appointment.cancellationReason = "Request declined by clinic administrator";
      }
    }

    appointment.status = normalizedStatus;
    await appointment.save();

    await invalidateDoctorCaches();

    if (appointment.userId?._id || appointment.userId) {
      createNotification({
        userId: appointment.userId._id || appointment.userId,
        title: `Appointment Status: ${normalizedStatus.toUpperCase()}`,
        message: `Your appointment with Dr. ${appointment.doctorId?.name} is now marked as ${normalizedStatus}.`,
        type: "appointment",
        link: `/my-appointments`,
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${normalizedStatus}`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. GET PATIENT'S OWN APPOINTMENTS (/my)
// ==========================================
export const getMyPatientAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const pageNum = Math.max(1, parseInt(req.query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [appointments, totalCount] = await Promise.all([
      AppointmentModel.find({ userId })
        .populate("doctorId", "name speciality fees phone email image degree rating numReviews")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AppointmentModel.countDocuments({ userId }),
    ]);

    const apptIds = (appointments || []).map((a) => a._id);
    const reviews = await ReviewModel.find({ appointmentId: { $in: apptIds } }).lean();
    const reviewMap = new Map(reviews.map((r) => [r.appointmentId.toString(), r]));

    const enrichedAppointments = (appointments || []).map((appt) => {
      const rev = reviewMap.get(appt._id.toString());
      return {
        ...appt,
        hasReviewed: !!rev,
        review: rev || null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "User appointments retrieved successfully",
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      appointments: enrichedAppointments,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. GET USER APPOINTMENTS BY ID (Self or Admin)
// ==========================================
export const getUserAppointments = async (req, res, next) => {
  try {
    const rawParam = req.params.id;
    const reqUserId = req.user.id ? req.user.id.toString() : "";
    const isSelf = !rawParam || rawParam === "my" || rawParam.toString() === reqUserId;

    if (!isSelf && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot access other users' appointments.",
      });
    }

    const targetUserId = isSelf ? reqUserId : rawParam;

    const appointments = await AppointmentModel.find({ userId: targetUserId })
      .populate("doctorId", "name speciality fees phone email image degree rating numReviews")
      .sort({ createdAt: -1 })
      .lean();

    const apptIds = (appointments || []).map((a) => a._id);
    const reviews = await ReviewModel.find({ appointmentId: { $in: apptIds } }).lean();
    const reviewMap = new Map(reviews.map((r) => [r.appointmentId.toString(), r]));

    const enrichedAppointments = (appointments || []).map((appt) => {
      const rev = reviewMap.get(appt._id.toString());
      return {
        ...appt,
        hasReviewed: !!rev,
        review: rev || null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "User appointments retrieved successfully",
      totalCount: enrichedAppointments.length,
      appointments: enrichedAppointments,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. GET USER APPOINTMENT DETAILS (Self or Admin)
// ==========================================
export const getUserAppointmentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await AppointmentModel.findById(id)
      .populate("doctorId", "name speciality fees phone email image degree")
      .lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    const apptUserId = appointment.userId ? appointment.userId.toString() : "";
    const reqUserId = req.user.id ? req.user.id.toString() : "";

    if (apptUserId !== reqUserId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot inspect this appointment.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment details retrieved successfully",
      appointment,
      appointmentDetails: {
        doctorName: appointment.doctorId?.name || "Unknown Doctor",
        doctorPhone: appointment.doctorId?.phone || "N/A",
        doctorEmail: appointment.doctorId?.email || "N/A",
        doctorSpeciality: appointment.doctorId?.speciality || "General",
        bookingDate: appointment.slotDate,
        bookingTime: appointment.slotTime,
        amount: appointment.amount,
        bookingStatus: appointment.status,
        paymentMode: appointment.payment,
        createdAt: appointment.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. CANCEL APPOINTMENT (Owner or Admin)
// ==========================================
export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await AppointmentModel.findById(id)
      .populate("userId", "name email")
      .populate("doctorId", "name speciality");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    const apptUserId = (appointment.userId?._id || appointment.userId || "").toString();
    const reqUserId = (req.user.id || "").toString();

    if (apptUserId !== reqUserId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to cancel this appointment.",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an appointment that has already been completed.",
      });
    }

    if (appointment.status === "cancelled" || appointment.status === "cancel" || appointment.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: `Appointment is already ${appointment.status}.`,
      });
    }

    // Only confirmed appointments hold a slot reservation!
    // Pending appointment cancellation must NOT release a slot because it never reserved one.
    if (appointment.status === "confirmed") {
      await SlotReservationModel.deleteOne({ appointmentId: appointment._id });
    }

    appointment.status = "cancelled";
    appointment.cancelledBy = req.user.isAdmin ? "admin" : "patient";
    appointment.cancellationReason = reason || "Cancelled by user";
    await appointment.save();

    // Invalidate cached doctor availability
    await invalidateDoctorCaches();

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9. RESCHEDULE APPOINTMENT (Owner or Admin)
// ==========================================
export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newSlotDate, newSlotTime } = req.body;

    if (!newSlotDate || !newSlotTime) {
      return res.status(400).json({
        success: false,
        message: "New appointment date and slot time are required.",
      });
    }

    const appointment = await AppointmentModel.findById(id)
      .populate("userId", "name email")
      .populate("doctorId", "name speciality");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    const apptUserId = (appointment.userId?._id || appointment.userId || "").toString();
    const reqUserId = (req.user.id || "").toString();

    if (apptUserId !== reqUserId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to reschedule this appointment.",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule an already completed appointment.",
      });
    }

    if (appointment.status === "cancelled" || appointment.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a ${appointment.status} appointment.`,
      });
    }

    const docId = appointment.doctorId._id || appointment.doctorId;
    const cleanNewTime = normalizeSlotTime(newSlotTime);
    const currentCleanTime = normalizeSlotTime(appointment.slotTime);

    if (appointment.slotDate === newSlotDate && currentCleanTime === cleanNewTime) {
      return res.status(400).json({
        success: false,
        message: "Please choose a different date or time slot to reschedule.",
      });
    }

    // If appointment is CONFIRMED, atomically reserve the new slot before releasing the old one
    if (appointment.status === "confirmed") {
      // 1. Check if new slot already has a confirmed reservation
      const [conflictRes, conflictAppt] = await Promise.all([
        SlotReservationModel.findOne({
          doctorId: docId,
          slotDate: newSlotDate,
          slotTime: cleanNewTime,
          appointmentId: { $ne: appointment._id },
        }).lean(),
        AppointmentModel.findOne({
          _id: { $ne: appointment._id },
          doctorId: docId,
          slotDate: newSlotDate,
          slotTime: cleanNewTime,
          status: "confirmed",
        }).lean(),
      ]);

      if (conflictRes || conflictAppt) {
        return res.status(409).json({
          success: false,
          message: "The requested new slot is already booked and confirmed. Please choose another time.",
        });
      }

      // Perform atomic reschedule with MongoDB session / transaction if supported
      let session = null;
      let useTransaction = false;
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTransaction = true;
      } catch (err) {
        if (session) await session.endSession().catch(() => {});
        session = null;
        useTransaction = false;
      }

      if (useTransaction && session) {
        try {
          // Reserve the new slot atomically
          await SlotReservationModel.create(
            [
              {
                doctorId: docId,
                slotDate: newSlotDate,
                slotTime: cleanNewTime,
                appointmentId: appointment._id,
                userId: appointment.userId._id || appointment.userId,
                status: "confirmed",
              },
            ],
            { session }
          );

          // Release the old reservation only as part of successful transaction
          await SlotReservationModel.deleteOne(
            {
              appointmentId: appointment._id,
              slotDate: appointment.slotDate,
              slotTime: appointment.slotTime,
            },
            { session }
          );

          appointment.slotDate = newSlotDate;
          appointment.slotTime = cleanNewTime;
          appointment.status = "confirmed";
          await appointment.save({ session });

          // Reject any competing pending requests for that new slot
          await AppointmentModel.updateMany(
            {
              _id: { $ne: appointment._id },
              doctorId: docId,
              slotDate: newSlotDate,
              slotTime: cleanNewTime,
              status: "pending",
            },
            {
              $set: {
                status: "rejected",
                cancellationReason: "This slot was confirmed for another patient",
                cancelledBy: "system",
              },
            },
            { session }
          );

          await session.commitTransaction();
        } catch (rescheduleErr) {
          if (session.inTransaction()) {
            await session.abortTransaction().catch(() => {});
          }
          if (
            rescheduleErr.code === 11000 ||
            (rescheduleErr.message && rescheduleErr.message.includes("11000"))
          ) {
            return res.status(409).json({
              success: false,
              message: "The requested new slot is already booked and confirmed. Please choose another time.",
            });
          }
          throw rescheduleErr;
        } finally {
          await session.endSession().catch(() => {});
        }
      } else {
        // Fallback for standalone: reserve new slot first (unique index protects against collisions)
        try {
          await SlotReservationModel.create({
            doctorId: docId,
            slotDate: newSlotDate,
            slotTime: cleanNewTime,
            appointmentId: appointment._id,
            userId: appointment.userId._id || appointment.userId,
            status: "confirmed",
          });
        } catch (slotErr) {
          if (slotErr.code === 11000 || (slotErr.message && slotErr.message.includes("11000"))) {
            return res.status(409).json({
              success: false,
              message: "The requested new slot is already booked and confirmed. Please choose another time.",
            });
          }
          throw slotErr;
        }

        // Release old reservation only AFTER new slot reservation successfully created
        await SlotReservationModel.deleteOne({
          appointmentId: appointment._id,
          slotDate: appointment.slotDate,
          slotTime: appointment.slotTime,
        });

        appointment.slotDate = newSlotDate;
        appointment.slotTime = cleanNewTime;
        appointment.status = "confirmed";
        await appointment.save();

        await AppointmentModel.updateMany(
          {
            _id: { $ne: appointment._id },
            doctorId: docId,
            slotDate: newSlotDate,
            slotTime: cleanNewTime,
            status: "pending",
          },
          {
            $set: {
              status: "rejected",
              cancellationReason: "This slot was confirmed for another patient",
              cancelledBy: "system",
            },
          }
        );
      }

      await invalidateDoctorCaches();

      return res.status(200).json({
        success: true,
        message: "Appointment rescheduled successfully. Confirmed for the new time.",
        appointment,
      });
    }

    // If appointment is PENDING:
    const [pendingConflictRes, pendingConflictAppt] = await Promise.all([
      SlotReservationModel.findOne({
        doctorId: docId,
        slotDate: newSlotDate,
        slotTime: cleanNewTime,
      }).lean(),
      AppointmentModel.findOne({
        doctorId: docId,
        slotDate: newSlotDate,
        slotTime: cleanNewTime,
        status: "confirmed",
      }).lean(),
    ]);

    if (pendingConflictRes || pendingConflictAppt) {
      return res.status(409).json({
        success: false,
        message: "The requested new slot is already booked and confirmed. Please choose another time.",
      });
    }

    appointment.slotDate = newSlotDate;
    appointment.slotTime = cleanNewTime;
    appointment.status = "pending";
    await appointment.save();

    await invalidateDoctorCaches();

    return res.status(200).json({
      success: true,
      message: "Appointment request rescheduled successfully. Pending confirmation for the new time.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};
