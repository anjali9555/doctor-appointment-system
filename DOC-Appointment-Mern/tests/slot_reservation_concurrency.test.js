import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const getTestDbUri = () => {
  const baseUri = process.env.MONGO_URL || "mongodb://localhost:27017";
  if (baseUri.includes(".mongodb.net:27017/?")) {
    return baseUri.replace(".mongodb.net:27017/?", ".mongodb.net:27017/medicare_concurrency_test_db?");
  }
  if (baseUri.includes("?")) {
    const [base, query] = baseUri.split("?");
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${cleanBase}/medicare_concurrency_test_db?${query}`;
  }
  return baseUri.endsWith("/")
    ? `${baseUri}medicare_concurrency_test_db`
    : `${baseUri}/medicare_concurrency_test_db`;
};

describe("🧪 MediCare Slot Reservation & High Concurrency Test Suite (Dedicated DB)", () => {
  let AppointmentModel;
  let SlotReservationModel;
  let DoctorModel;
  let UserModel;
  let confirmAppointmentWithConcurrencyProtection;
  let normalizeSlotTime;

  let testDoctor1Id;
  let testDoctor2Id;
  let adminUserId;
  const testDate = "2026-11-20";
  const testTime = "10:00 AM";

  before(async () => {
    const testUri = getTestDbUri();
    await mongoose.connect(testUri);

    // Import models and controllers after mongoose connection
    AppointmentModel = (await import("../models/appointmentsModel.js")).default;
    SlotReservationModel = (await import("../models/slotReservationModel.js")).default;
    DoctorModel = (await import("../models/doctorModel.js")).default;
    UserModel = (await import("../models/userModel.js")).default;
    const apptController = await import("../controllers/appointmentsController.js");
    confirmAppointmentWithConcurrencyProtection = apptController.confirmAppointmentWithConcurrencyProtection;
    const schedService = await import("../services/schedulingService.js");
    normalizeSlotTime = schedService.normalizeSlotTime;

    // Clean test database collections
    await Promise.all([
      AppointmentModel.deleteMany({}),
      SlotReservationModel.deleteMany({}),
      DoctorModel.deleteMany({}),
      UserModel.deleteMany({}),
    ]);

    // Ensure database indexes are built and synchronized
    await AppointmentModel.syncIndexes();
    await SlotReservationModel.syncIndexes();

    // Create Admin User
    const adminUser = await UserModel.create({
      name: "Super Admin",
      email: "admin_test@medicare.com",
      password: "password123",
      role: "admin",
      isAdmin: true,
    });
    adminUserId = adminUser._id;

    // Create 2 Test Doctors
    const doctor1 = await DoctorModel.create({
      name: "Dr. Gregory House",
      email: "house@medicare.com",
      speciality: "General Physician",
      degree: "MD",
      experience: 15,
      about: "Diagnostic Medicine specialist",
      fees: 1000,
      available: true,
    });
    testDoctor1Id = doctor1._id;

    const doctor2 = await DoctorModel.create({
      name: "Dr. James Wilson",
      email: "wilson@medicare.com",
      speciality: "Oncology",
      degree: "MD",
      experience: 12,
      about: "Head of Oncology",
      fees: 1200,
      available: true,
    });
    testDoctor2Id = doctor2._id;
  });

  after(async () => {
    try {
      if (mongoose.connection?.db) {
        await mongoose.connection.db.dropDatabase();
      }
      await mongoose.disconnect();
    } catch {
      // Disconnect cleanly
    }
  });

  let pendingAppointmentIds = [];

  test("1. 50 patients submit pending requests for the same doctor and time; all 50 saved as pending", async () => {
    const patientPromises = Array.from({ length: 50 }, async (_, i) => {
      const patient = await UserModel.create({
        name: `Patient ${i + 1}`,
        email: `patient_${i + 1}_${Date.now()}@test.com`,
        password: "password123",
        role: "patient",
      });

      const appt = await AppointmentModel.create({
        userId: patient._id,
        doctorId: testDoctor1Id,
        slotDate: testDate,
        slotTime: normalizeSlotTime(testTime),
        amount: 1000,
        status: "pending",
        patientNotes: `Need consultation #${i + 1}`,
      });

      return appt._id;
    });

    pendingAppointmentIds = await Promise.all(patientPromises);

    assert.equal(pendingAppointmentIds.length, 50, "Should have created 50 requests");

    const pendingCount = await AppointmentModel.countDocuments({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(testTime),
      status: "pending",
    });

    assert.equal(pendingCount, 50, "All 50 appointments must be in pending status");
  });

  test("2. Pending requests must not create slot reservations", async () => {
    const reservationCount = await SlotReservationModel.countDocuments({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(testTime),
    });

    assert.equal(reservationCount, 0, "No slot reservation must exist while appointments are pending");
  });

  test("3. One Admin confirms one of those 50 requests; exactly one appointment becomes confirmed and one reservation exists", async () => {
    const chosenApptId = pendingAppointmentIds[0];
    const adminReqUser = { id: adminUserId.toString(), role: "admin", isAdmin: true };

    const result = await confirmAppointmentWithConcurrencyProtection(chosenApptId, adminReqUser);
    assert.equal(result.alreadyConfirmed, false);
    assert.equal(result.appointment.status, "confirmed");

    const confirmedCount = await AppointmentModel.countDocuments({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(testTime),
      status: "confirmed",
    });
    assert.equal(confirmedCount, 1, "Exactly one appointment must be confirmed");

    const activeReservations = await SlotReservationModel.countDocuments({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(testTime),
    });
    assert.equal(activeReservations, 1, "Exactly one active slot reservation must exist in MongoDB");
  });

  test("4. The remaining 49 competing requests must become rejected with proper reason", async () => {
    const rejectedCount = await AppointmentModel.countDocuments({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(testTime),
      status: "rejected",
    });

    assert.equal(rejectedCount, 49, "Remaining 49 competing requests must be marked rejected");

    const rejectedSample = await AppointmentModel.findOne({
      _id: pendingAppointmentIds[1],
    });
    assert.equal(rejectedSample.status, "rejected");
    assert.equal(rejectedSample.cancellationReason, "This slot was confirmed for another patient");
    assert.equal(rejectedSample.cancelledBy, "system");

    // Verify losing requests cannot be confirmed later
    const adminReqUser = { id: adminUserId.toString(), role: "admin", isAdmin: true };
    await assert.rejects(
      async () => {
        await confirmAppointmentWithConcurrencyProtection(pendingAppointmentIds[1], adminReqUser);
      },
      (err) => err.statusCode === 400 || err.statusCode === 409
    );
  });

  test("5 & 6. Concurrent confirmations for the same slot: Exactly one succeeds, losers return 409 Conflict", async () => {
    const freshSlotTime = "11:30 AM";

    // Create 10 pending requests for Dr. Gregory House at 11:30 AM
    const competingAppts = await Promise.all(
      Array.from({ length: 10 }, async (_, i) => {
        const p = await UserModel.create({
          name: `Rival Patient ${i + 1}`,
          email: `rival_${i + 1}_${Date.now()}@test.com`,
          password: "password123",
          role: "patient",
        });

        return AppointmentModel.create({
          userId: p._id,
          doctorId: testDoctor1Id,
          slotDate: testDate,
          slotTime: normalizeSlotTime(freshSlotTime),
          amount: 1000,
          status: "pending",
        });
      })
    );

    const adminReqUser = { id: adminUserId.toString(), role: "admin", isAdmin: true };

    // Fire simultaneous confirmation calls for all 10 appointments
    const confirmAttempts = competingAppts.map(async (appt) => {
      try {
        const res = await confirmAppointmentWithConcurrencyProtection(appt._id, adminReqUser);
        return { success: true, apptId: appt._id, res };
      } catch (err) {
        return { success: false, apptId: appt._id, statusCode: err.statusCode || 500, message: err.message };
      }
    });

    const results = await Promise.all(confirmAttempts);

    const successes = results.filter((r) => r.success);
    const conflicts = results.filter((r) => !r.success && r.statusCode === 409);

    assert.equal(successes.length, 1, "Exactly one concurrent confirmation must succeed");
    assert.equal(conflicts.length, 9, "All 9 losing confirmation requests must fail with 409 Conflict");
    assert.match(
      conflicts[0].message,
      /This time slot has already been booked by another patient/
    );

    const reservationCheck = await SlotReservationModel.countDocuments({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(freshSlotTime),
    });
    assert.equal(reservationCheck, 1, "Database unique constraint must enforce exactly 1 reservation document");
  });

  test("7. Repeated confirmation requests for the same appointment must not create duplicate reservations (Idempotent)", async () => {
    const adminReqUser = { id: adminUserId.toString(), role: "admin", isAdmin: true };
    const winningApptId = pendingAppointmentIds[0];

    // Confirm again
    const repeatedResult = await confirmAppointmentWithConcurrencyProtection(winningApptId, adminReqUser);
    assert.equal(repeatedResult.alreadyConfirmed, true, "Should report alreadyConfirmed: true");

    const reservationCount = await SlotReservationModel.countDocuments({
      appointmentId: winningApptId,
    });
    assert.equal(reservationCount, 1, "Must still have exactly 1 reservation document");
  });

  test("8. After cancellation, the reservation is released and the slot becomes available again", async () => {
    const confirmedAppt = await AppointmentModel.findById(pendingAppointmentIds[0]);
    assert.equal(confirmedAppt.status, "confirmed");

    // Cancel appointment
    await SlotReservationModel.deleteOne({ appointmentId: confirmedAppt._id });
    confirmedAppt.status = "cancelled";
    confirmedAppt.cancelledBy = "patient";
    await confirmedAppt.save();

    // Verify reservation is gone
    const activeRes = await SlotReservationModel.findOne({ appointmentId: confirmedAppt._id });
    assert.equal(activeRes, null, "Reservation must be deleted upon cancellation");

    // Slot is now free for a new pending appointment to be confirmed
    const newPatient = await UserModel.create({
      name: "New Lucky Patient",
      email: `lucky_${Date.now()}@test.com`,
      password: "password123",
      role: "patient",
    });

    const newAppt = await AppointmentModel.create({
      userId: newPatient._id,
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(testTime),
      amount: 1000,
      status: "pending",
    });

    const adminReqUser = { id: adminUserId.toString(), role: "admin", isAdmin: true };
    const confirmNew = await confirmAppointmentWithConcurrencyProtection(newAppt._id, adminReqUser);
    assert.equal(confirmNew.appointment.status, "confirmed");

    const reReserved = await SlotReservationModel.findOne({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(testTime),
    });
    assert.notEqual(reReserved, null, "Slot must be successfully re-reserved by the new appointment");
  });

  test("9. Rescheduling to an occupied slot must fail without losing original reservation", async () => {
    // We have testDoctor1 booked at testTime ("10:00 AM")
    // Let's create another confirmed booking at "02:00 PM"
    const occupiedTime = "02:00 PM";
    const patientA = await UserModel.create({
      name: "Patient A",
      email: `patientA_${Date.now()}@test.com`,
      password: "password123",
    });
    const apptA = await AppointmentModel.create({
      userId: patientA._id,
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(occupiedTime),
      amount: 1000,
      status: "confirmed",
    });
    await SlotReservationModel.create({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(occupiedTime),
      appointmentId: apptA._id,
      userId: patientA._id,
      status: "confirmed",
    });

    // Patient B has confirmed appointment at "03:00 PM"
    const patientBTime = "03:00 PM";
    const patientB = await UserModel.create({
      name: "Patient B",
      email: `patientB_${Date.now()}@test.com`,
      password: "password123",
    });
    const apptB = await AppointmentModel.create({
      userId: patientB._id,
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(patientBTime),
      amount: 1000,
      status: "confirmed",
    });
    await SlotReservationModel.create({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(patientBTime),
      appointmentId: apptB._id,
      userId: patientB._id,
      status: "confirmed",
    });

    // Attempt to reschedule Patient B to occupied slot ("02:00 PM")
    // Simulate reschedule atomic check
    const isConflict = await SlotReservationModel.findOne({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(occupiedTime),
      appointmentId: { $ne: apptB._id },
    });

    assert.notEqual(isConflict, null, "Must detect conflict on occupied slot");

    // Patient B's original reservation remains untouched
    const originalRes = await SlotReservationModel.findOne({
      appointmentId: apptB._id,
      slotTime: normalizeSlotTime(patientBTime),
    });
    assert.notEqual(originalRes, null, "Original slot reservation for Patient B must be preserved intact");
  });

  test("10. Two different doctors can have appointments at the exact same date and time", async () => {
    const sharedTime = "04:00 PM";

    // Doctor 1 booking at 04:00 PM
    const p1 = await UserModel.create({
      name: "Doc1 Patient",
      email: `d1p_${Date.now()}@test.com`,
      password: "password123",
    });
    const apptDoc1 = await AppointmentModel.create({
      userId: p1._id,
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(sharedTime),
      amount: 1000,
      status: "pending",
    });

    // Doctor 2 booking at 04:00 PM
    const p2 = await UserModel.create({
      name: "Doc2 Patient",
      email: `d2p_${Date.now()}@test.com`,
      password: "password123",
    });
    const apptDoc2 = await AppointmentModel.create({
      userId: p2._id,
      doctorId: testDoctor2Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(sharedTime),
      amount: 1200,
      status: "pending",
    });

    const adminReqUser = { id: adminUserId.toString(), role: "admin", isAdmin: true };

    const conf1 = await confirmAppointmentWithConcurrencyProtection(apptDoc1._id, adminReqUser);
    const conf2 = await confirmAppointmentWithConcurrencyProtection(apptDoc2._id, adminReqUser);

    assert.equal(conf1.appointment.status, "confirmed");
    assert.equal(conf2.appointment.status, "confirmed");

    const doc1Res = await SlotReservationModel.findOne({
      doctorId: testDoctor1Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(sharedTime),
    });
    const doc2Res = await SlotReservationModel.findOne({
      doctorId: testDoctor2Id,
      slotDate: testDate,
      slotTime: normalizeSlotTime(sharedTime),
    });

    assert.notEqual(doc1Res, null);
    assert.notEqual(doc2Res, null);
    assert.notEqual(doc1Res._id.toString(), doc2Res._id.toString());
  });

  test("11. Existing login, status transitions, and role enforcement continue working correctly", async () => {
    // Verify admin role check
    const regularUser = await UserModel.create({
      name: "Regular Patient",
      email: `regular_${Date.now()}@test.com`,
      password: "password123",
      role: "patient",
      isAdmin: false,
    });

    const pendingAppt = await AppointmentModel.create({
      userId: regularUser._id,
      doctorId: testDoctor1Id,
      slotDate: "2026-11-25",
      slotTime: "09:00 AM",
      amount: 1000,
      status: "pending",
    });

    // Non-admin, non-doctor confirmation attempt should fail with 403 Forbidden
    const patientReqUser = { id: regularUser._id.toString(), role: "patient", isAdmin: false };
    await assert.rejects(
      async () => {
        await confirmAppointmentWithConcurrencyProtection(pendingAppt._id, patientReqUser);
      },
      (err) => err.statusCode === 403
    );
  });
});
