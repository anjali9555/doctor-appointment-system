import PaymentModel from "../models/paymentModel.js";
import {
  createPaymentOrder,
  verifyPayment as verifyPaymentService,
  isPaymentGatewayConfigured,
} from "../services/paymentService.js";

// ==========================================
// CHECK PAYMENT GATEWAY CONFIGURATION STATUS
// ==========================================
export const getGatewayStatus = async (req, res) => {
  const configured = isPaymentGatewayConfigured();
  return res.status(200).json({
    success: true,
    configured,
    keyId: configured ? process.env.RAZORPAY_KEY_ID?.trim() : null,
    mode: process.env.RAZORPAY_MODE || "test",
    message: configured
      ? "Razorpay payment gateway is ready."
      : "Online payment gateway is in test mode. You can settle consultation fees at the clinic reception.",
  });
};

// ==========================================
// CREATE PAYMENT ORDER
// ==========================================
export const createOrder = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required to initiate payment.",
      });
    }

    const orderResult = await createPaymentOrder({
      appointmentId,
      userId: req.user.id,
    });

    if (!orderResult.success) {
      return res.status(orderResult.configured === false ? 200 : 400).json(orderResult);
    }

    return res.status(200).json({
      success: true,
      ...orderResult,
    });
  } catch (error) {
    if (error.message.includes("Unauthorized") || error.message.includes("not found")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// ==========================================
// VERIFY PAYMENT SIGNATURE
// ==========================================
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.",
      });
    }

    const result = await verifyPaymentService({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (
      error.message.includes("Invalid payment signature") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("Cannot settle fee") ||
      error.message.includes("not found")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// ==========================================
// RECORD CLIENT-SIDE PAYMENT FAILURE
// ==========================================
export const recordPaymentFailure = async (req, res, next) => {
  try {
    const { razorpayOrderId, error } = req.body;
    if (razorpayOrderId) {
      await PaymentModel.findOneAndUpdate(
        { razorpayOrderId, userId: req.user.id, status: "created" },
        {
          status: "failed",
          errorMessage: error?.description || error?.reason || error?.message || "Payment cancelled or failed on checkout",
        }
      );
    }
    return res.status(200).json({
      success: true,
      message: "Payment failure recorded.",
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// GET PAYMENT HISTORY (Admin or Self)
// ==========================================
export const getPaymentHistory = async (req, res, next) => {
  try {
    const query = {};

    if (!req.user.isAdmin) {
      query.userId = req.user.id;
    } else if (req.query.userId) {
      query.userId = req.query.userId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const payments = await PaymentModel.find(query)
      .populate("userId", "name email")
      .populate("doctorId", "name speciality")
      .populate("appointmentId", "slotDate slotTime amount")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      totalCount: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};
