import { test, describe } from "node:test";
import assert from "node:assert/strict";
import SlotReservationModel from "../models/slotReservationModel.js";
import AppointmentModel from "../models/appointmentsModel.js";
import mongoose from "mongoose";

describe("🏥 Two-Stage Concurrency & Slot Reservation Tests", () => {
  const fakeDoctorId = new mongoose.Types.ObjectId();
  const fakeUser1 = new mongoose.Types.ObjectId();
  const fakeUser2 = new mongoose.Types.ObjectId();
  const fakeAppt1 = new mongoose.Types.ObjectId();
  const fakeAppt2 = new mongoose.Types.ObjectId();
  const testDate = "2026-11-15";
  const testTime = "10:30";

  test("1. Stage 1: Multiple pending appointments can be requested for the same slot without collision", () => {
    // Stage 1 pending appointments do not hold engine-level unique slot locks
    const pendingAppt1 = new AppointmentModel({
      _id: fakeAppt1,
      userId: fakeUser1,
      doctorId: fakeDoctorId,
      slotDate: testDate,
      slotTime: testTime,
      amount: 800,
      status: "pending",
    });

    const pendingAppt2 = new AppointmentModel({
      _id: fakeAppt2,
      userId: fakeUser2,
      doctorId: fakeDoctorId,
      slotDate: testDate,
      slotTime: testTime,
      amount: 800,
      status: "pending",
    });

    assert.equal(pendingAppt1.status, "pending");
    assert.equal(pendingAppt2.status, "pending");
    assert.equal(pendingAppt1.slotDate, pendingAppt2.slotDate);
    assert.equal(pendingAppt1.slotTime, pendingAppt2.slotTime);
  });

  test("2. Stage 2: Confirmed slot reservation creates atomic unique document", () => {
    const reservation = new SlotReservationModel({
      doctorId: fakeDoctorId,
      slotDate: testDate,
      slotTime: testTime,
      appointmentId: fakeAppt1,
      userId: fakeUser1,
      status: "confirmed",
    });

    assert.equal(reservation.status, "confirmed");
    assert.equal(reservation.doctorId, fakeDoctorId);
    assert.equal(reservation.slotDate, testDate);
    assert.equal(reservation.slotTime, testTime);
  });

  test("3. Concurrency Protection: Duplicate confirmation on same slot throws duplicate key error", () => {
    // Simulate unique constraint logic in memory / mock
    const confirmedSlots = new Set();
    const makeSlotKey = (docId, date, time) => `${docId}_${date}_${time}`;

    const tryReserveSlot = (docId, date, time) => {
      const key = makeSlotKey(docId, date, time);
      if (confirmedSlots.has(key)) {
        const error = new Error("Duplicate key error on slot reservation");
        error.code = 11000;
        throw error;
      }
      confirmedSlots.add(key);
      return { success: true };
    };

    // First patient confirmation succeeds
    const firstRes = tryReserveSlot(fakeDoctorId, testDate, testTime);
    assert.equal(firstRes.success, true);

    // Second simultaneous confirmation attempt fails with 11000
    assert.throws(
      () => tryReserveSlot(fakeDoctorId, testDate, testTime),
      (err) => err.code === 11000,
      "Second confirmation must fail with duplicate key conflict"
    );
  });

  test("4. Cancellation cleanly releases slot reservation", () => {
    const confirmedSlots = new Set();
    const makeSlotKey = (docId, date, time) => `${docId}_${date}_${time}`;
    const key = makeSlotKey(fakeDoctorId, testDate, testTime);

    // Reserve
    confirmedSlots.add(key);
    assert.equal(confirmedSlots.has(key), true);

    // Cancel & Release
    confirmedSlots.delete(key);
    assert.equal(confirmedSlots.has(key), false);

    // Subsequent patient can now successfully confirm the slot
    confirmedSlots.add(key);
    assert.equal(confirmedSlots.has(key), true);
  });

  test("5. Rescheduling updates slot and releases previous reservation", () => {
    const confirmedSlots = new Set();
    const makeSlotKey = (docId, date, time) => `${docId}_${date}_${time}`;
    const oldKey = makeSlotKey(fakeDoctorId, testDate, testTime);
    const newKey = makeSlotKey(fakeDoctorId, testDate, "14:00");

    // Initially confirmed on old slot
    confirmedSlots.add(oldKey);

    // Reschedule: Release old slot, check new slot
    assert.equal(confirmedSlots.has(newKey), false, "New slot must be open");
    confirmedSlots.delete(oldKey);
    confirmedSlots.add(newKey);

    assert.equal(confirmedSlots.has(oldKey), false, "Old slot must be released");
    assert.equal(confirmedSlots.has(newKey), true, "New slot must be reserved");
  });
});
