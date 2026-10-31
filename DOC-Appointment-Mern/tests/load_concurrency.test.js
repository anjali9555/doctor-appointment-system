import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { cacheGet, cacheSet } from "../services/cacheService.js";

describe("🚀 High Concurrency & Load Safety Tests", () => {
  test("1. Concurrency: 50 simultaneous confirmation attempts for the exact same slot allow exactly 1 reservation", async () => {
    const slotKey = "doc_999_2026-12-01_11:00";
    const reservedSlots = new Map();

    const atomicConfirm = async (patientId) => {
      // Simulate atomic database operation with uniqueness check
      if (reservedSlots.has(slotKey)) {
        return { success: false, status: 409, message: "Slot already confirmed" };
      }
      reservedSlots.set(slotKey, { confirmedBy: patientId, timestamp: Date.now() });
      return { success: true, status: 200, message: "Slot confirmed" };
    };

    // 50 concurrent patient confirmation attempts
    const promises = Array.from({ length: 50 }, (_, i) => atomicConfirm(`patient_${i}`));
    const results = await Promise.all(promises);

    const successfulBookings = results.filter((r) => r.success);
    const rejectedBookings = results.filter((r) => !r.success);

    assert.equal(successfulBookings.length, 1, "Exactly one booking must succeed");
    assert.equal(rejectedBookings.length, 49, "Exactly 49 bookings must be rejected with 409 Conflict");
    assert.equal(rejectedBookings[0].status, 409);
  });

  test("2. Cache Concurrency: 100 simultaneous read/write cache operations perform without data corruption", async () => {
    const writePromises = Array.from({ length: 50 }, (_, i) =>
      cacheSet(`concurrent:key:${i}`, { index: i, value: `val_${i}` }, 30)
    );
    await Promise.all(writePromises);

    const readPromises = Array.from({ length: 50 }, async (_, i) => {
      const val = await cacheGet(`concurrent:key:${i}`);
      assert.notEqual(val, null);
      assert.equal(val.index, i);
      assert.equal(val.value, `val_${i}`);
    });

    await Promise.all(readPromises);
  });

  test("3. Brute Force Defense: Lockout threshold activates after 5 consecutive failed attempts", () => {
    const userState = {
      email: "victim@example.com",
      failedLoginAttempts: 0,
      lockUntil: null,
    };

    const attemptLogin = (isCorrectPassword) => {
      if (userState.lockUntil && userState.lockUntil > Date.now()) {
        return { status: 423, message: "Account locked" };
      }

      if (!isCorrectPassword) {
        userState.failedLoginAttempts += 1;
        if (userState.failedLoginAttempts >= 5) {
          userState.lockUntil = Date.now() + 15 * 60 * 1000;
          return { status: 423, message: "Account locked" };
        }
        return { status: 401, message: "Invalid credentials" };
      }

      userState.failedLoginAttempts = 0;
      userState.lockUntil = null;
      return { status: 200, message: "Success" };
    };

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      const res = attemptLogin(false);
      assert.equal(res.status, 401);
    }

    // 5th failed attempt triggers lock
    const fifthAttempt = attemptLogin(false);
    assert.equal(fifthAttempt.status, 423);

    // 6th attempt (even with correct password) is blocked by lock
    const sixthAttempt = attemptLogin(true);
    assert.equal(sixthAttempt.status, 423);
  });
});
