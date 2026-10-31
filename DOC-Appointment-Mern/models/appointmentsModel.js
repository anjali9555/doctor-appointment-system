import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Patient ID is required"],
      ref: "User",
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Doctor ID is required"],
      ref: "Doctor",
      index: true,
    },
    slotDate: {
      type: String,
      required: [true, "Slot date is required"],
      index: true,
    },
    slotTime: {
      type: String,
      required: [true, "Slot time is required"]
    },
    amount: {
      type: Number,
      required: [true, "Consultation fee amount is required"]
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "completed", "cancelled", "cancel", "rejected", "no-show"],
      default: "pending",
      index: true,
    },
    payment: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "razorpay"],
      default: "cash"
    },
    paymentId: {
      type: String,
      default: ""
    },
    cancellationReason: {
      type: String,
      default: ""
    },
    cancelledBy: {
      type: String,
      enum: ["patient", "admin", "doctor", "system", ""],
      default: ""
    },
    patientNotes: {
      type: String,
      default: ""
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null
    },
    idempotencyKey: {
      type: String,
      default: "",
      index: true,
    },
    remindersSent: {
      type: [String], // e.g. ["24h", "1h"] to prevent duplicate reminder deliveries
      default: [],
    },
  },
  { timestamps: true }
);

// High-performance query compound indexes
appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, slotDate: 1 });
appointmentSchema.index({ status: 1, createdAt: -1 });
appointmentSchema.index({ slotDate: 1, status: 1 });

// Engine-level uniqueness constraint:
// Allows multiple simultaneous 'pending' requests, but strictly enforces only ONE 'confirmed' appointment per slot.
appointmentSchema.index(
  { doctorId: 1, slotDate: 1, slotTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "confirmed"
    }
  }
);

const AppointmentModel =
  mongoose.models.Appointment ||
  mongoose.models.appointment ||
  mongoose.model("Appointment", appointmentSchema, "appointments");

export default AppointmentModel;
