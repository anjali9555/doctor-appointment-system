import express from "express"; // Line 1 hidden in screenshot but required
import dotenv from "dotenv";
import colors from "colors"; // Note: Ensure you have installed this package
import morgan from "morgan";
import cors from "cors";
import testRoutes from "./routes/testRoutes.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import webMessageRoutes from "./routes/webMessageRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
//config env var
dotenv.config();

//database
connectDB();

//rest object
const app = express();

//middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

//routes
app.use("/api/v1/test", testRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/webmessage", webMessageRoutes);
app.use("/api/v1/doctor", doctorRoutes);
app.use("/api/v1/appointment", appointmentRoutes);

app.get("/", (req, res) => {
  res.send("<h1> Node Server Running </h1>");
});

//port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Node Server Running on Port ${PORT}`);
});