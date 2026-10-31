import mongoose from "mongoose";

const slotReservationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Doctor ID is required"],
      ref: "Doctor",
      index: true,
    },
    slotDate: {
      type: String,
      required: [true, "Slot date is required"],
    },
    slotTime: {
      type: String,
      required: [true, "Slot time is required"],
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Appointment ID is required"],
      ref: "Appointment",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Patient ID is required"],
      ref: "User",
    },
    status: {
      type: String,
      enum: ["confirmed", "reserved"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

// Engine-level atomic uniqueness constraint:
// Strictly ensures only ONE confirmed reservation can exist for any given doctor on a specific date and time slot.
slotReservationSchema.index(
  { doctorId: 1, slotDate: 1, slotTime: 1 },
  { unique: true }
);

const SlotReservationModel =
  mongoose.models.SlotReservation ||
  mongoose.model("SlotReservation", slotReservationSchema, "slot_reservations");

export default SlotReservationModel;
