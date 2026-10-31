import express from "express";
import {
  getGatewayStatus,
  createOrder,
  verifyPayment,
  getPaymentHistory,
  recordPaymentFailure,
} from "../controllers/paymentController.js";
import { userAuth } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// GET PAYMENT GATEWAY STATUS || GET
router.get("/status", getGatewayStatus);

// CREATE PAYMENT ORDER || POST (User Auth)
router.post("/create-order", userAuth, createOrder);

// VERIFY PAYMENT SIGNATURE || POST (User Auth)
router.post("/verify", userAuth, verifyPayment);

// RECORD PAYMENT FAILURE || POST (User Auth)
router.post("/record-failure", userAuth, recordPaymentFailure);

// GET PAYMENT HISTORY || GET (User Auth / Admin)
router.get("/history", userAuth, getPaymentHistory);

export default router;
