import mongoose from "mongoose";

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["faq", "policy", "specialty", "doctor", "appointment", "general"],
      default: "faq",
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      default: "clinic-handbook",
    },
  },
  { timestamps: true }
);

knowledgeBaseSchema.index({ category: 1, active: 1 });
knowledgeBaseSchema.index({ title: "text", content: "text", tags: "text" });

const KnowledgeBaseModel =
  mongoose.models.KnowledgeBase || mongoose.model("KnowledgeBase", knowledgeBaseSchema, "knowledgebase");
export default KnowledgeBaseModel;
