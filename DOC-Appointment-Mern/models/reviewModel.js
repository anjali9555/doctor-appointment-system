import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor ID is required"],
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required"],
      unique: true, // Only 1 review per completed appointment
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  { timestamps: true }
);

// Virtual property for patientId mapping to userId
reviewSchema.virtual("patientId").get(function () {
  return this.userId;
});

reviewSchema.set("toJSON", { virtuals: true });
reviewSchema.set("toObject", { virtuals: true });

reviewSchema.index({ doctorId: 1, createdAt: -1 });

const ReviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema, "reviews");
export default ReviewModel;
