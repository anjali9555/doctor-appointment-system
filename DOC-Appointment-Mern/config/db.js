import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error("MONGO_URL environment variable is missing.");
    }

    // Production-ready MongoDB connection pooling configuration
    const options = {
      maxPoolSize: 50, // Maintain up to 50 socket connections
      minPoolSize: 10, // Keep at least 10 connections alive
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip IPv6 resolution delays
    };

    const conn = await mongoose.connect(mongoUrl, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err.message}`.red);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting reconnect...".yellow);
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully.".green);
    });

    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red.bold);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};

export default connectDB;
