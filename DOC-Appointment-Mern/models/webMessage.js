import mongoose from "mongoose";

const webMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    contact: {
      type: String,
      required: [true, "Contact number or email is required"],
      trim: true
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "in-progress"],
      default: "pending"
    },
    notes: {
      type: String,
      default: ""
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

webMessageSchema.index({ status: 1, createdAt: -1 });

const WebMessageModel = mongoose.models.WebMessage || mongoose.models.webmessage || mongoose.model("WebMessage", webMessageSchema, "webmessages");
export default WebMessageModel;
