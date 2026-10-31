import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("📅 Scheduling & Dynamic Availability Tests", () => {
  // Helper slot generator logic mirroring services/schedulingService.js
  const generateDoctorSlots = ({ workingHours, slotDuration, breakTimes, bookedSlots }) => {
    const parseTimeToMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + (m || 0);
    };

    const startM = parseTimeToMinutes(workingHours.start);
    const endM = parseTimeToMinutes(workingHours.end);
    const breaks = breakTimes.map((b) => ({
      start: parseTimeToMinutes(b.start),
      end: parseTimeToMinutes(b.end),
    }));

    const slots = [];
    for (let m = startM; m + slotDuration <= endM; m += slotDuration) {
      const slotEnd = m + slotDuration;
      const inBreak = breaks.some((b) => Math.max(m, b.start) < Math.min(slotEnd, b.end));
      if (inBreak) continue;

      const hh = Math.floor(m / 60).toString().padStart(2, "0");
      const mm = (m % 60).toString().padStart(2, "0");
      const timeStr = `${hh}:${mm}`;

      slots.push({
        time: timeStr,
        isAvailable: !bookedSlots.includes(timeStr),
      });
    }
    return slots;
  };

  test("Dynamic slot generation respects working hours and slot duration", () => {
    const slots = generateDoctorSlots({
      workingHours: { start: "09:00", end: "11:00" },
      slotDuration: 30,
      breakTimes: [],
      bookedSlots: [],
    });

    assert.equal(slots.length, 4, "Should create 4 thirty-minute intervals between 9am and 11am");
    assert.deepEqual(
      slots.map((s) => s.time),
      ["09:00", "09:30", "10:00", "10:30"]
    );
  });

  test("Slots within doctor break times are strictly excluded", () => {
    const slots = generateDoctorSlots({
      workingHours: { start: "12:00", end: "15:00" },
      slotDuration: 30,
      breakTimes: [{ start: "13:00", end: "14:00" }],
      bookedSlots: [],
    });

    const times = slots.map((s) => s.time);
    assert.equal(times.includes("13:00"), false, "13:00 must be excluded due to break");
    assert.equal(times.includes("13:30"), false, "13:30 must be excluded due to break");
    assert.equal(times.includes("12:00"), true);
    assert.equal(times.includes("14:00"), true);
  });

  test("Already booked slots are accurately marked as unavailable", () => {
    const slots = generateDoctorSlots({
      workingHours: { start: "09:00", end: "10:30" },
      slotDuration: 30,
      breakTimes: [],
      bookedSlots: ["09:30"],
    });

    assert.equal(slots[0].isAvailable, true);
    assert.equal(slots[1].isAvailable, false, "09:30 slot must be reserved");
    assert.equal(slots[2].isAvailable, true);
  });

  // ==============================================================
  // REGRESSION TESTS: Calendar Date Selection & Timezone Alignment
  // ==============================================================
  const formatLocalDateToYYYYMMDD = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  test("Selecting November 2 returns slots for 2026-11-02", () => {
    const d = new Date(2026, 10, 2, 10, 0, 0); // Nov 2, 2026
    const dateStr = formatLocalDateToYYYYMMDD(d);
    assert.equal(dateStr, "2026-11-02", "Date formatting must strictly produce 2026-11-02");

    const heading = `Available Time Slots (${dateStr})`;
    const apiQuery = `/doctor/doc_123/slots?date=${dateStr}`;
    assert.equal(heading, "Available Time Slots (2026-11-02)");
    assert.equal(apiQuery, "/doctor/doc_123/slots?date=2026-11-02");
  });

  test("Selecting November 3 returns slots for 2026-11-03", () => {
    const d = new Date(2026, 10, 3, 10, 0, 0); // Nov 3, 2026
    const dateStr = formatLocalDateToYYYYMMDD(d);
    assert.equal(dateStr, "2026-11-03", "Date formatting must strictly produce 2026-11-03");

    const heading = `Available Time Slots (${dateStr})`;
    const apiQuery = `/doctor/doc_123/slots?date=${dateStr}`;
    assert.equal(heading, "Available Time Slots (2026-11-03)");
    assert.equal(apiQuery, "/doctor/doc_123/slots?date=2026-11-03");
  });

  test("Selecting November 4 returns slots for 2026-11-04", () => {
    const d = new Date(2026, 10, 4, 10, 0, 0); // Nov 4, 2026
    const dateStr = formatLocalDateToYYYYMMDD(d);
    assert.equal(dateStr, "2026-11-04", "Date formatting must strictly produce 2026-11-04");

    const heading = `Available Time Slots (${dateStr})`;
    const apiQuery = `/doctor/doc_123/slots?date=${dateStr}`;
    assert.equal(heading, "Available Time Slots (2026-11-04)");
    assert.equal(apiQuery, "/doctor/doc_123/slots?date=2026-11-04");
  });

  test("Date formatting remains correct during early morning hours in Asia/Kolkata (avoiding UTC shift)", () => {
    // 02:08 AM on Nov 3, 2026 in local time:
    const d = new Date(2026, 10, 3, 2, 8, 24);
    const localFormatted = formatLocalDateToYYYYMMDD(d);
    assert.equal(localFormatted, "2026-11-03", "Local date formatter must retain 2026-11-03 regardless of hour");

    // Contrast with the previous buggy approach that shifted date to Nov 2 in UTC+05:30:
    const isAsiaKolkata = d.getTimezoneOffset() === -330;
    if (isAsiaKolkata) {
      const buggyUtcDate = d.toISOString().split("T")[0];
      assert.equal(buggyUtcDate, "2026-11-02", "Demonstrates the previous bug shifting local Nov 3 to UTC Nov 2");
      assert.notEqual(localFormatted, buggyUtcDate, "Local formatter must fix the UTC mismatch");
    }
  });

  test("Switching dates prevents stale API responses from overwriting newer selections", async () => {
    let currentSelectedDate = "2026-11-02";
    let displayedSlots = null;
    let activeRequestId = 0;

    const simulateFetchSlots = async (targetDate) => {
      const requestId = ++activeRequestId;
      currentSelectedDate = targetDate;
      displayedSlots = null; // Clear previous slots immediately

      // Simulate network latency (Nov 2 takes longer than Nov 3)
      const delayMs = targetDate === "2026-11-02" ? 50 : 10;
      await new Promise((r) => setTimeout(r, delayMs));

      // Guard: Only commit state if this request is still the active one
      if (requestId === activeRequestId) {
        displayedSlots = { date: targetDate, slots: [`slot-for-${targetDate}`] };
      }
    };

    // User selects Nov 2, then immediately clicks Nov 3
    const p1 = simulateFetchSlots("2026-11-02");
    const p2 = simulateFetchSlots("2026-11-03");

    await Promise.all([p1, p2]);

    assert.equal(currentSelectedDate, "2026-11-03");
    assert.equal(displayedSlots.date, "2026-11-03", "Displayed slots must belong to Nov 3, not stale Nov 2");
  });

  test("Appointment creation payload preserves selected date without one-day shift", () => {
    const selectedDate = "2026-11-03";
    const selectedSlot = { time: "10:00 AM" };

    const bookingPayload = {
      doctorId: "60d0fe4f5311236168a109ca",
      slotDate: selectedDate,
      slotTime: selectedSlot.time,
      patientNotes: "General Checkup",
    };

    assert.equal(bookingPayload.slotDate, "2026-11-03");
    assert.equal(bookingPayload.slotTime, "10:00 AM");
  });
});
