// import mongoose from "mongoose";
// import colors from "colors";

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`MongoDB Connected: ${conn.connection.host}`.bgGreen.white);
//   } catch (error) {
//     console.log(`Error in MongoDB: ${error}`.bgRed.white);
//   }
// };

// export default connectDB;

import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.log(`Error in MongoDB: ${error}`.red);
    process.exit(1);
  }
};

export default connectDB;