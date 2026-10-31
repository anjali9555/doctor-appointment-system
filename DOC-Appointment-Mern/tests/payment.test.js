import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";
import crypto from "crypto";

dotenv.config();

const getTestDbUri = () => {
  const baseUri = process.env.MONGO_URL || "mongodb://localhost:27017";
  if (baseUri.includes(".mongodb.net:27017/?")) {
    return baseUri.replace(".mongodb.net:27017/?", ".mongodb.net:27017/medicare_payment_test_db?");
  }
  if (baseUri.includes("?")) {
    const [base, query] = baseUri.split("?");
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${cleanBase}/medicare_payment_test_db?${query}`;
  }
  return baseUri.endsWith("/")
    ? `${baseUri}medicare_payment_test_db`
    : `${baseUri}/medicare_payment_test_db`;
};

describe("💳 Razorpay Test Mode Payment Pipeline & Concurrency Rules", () => {
  let AppointmentModel;
  let DoctorModel;
  let UserModel;
  let PaymentModel;
  let SlotReservationModel;
  let isPaymentGatewayConfigured;
  let createPaymentOrder;
  let verifyPayment;

  let testUser;
  let otherUser;
  let testDoctor;
  let confirmedAppt;
  let pendingAppt;
  let cancelledAppt;

  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const mockKeyId = "rzp_test_1234567890ABCD";
  const mockKeySecret = "mock_secret_key_9876543210";

  before(async () => {
    const testUri = getTestDbUri();
    await mongoose.connect(testUri);

    const apptMod = await import("../models/appointmentsModel.js");
    AppointmentModel = apptMod.default;

    const docMod = await import("../models/doctorModel.js");
    DoctorModel = docMod.default;

    const userMod = await import("../models/userModel.js");
    UserModel = userMod.default;

    const payMod = await import("../models/paymentModel.js");
    PaymentModel = payMod.default;

    const slotMod = await import("../models/slotReservationModel.js");
    SlotReservationModel = slotMod.default;

    const payService = await import("../services/paymentService.js");
    isPaymentGatewayConfigured = payService.isPaymentGatewayConfigured;
    createPaymentOrder = payService.createPaymentOrder;
    verifyPayment = payService.verifyPayment;

    // Clean test collections
    await AppointmentModel.deleteMany({});
    await DoctorModel.deleteMany({});
    await UserModel.deleteMany({});
    await PaymentModel.deleteMany({});
    await SlotReservationModel.deleteMany({});

    // Seed test users
    testUser = await UserModel.create({
      name: "Payment Test Patient",
      email: `paypatient_${Date.now()}@example.com`,
      password: "HashedPassword123",
      phone: "9876543210",
    });

    otherUser = await UserModel.create({
      name: "Other Patient",
      email: `otherpatient_${Date.now()}@example.com`,
      password: "HashedPassword123",
      phone: "9876543211",
    });

    // Seed test doctor with authoritative fees = 1200
    testDoctor = await DoctorModel.create({
      name: "Dr. Payment Test",
      email: `paydoc_${Date.now()}@example.com`,
      speciality: "Cardiologist",
      degree: "MD",
      experience: 12,
      about: "Cardiology specialist",
      fees: 1200,
      available: true,
    });

    // Seed pending appointment (unapproved)
    pendingAppt = await AppointmentModel.create({
      userId: testUser._id,
      doctorId: testDoctor._id,
      slotDate: "2026-11-25",
      slotTime: "10:00 AM",
      amount: 1200,
      status: "pending",
      payment: false,
    });

    // Seed confirmed appointment (approved by admin)
    confirmedAppt = await AppointmentModel.create({
      userId: testUser._id,
      doctorId: testDoctor._id,
      slotDate: "2026-11-25",
      slotTime: "11:00 AM",
      amount: 1200,
      status: "confirmed",
      payment: false,
    });

    // Seed slot reservation for the confirmed appointment
    await SlotReservationModel.create({
      doctorId: testDoctor._id,
      slotDate: "2026-11-25",
      slotTime: "11:00 AM",
      appointmentId: confirmedAppt._id,
      userId: testUser._id,
      status: "confirmed",
    });

    // Seed cancelled appointment
    cancelledAppt = await AppointmentModel.create({
      userId: testUser._id,
      doctorId: testDoctor._id,
      slotDate: "2026-11-25",
      slotTime: "12:00 PM",
      amount: 1200,
      status: "cancelled",
      payment: false,
    });
  });

  after(async () => {
    // Restore original env
    process.env.RAZORPAY_KEY_ID = originalKeyId || "";
    process.env.RAZORPAY_KEY_SECRET = originalKeySecret || "";

    if (mongoose.connection?.readyState === 1) {
      await AppointmentModel?.deleteMany({});
      await DoctorModel?.deleteMany({});
      await UserModel?.deleteMany({});
      await PaymentModel?.deleteMany({});
      await SlotReservationModel?.deleteMany({});
      await mongoose.disconnect();
    }
  });

  test("1. Unconfigured credentials produce graceful fallback without errors", () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    assert.equal(isPaymentGatewayConfigured(), false);
  });

  test("2. Setting valid test credentials activates isPaymentGatewayConfigured", () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    assert.equal(isPaymentGatewayConfigured(), true);
  });

  test("3. Two-Stage Booking Rule: Pending appointment strictly rejects payment order creation", async () => {
    process.env.RAZORPAY_KEY_ID = mockKeyId;
    process.env.RAZORPAY_KEY_SECRET = mockKeySecret;

    const res = await createPaymentOrder({
      appointmentId: pendingAppt._id,
      userId: testUser._id,
    });

    assert.equal(res.success, false);
    assert.match(res.message, /only available for confirmed appointments/);
  });

  test("4. Cancelled or rejected appointments cannot create payment orders", async () => {
    const res = await createPaymentOrder({
      appointmentId: cancelledAppt._id,
      userId: testUser._id,
    });

    assert.equal(res.success, false);
    assert.match(res.message, /only available for confirmed appointments/);
  });

  test("5. IDOR Guard: Patient cannot create payment order for another patient's appointment", async () => {
    await assert.rejects(
      () =>
        createPaymentOrder({
          appointmentId: confirmedAppt._id,
          userId: otherUser._id,
        }),
      /Unauthorized access to appointment payment/
    );
  });

  test("6. Duplicate Order Prevention: Reuses existing active order when available", async () => {
    // Pre-create an order record in PaymentModel simulating an earlier initiation
    const mockOrderId = "order_MOCK_TEST_123456";
    await PaymentModel.create({
      appointmentId: confirmedAppt._id,
      userId: testUser._id,
      doctorId: testDoctor._id,
      razorpayOrderId: mockOrderId,
      amount: 1200,
      currency: "INR",
      status: "created",
      receipt: "rcpt_mock_001",
    });

    const res = await createPaymentOrder({
      appointmentId: confirmedAppt._id,
      userId: testUser._id,
    });

    assert.equal(res.success, true);
    assert.equal(res.orderId, mockOrderId);
    assert.equal(res.reusedExistingOrder, true);
    assert.equal(res.amount, 120000); // 1200 * 100 paise
  });

  test("7. Signature Verification: Valid signature marks payment paid and appointment as paid", async () => {
    const orderId = "order_MOCK_TEST_123456";
    const paymentId = "pay_MOCK_TEST_987654";

    // Generate valid HMAC SHA-256 signature
    const validSignature = crypto
      .createHmac("sha256", mockKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const result = await verifyPayment({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
      userId: testUser._id,
    });

    assert.equal(result.success, true);
    assert.equal(result.payment.status, "paid");
    assert.equal(result.appointment.payment, true);
    assert.equal(result.appointment.paymentMethod, "razorpay");
    assert.equal(result.appointment.paymentId, paymentId);

    // Verify appointment status was NOT modified (remains confirmed)
    assert.equal(result.appointment.status, "confirmed");

    // Verify slot reservation remains perfectly intact
    const reservation = await SlotReservationModel.findOne({ appointmentId: confirmedAppt._id });
    assert.ok(reservation, "Slot reservation must remain intact after payment");
  });

  test("8. Signature Verification: Tampered signature is rejected and marks payment as failed", async () => {
    const tamperedOrderId = "order_MOCK_FAIL_555";
    await PaymentModel.create({
      appointmentId: confirmedAppt._id,
      userId: testUser._id,
      doctorId: testDoctor._id,
      razorpayOrderId: tamperedOrderId,
      amount: 1200,
      currency: "INR",
      status: "created",
      receipt: "rcpt_fail_001",
    });

    await assert.rejects(
      () =>
        verifyPayment({
          razorpayOrderId: tamperedOrderId,
          razorpayPaymentId: "pay_test_bogus",
          razorpaySignature: "invalid_forged_signature_hex",
          userId: testUser._id,
        }),
      /Invalid payment signature/
    );

    const failedPayment = await PaymentModel.findOne({ razorpayOrderId: tamperedOrderId });
    assert.equal(failedPayment.status, "failed");
    assert.match(failedPayment.errorMessage, /Signature mismatch/);
  });

  test("9. Idempotency: Duplicate payment verification returns safe success without errors", async () => {
    const orderId = "order_MOCK_TEST_123456";
    const paymentId = "pay_MOCK_TEST_987654";

    const validSignature = crypto
      .createHmac("sha256", mockKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const secondVerification = await verifyPayment({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
      userId: testUser._id,
    });

    assert.equal(secondVerification.success, true);
    assert.equal(secondVerification.alreadyVerified, true);
    assert.equal(secondVerification.payment.status, "paid");
  });

  test("10. Already paid appointment rejects new payment orders", async () => {
    const res = await createPaymentOrder({
      appointmentId: confirmedAppt._id,
      userId: testUser._id,
    });

    assert.equal(res.success, false);
    assert.match(res.message, /already been paid for/);
  });
});
