import crypto from "crypto";
import Razorpay from "razorpay";
import PaymentModel from "../models/paymentModel.js";
import AppointmentModel from "../models/appointmentsModel.js";
import DoctorModel from "../models/doctorModel.js";

/**
 * Lazily initialize Razorpay SDK instance using current environment variables
 */
export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !keyId.trim() || !keySecret.trim()) {
    return null;
  }
  try {
    return new Razorpay({
      key_id: keyId.trim(),
      key_secret: keySecret.trim(),
    });
  } catch (err) {
    console.warn("Failed to initialize Razorpay SDK:", err.message);
    return null;
  }
};

/**
 * Check if Razorpay gateway is ready and configured with non-empty credentials
 */
export const isPaymentGatewayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(
    keyId &&
    keySecret &&
    typeof keyId === "string" &&
    typeof keySecret === "string" &&
    keyId.trim().length > 0 &&
    keySecret.trim().length > 0
  );
};

/**
 * Create a new payment order for an appointment
 */
export const createPaymentOrder = async ({ appointmentId, userId }) => {
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // IDOR check: ensure the appointment belongs to the calling patient
  if (appointment.userId.toString() !== userId.toString()) {
    throw new Error("Unauthorized access to appointment payment");
  }

  // Business Rule: Appointment MUST already be confirmed by Admin/Doctor.
  // Pending requests, cancelled appointments, or rejected requests cannot accept online payment.
  if (appointment.status !== "confirmed") {
    return {
      success: false,
      message: `Online payment is only available for confirmed appointments. Current appointment status is '${appointment.status}'.`,
    };
  }

  // Prevent duplicate payment: already settled
  if (appointment.payment === true) {
    return {
      success: false,
      message: "This appointment has already been paid for.",
    };
  }

  if (!isPaymentGatewayConfigured()) {
    return {
      success: false,
      configured: false,
      message:
        "Online payment gateway is in test mode. You can settle consultation fees at the clinic reception.",
    };
  }

  // Authoritative amount calculation and validation using doctor's consultation fee
  const doctor = await DoctorModel.findById(appointment.doctorId);
  if (!doctor) {
    throw new Error("Associated doctor not found for this appointment.");
  }

  const authoritativeAmount = Number(doctor.fees);
  if (isNaN(authoritativeAmount) || authoritativeAmount <= 0) {
    throw new Error("Doctor consultation fee is invalid.");
  }

  // Synchronize appointment amount if it diverged
  if (appointment.amount !== authoritativeAmount) {
    appointment.amount = authoritativeAmount;
    await appointment.save();
  }

  const amountInPaise = Math.round(authoritativeAmount * 100);
  const keyId = process.env.RAZORPAY_KEY_ID.trim();

  // Prevent duplicate orders: if an unpaid order was already created for this appointment, reuse it
  const existingOrder = await PaymentModel.findOne({
    appointmentId: appointment._id,
    userId,
    status: "created",
    amount: authoritativeAmount,
  }).sort({ createdAt: -1 });

  if (existingOrder && existingOrder.razorpayOrderId) {
    return {
      success: true,
      configured: true,
      orderId: existingOrder.razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId,
      appointmentId: appointment._id,
      reusedExistingOrder: true,
    };
  }

  const receipt = `rcpt_${appointment._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;

  const orderOptions = {
    amount: amountInPaise,
    currency: "INR",
    receipt,
    notes: {
      appointmentId: appointment._id.toString(),
      userId: userId.toString(),
      doctorId: appointment.doctorId.toString(),
    },
  };

  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    throw new Error("Failed to initialize Razorpay SDK instance.");
  }

  const order = await razorpay.orders.create(orderOptions);

  // Record payment initiation in database
  await PaymentModel.create({
    appointmentId: appointment._id,
    userId,
    doctorId: appointment.doctorId,
    razorpayOrderId: order.id,
    amount: authoritativeAmount,
    currency: "INR",
    status: "created",
    receipt,
  });

  return {
    success: true,
    configured: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    appointmentId: appointment._id,
  };
};

/**
 * Verify Razorpay payment signature and mark appointment paid
 */
export const verifyPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  userId,
}) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("Razorpay secret key is not configured.");
  }

  // Find payment record
  const paymentRecord = await PaymentModel.findOne({ razorpayOrderId });
  if (!paymentRecord) {
    throw new Error("Payment record not found for this order ID.");
  }

  // IDOR verification
  if (userId && paymentRecord.userId.toString() !== userId.toString()) {
    throw new Error("Unauthorized: Payment does not belong to the current user.");
  }

  // Idempotency: Prevent duplicate verification if already processed
  if (paymentRecord.status === "paid") {
    const existingAppointment = await AppointmentModel.findById(paymentRecord.appointmentId);
    return {
      success: true,
      message: "Payment has already been verified and processed.",
      appointment: existingAppointment,
      payment: paymentRecord,
      alreadyVerified: true,
    };
  }

  // Strict backend-only signature verification: HMAC-SHA256(orderId + "|" + paymentId, keySecret)
  const generatedSignature = crypto
    .createHmac("sha256", keySecret.trim())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    paymentRecord.status = "failed";
    paymentRecord.razorpayPaymentId = razorpayPaymentId;
    paymentRecord.razorpaySignature = razorpaySignature;
    paymentRecord.errorMessage = "Signature mismatch: potential tampering detected.";
    await paymentRecord.save();

    throw new Error("Invalid payment signature. Verification failed.");
  }

  // Verify associated appointment exists and is not cancelled or rejected
  const appointment = await AppointmentModel.findById(paymentRecord.appointmentId);
  if (!appointment) {
    throw new Error("Associated appointment not found.");
  }

  if (["cancelled", "cancel", "rejected"].includes(appointment.status)) {
    paymentRecord.status = "failed";
    paymentRecord.razorpayPaymentId = razorpayPaymentId;
    paymentRecord.razorpaySignature = razorpaySignature;
    paymentRecord.errorMessage = `Payment submitted after appointment was ${appointment.status}.`;
    await paymentRecord.save();

    throw new Error(`Cannot settle fee: Appointment has already been ${appointment.status}.`);
  }

  // Mark payment as paid
  paymentRecord.status = "paid";
  paymentRecord.razorpayPaymentId = razorpayPaymentId;
  paymentRecord.razorpaySignature = razorpaySignature;
  await paymentRecord.save();

  // Atomically update appointment payment flags without altering booking status or slot reservation
  appointment.payment = true;
  appointment.paymentMethod = "razorpay";
  appointment.paymentId = razorpayPaymentId;
  await appointment.save();

  return {
    success: true,
    message: "Payment successfully verified.",
    appointment,
    payment: paymentRecord,
  };
};
