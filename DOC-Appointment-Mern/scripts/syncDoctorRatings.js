import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import DoctorModel from "../models/doctorModel.js";
import ReviewModel from "../models/reviewModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const syncRatings = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error("MONGO_URL not found in .env");
    }

    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB for rating synchronization.");

    const doctors = await DoctorModel.find({});
    for (const doc of doctors) {
      const reviews = await ReviewModel.find({ doctorId: doc._id });
      const numReviews = reviews.length;
      const rating =
        numReviews > 0
          ? Number(
              (reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews).toFixed(1)
            )
          : 0;

      await DoctorModel.updateOne(
        { _id: doc._id },
        { $set: { rating, numReviews } }
      );
      console.log(`Doctor ${doc.name}: rating = ${rating}, numReviews = ${numReviews}`);
    }

    await mongoose.disconnect();
    console.log("Synchronization complete.");
  } catch (err) {
    console.error("Sync error:", err.message);
    process.exit(1);
  }
};

syncRatings();
