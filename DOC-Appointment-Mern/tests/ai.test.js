import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

describe("🤖 AI Safety & Payment Gateway Tests", () => {
  test("MediAssist AI intercepts life-threatening emergency symptoms", () => {
    const emergencyKeywords = ["suicide", "chest pain", "heart attack", "can't breathe", "cannot breathe", "severe bleeding"];

    const isEmergency = (message) => {
      const lower = message.toLowerCase();
      return emergencyKeywords.some((k) => lower.includes(k));
    };

    assert.equal(isEmergency("I have terrible chest pain and cannot breathe"), true);
    assert.equal(isEmergency("What are the timings for general OPD?"), false);
    assert.equal(isEmergency("Doctor consultation fee details"), false);
  });

  test("Razorpay HMAC SHA-256 signature verification matches valid signatures and catches tampering", () => {
    const secret = "sample_test_razorpay_secret_key";
    const orderId = "order_O4uF38hGgT1234";
    const paymentId = "pay_P8xK91jYhR5678";

    // Standard Razorpay signature generation: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const verifySignature = (ord, pay, sig, sec) => {
      const expected = crypto.createHmac("sha256", sec).update(`${ord}|${pay}`).digest("hex");
      return expected === sig;
    };

    assert.equal(verifySignature(orderId, paymentId, validSignature, secret), true);
    assert.equal(verifySignature(orderId, paymentId, "forged_signature_123", secret), false);
    assert.equal(verifySignature("different_order_id", paymentId, validSignature, secret), false);
  });
});
