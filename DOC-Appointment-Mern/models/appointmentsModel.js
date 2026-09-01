import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // FIX: 'require' ko 'required' kiya
      ref: "user",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // FIX: 'require' ko 'required' kiya
      ref: "doctor",
    },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    amount: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "cancel"],
      default: "pending", // Extra protection: Default set kar diya
    },
    payment: { type: Boolean, default: false }, // FIX: 'defult' ko 'default' kiya
  },
  { timestamps: true }
);

const appointmentModel = mongoose.model("appointment", appointmentSchema);

export default appointmentModel;