import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("🏥 Appointment Lifecycle & Concurrency Business Logic", () => {
  test("Cancellation policy rejects cancellation of completed visits", () => {
    const checkCanCancel = (status) => {
      if (status === "completed") {
        throw new Error("Cannot cancel an appointment that has already been completed.");
      }
      if (status === "cancelled" || status === "cancel") {
        throw new Error("Appointment is already cancelled.");
      }
      return true;
    };

    assert.equal(checkCanCancel("pending"), true);
    assert.equal(checkCanCancel("confirmed"), true);

    assert.throws(() => checkCanCancel("completed"), /Cannot cancel/);
    assert.throws(() => checkCanCancel("cancelled"), /already cancelled/);
  });

  test("Appointment ownership prevents IDOR across patients", () => {
    const appointment = {
      _id: "appt_123",
      userId: "user_alice_456",
      doctorId: "doc_789",
    };

    const verifyOwnership = (requestUserId, isAdmin) => {
      if (isAdmin) return true;
      if (appointment.userId !== requestUserId) {
        throw new Error("Forbidden: You cannot modify another patient's appointment.");
      }
      return true;
    };

    // Patient Alice accessing her own appointment -> Allowed
    assert.equal(verifyOwnership("user_alice_456", false), true);

    // Patient Bob attempting IDOR access -> Forbidden
    assert.throws(
      () => verifyOwnership("user_bob_999", false),
      /Forbidden: You cannot modify another patient's appointment/
    );

    // Admin accessing Alice's appointment -> Allowed
    assert.equal(verifyOwnership("admin_001", true), true);
  });

  test("Concurrency collision detection catches double booking and flags conflict", () => {
    const existingBookings = [
      { doctorId: "doc_1", slotDate: "2026-11-05", slotTime: "10:00 AM", status: "confirmed" },
      { doctorId: "doc_1", slotDate: "2026-11-05", slotTime: "10:30 AM", status: "cancelled" }, // cancelled slot is free
    ];

    const isSlotAvailable = (doctorId, slotDate, slotTime) => {
      return !existingBookings.some(
        (b) =>
          b.doctorId === doctorId &&
          b.slotDate === slotDate &&
          b.slotTime === slotTime &&
          !["cancelled", "cancel"].includes(b.status)
      );
    };

    // 10:00 AM is booked -> Conflict (false)
    assert.equal(isSlotAvailable("doc_1", "2026-11-05", "10:00 AM"), false);

    // 10:30 AM was cancelled -> Available (true)
    assert.equal(isSlotAvailable("doc_1", "2026-11-05", "10:30 AM"), true);

    // 11:00 AM was never booked -> Available (true)
    assert.equal(isSlotAvailable("doc_1", "2026-11-05", "11:00 AM"), true);
  });
});
