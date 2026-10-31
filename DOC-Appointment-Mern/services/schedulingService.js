import DoctorModel from "../models/doctorModel.js";
import AppointmentModel from "../models/appointmentsModel.js";
import SlotReservationModel from "../models/slotReservationModel.js";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Format minutes past midnight into "HH:mm" (24h) and "hh:mm AM/PM" (12h)
 */
const minutesToTimeFormats = (totalMinutes) => {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hh24 = hours24 < 10 ? `0${hours24}` : `${hours24}`;

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const hh12 = hours12 < 10 ? `0${hours12}` : `${hours12}`;

  return {
    time24: `${hh24}:${mm}`,
    time12: `${hh12}:${mm} ${period}`,
  };
};

/**
 * Normalizes any slot time string (12-hour or 24-hour) into canonical format
 * e.g., "9:00 am" -> "09:00 AM", " 10:30 PM " -> "10:30 PM", "9:00" -> "09:00"
 */
export const normalizeSlotTime = (slotTime) => {
  if (!slotTime) return "";
  const trimmed = slotTime.toString().trim().toUpperCase();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    const hh = match12[1].padStart(2, "0");
    const mm = match12[2];
    const period = match12[3].toUpperCase();
    return `${hh}:${mm} ${period}`;
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hh = match24[1].padStart(2, "0");
    const mm = match24[2];
    return `${hh}:${mm}`;
  }
  return trimmed;
};

/**
 * Parse "HH:mm" or "hh:mm AM/PM" into total minutes from midnight
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim().toUpperCase();

  // Handle 12-hour AM/PM format
  if (trimmed.includes("AM") || trimmed.includes("PM")) {
    const isPM = trimmed.includes("PM");
    const clean = trimmed.replace("AM", "").replace("PM", "").trim();
    const [h, m] = clean.split(":").map(Number);
    let hours = h % 12;
    if (isPM) hours += 12;
    return hours * 60 + (m || 0);
  }

  // Handle 24-hour format
  const [h, m] = trimmed.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Compute available slots for a doctor on a specific date
 */
export const getAvailableSlotsForDoctor = async (doctorId, dateStr) => {
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  if (!doctor.available) {
    return {
      available: false,
      reason: "Doctor is currently not accepting appointments",
      slots: [],
    };
  }

  // Parse target date
  const targetDate = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(targetDate.getTime())) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD");
  }

  // Check leave dates
  if (doctor.leaveDates && doctor.leaveDates.includes(dateStr)) {
    return {
      available: false,
      reason: "Doctor is on leave on this date",
      slots: [],
    };
  }

  // Check day of week
  const dayName = DAYS_OF_WEEK[targetDate.getUTCDay()];
  const workingDays = doctor.workingDays || [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  if (!workingDays.includes(dayName)) {
    return {
      available: false,
      reason: `Doctor does not consult on ${dayName}s`,
      slots: [],
    };
  }

  const startMinutes = parseTimeToMinutes(doctor.workingHours?.start || "09:00");
  const endMinutes = parseTimeToMinutes(doctor.workingHours?.end || "17:00");
  const duration = doctor.slotDuration || 30;

  // Break intervals in minutes
  const breakIntervals = (doctor.breakTimes || [{ start: "13:00", end: "14:00" }]).map((b) => ({
    start: parseTimeToMinutes(b.start),
    end: parseTimeToMinutes(b.end),
  }));

  // Fetch confirmed reservations or confirmed appointments for that doctor and date
  // Pending appointment requests must NOT block or reserve slots
  const [confirmedReservations, confirmedAppointments] = await Promise.all([
    SlotReservationModel.find({
      doctorId,
      slotDate: dateStr,
    })
      .select("slotTime")
      .lean(),
    AppointmentModel.find({
      doctorId,
      slotDate: dateStr,
      status: "confirmed",
    })
      .select("slotTime")
      .lean(),
  ]);

  const bookedTimeSet = new Set();
  confirmedReservations.forEach((r) => {
    if (r.slotTime) {
      bookedTimeSet.add(r.slotTime.trim().toUpperCase());
      bookedTimeSet.add(normalizeSlotTime(r.slotTime));
    }
  });
  confirmedAppointments.forEach((a) => {
    if (a.slotTime) {
      bookedTimeSet.add(a.slotTime.trim().toUpperCase());
      bookedTimeSet.add(normalizeSlotTime(a.slotTime));
    }
  });

  const slots = [];
  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    const slotEnd = m + duration;

    // Check if slot overlaps with any break interval
    const inBreak = breakIntervals.some(
      (b) => Math.max(m, b.start) < Math.min(slotEnd, b.end)
    );

    if (inBreak) continue;

    const { time24, time12 } = minutesToTimeFormats(m);

    // Matches against booked slots formatted as 24h or 12h
    const isBooked =
      bookedTimeSet.has(time24.toUpperCase()) ||
      bookedTimeSet.has(time12.toUpperCase()) ||
      bookedTimeSet.has(normalizeSlotTime(time12)) ||
      bookedTimeSet.has(normalizeSlotTime(time24)) ||
      bookedTimeSet.has(`${time12.toLowerCase()}`);

    slots.push({
      time: time12,
      time24,
      isAvailable: !isBooked,
    });
  }

  return {
    available: true,
    doctor: {
      id: doctor._id,
      name: doctor.name,
      speciality: doctor.speciality,
      fees: doctor.fees,
    },
    date: dateStr,
    day: dayName,
    totalSlots: slots.length,
    availableSlotsCount: slots.filter((s) => s.isAvailable).length,
    slots,
  };
};
