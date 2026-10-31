import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      // Removed duplicate field-level index: true (schema-level index defined below)
    },
    email: {
      type: String,
      required: [true, "Doctor email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    speciality: {
      type: String,
      required: [true, "Speciality is required"],
      trim: true,
    },
    degree: {
      type: String,
      required: [true, "Degree is required"],
    },
    experience: {
      type: Number,
      required: [true, "Experience in years is required"],
      min: [0, "Experience cannot be negative"],
    },
    about: {
      type: String,
      required: [true, "About section is required"],
    },
    fees: {
      type: Number,
      required: [true, "Consultation fees is required"],
      min: [0, "Fees cannot be negative"],
    },
    image: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    available: { type: Boolean, default: true },
    // Defaults to 0 for doctors who have not received verified patient reviews
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    // Advanced Availability Management
    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    workingHours: {
      start: { type: String, default: "09:00" }, // 24h format HH:mm
      end: { type: String, default: "17:00" },
    },
    slotDuration: {
      type: Number,
      default: 30, // minutes per slot
    },
    breakTimes: [
      {
        start: { type: String, default: "13:00" },
        end: { type: String, default: "14:00" },
      },
    ],
    leaveDates: {
      type: [String], // Array of 'YYYY-MM-DD'
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for faster discovery, sorting, and filtering
doctorSchema.index({ name: 1 });
doctorSchema.index({ speciality: 1, available: 1 });
doctorSchema.index({ fees: 1 });
doctorSchema.index({ experience: -1 });
doctorSchema.index({ rating: -1 });

const DoctorModel =
  mongoose.models.Doctor ||
  mongoose.models.doctor ||
  mongoose.model("Doctor", doctorSchema, "doctors");

export default DoctorModel;
