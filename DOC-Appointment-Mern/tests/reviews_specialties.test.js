import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MASTER_SPECIALTIES } from "../config/specialties.js";
import { sanitizeMiddleware } from "../middlewares/sanitize.js";

describe("🏥 Doctor Specialties & Rating/Review System Tests", () => {
  // ========================================================
  // 1. MASTER SPECIALTIES & MERGING
  // ========================================================
  test("1. Master specialties list contains all 9 required specialties", () => {
    const required = [
      "Cardiologist",
      "Dermatologist",
      "Pediatrician",
      "Orthopedic",
      "General Physician",
      "Neurologist",
      "Gynecologist",
      "Gastroenterologist",
      "Dental",
    ];

    assert.equal(MASTER_SPECIALTIES.length, 9);
    for (const item of required) {
      assert.ok(
        MASTER_SPECIALTIES.includes(item),
        `Expected ${item} to be present in MASTER_SPECIALTIES`
      );
    }
  });

  test("2. Merging database specialties preserves master list and appends custom unique ones case-insensitively", () => {
    const dbSpecialties = ["dental", "DENTAL", "Oncologist", "  cardiologist  ", "Psychiatrist"];

    const mergedMap = new Map();
    MASTER_SPECIALTIES.forEach((s) => {
      mergedMap.set(s.toLowerCase().trim(), s);
    });

    dbSpecialties.forEach((s) => {
      if (s && s.trim()) {
        const clean = s.trim();
        const lower = clean.toLowerCase();
        if (!mergedMap.has(lower)) {
          mergedMap.set(lower, clean);
        }
      }
    });

    const result = Array.from(mergedMap.values());

    // Must still have 9 master + 2 custom (Oncologist, Psychiatrist) = 11
    assert.equal(result.length, 11);
    assert.ok(result.includes("Cardiologist"));
    assert.ok(result.includes("Dental"));
    assert.ok(result.includes("Oncologist"));
    assert.ok(result.includes("Psychiatrist"));
  });

  // ========================================================
  // 2. SPECIALTY FILTER QUERY NORMALIZATION
  // ========================================================
  test("3. Specialty query matches case-insensitively and trims whitespace", () => {
    const buildQuery = (speciality) => {
      const query = {};
      if (speciality && speciality !== "All" && speciality !== "all" && speciality !== "All Specialties") {
        const cleanSpeciality = speciality.trim();
        query.speciality = { $regex: `^\\s*${cleanSpeciality}\\s*$`, $options: "i" };
      }
      return query;
    };

    assert.deepEqual(buildQuery("All Specialties"), {});
    assert.deepEqual(buildQuery("All"), {});
    assert.deepEqual(buildQuery(""), {});

    const cardiQ = buildQuery("  Cardiologist  ");
    const re = new RegExp(cardiQ.speciality.$regex, cardiQ.speciality.$options);
    assert.ok(re.test("Cardiologist"));
    assert.ok(re.test("cardiologist"));
    assert.ok(re.test("  CARDIOLOGIST  "));
    assert.ok(!re.test("Dermatologist"));
  });

  // ========================================================
  // 3. RATING RECALCULATION & PRECISION
  // ========================================================
  test("4. Doctor rating calculation with 0 reviews defaults to 0 and 0 count", () => {
    const calculateStats = (reviews) => {
      const numReviews = reviews.length;
      const avgRating =
        numReviews > 0
          ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews).toFixed(1))
          : 0;
      return { avgRating, numReviews };
    };

    const empty = calculateStats([]);
    assert.equal(empty.avgRating, 0);
    assert.equal(empty.numReviews, 0);
  });

  test("5. Doctor rating calculation rounds average accurately to 1 decimal place", () => {
    const calculateStats = (reviews) => {
      const numReviews = reviews.length;
      const avgRating =
        numReviews > 0
          ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews).toFixed(1))
          : 0;
      return { avgRating, numReviews };
    };

    // 5 + 4 + 4 = 13 / 3 = 4.33333333 -> 4.3
    const stats1 = calculateStats([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);
    assert.equal(stats1.avgRating, 4.3);
    assert.equal(stats1.numReviews, 3);

    // 5 + 5 + 4 = 14 / 3 = 4.66666666 -> 4.7
    const stats2 = calculateStats([{ rating: 5 }, { rating: 5 }, { rating: 4 }]);
    assert.equal(stats2.avgRating, 4.7);
    assert.equal(stats2.numReviews, 3);

    // 1 review of 5 = 5.0
    const stats3 = calculateStats([{ rating: 5 }]);
    assert.equal(stats3.avgRating, 5.0);
    assert.equal(stats3.numReviews, 1);
  });

  // ========================================================
  // 4. REVIEW BUSINESS LOGIC & ELIGIBILITY VERIFICATION
  // ========================================================
  test("6. Scenario 1, 2, 3, 4: Appointment status & ownership eligibility rule", () => {
    const checkEligibility = (appointment, requestingUserId) => {
      if (!appointment) return { eligible: false, code: 404, message: "Appointment record not found." };
      if (appointment.userId !== requestingUserId) {
        return { eligible: false, code: 403, message: "Forbidden: You can only review appointments you personally attended." };
      }
      if (appointment.status !== "completed") {
        return { eligible: false, code: 400, message: "You can only leave a review after your appointment has been completed by the doctor." };
      }
      return { eligible: true };
    };

    // Scenario 1: Patient without an appointment (null)
    assert.equal(checkEligibility(null, "patient_1").code, 404);

    // Scenario 2: Patient with pending appointment
    const pendingAppt = { userId: "patient_1", status: "pending" };
    assert.equal(checkEligibility(pendingAppt, "patient_1").code, 400);

    // Scenario 3: Patient with cancelled appointment
    const cancelledAppt = { userId: "patient_1", status: "cancelled" };
    assert.equal(checkEligibility(cancelledAppt, "patient_1").code, 400);

    // IDOR check: Patient attempting to review another patient's visit
    const otherAppt = { userId: "patient_2", status: "completed" };
    assert.equal(checkEligibility(otherAppt, "patient_1").code, 403);

    // Scenario 4: Patient with completed appointment
    const completedAppt = { userId: "patient_1", status: "completed" };
    assert.equal(checkEligibility(completedAppt, "patient_1").eligible, true);
  });

  test("7. Scenario 5: Duplicate review prevention (1 review per appointment)", () => {
    const existingReviews = [{ appointmentId: "appt_123", rating: 5 }];

    const canSubmitReview = (appointmentId) => {
      const found = existingReviews.find((r) => r.appointmentId === appointmentId);
      if (found) {
        return { allowed: false, message: "You have already submitted a review for this appointment." };
      }
      return { allowed: true };
    };

    assert.equal(canSubmitReview("appt_123").allowed, false);
    assert.equal(canSubmitReview("appt_999").allowed, true);
  });

  test("8. Scenario 6, 7, 8: Review edit and delete ownership authorization", () => {
    const review = { _id: "rev_1", userId: "patient_1", rating: 4, comment: "Good" };

    const authorizeAction = (requestUser) => {
      const isOwner = review.userId === requestUser.id;
      const isAdmin = requestUser.isAdmin === true;
      if (!isOwner && !isAdmin) {
        return { allowed: false, code: 403, message: "Forbidden" };
      }
      return { allowed: true };
    };

    // Scenario 6: Owner editing their own review
    assert.equal(authorizeAction({ id: "patient_1", isAdmin: false }).allowed, true);

    // Scenario 7: Patient attempting to edit another patient's review
    assert.equal(authorizeAction({ id: "patient_2", isAdmin: false }).code, 403);

    // Scenario 8: Admin can moderate/delete review
    assert.equal(authorizeAction({ id: "admin_user", isAdmin: true }).allowed, true);
  });

  test("9. Scenario 9, 10: Doctor rating recalculates after creation, edit, and deletion", () => {
    let reviews = [];

    const recalculate = () => {
      const count = reviews.length;
      const avg = count > 0 ? Number((reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1)) : 0;
      return { avgRating: avg, numReviews: count };
    };

    // Initial state
    assert.deepEqual(recalculate(), { avgRating: 0, numReviews: 0 });

    // Review 1 added: 5 stars
    reviews.push({ id: 1, rating: 5 });
    assert.deepEqual(recalculate(), { avgRating: 5.0, numReviews: 1 });

    // Review 2 added: 4 stars -> avg = 4.5
    reviews.push({ id: 2, rating: 4 });
    assert.deepEqual(recalculate(), { avgRating: 4.5, numReviews: 2 });

    // Review 2 edited from 4 to 3 stars -> (5 + 3)/2 = 4.0
    reviews[1].rating = 3;
    assert.deepEqual(recalculate(), { avgRating: 4.0, numReviews: 2 });

    // Review 1 deleted -> leaves only 3 stars -> avg = 3.0, count = 1
    reviews = reviews.filter((r) => r.id !== 1);
    assert.deepEqual(recalculate(), { avgRating: 3.0, numReviews: 1 });

    // Review 2 deleted -> resets cleanly to 0, 0
    reviews = [];
    assert.deepEqual(recalculate(), { avgRating: 0, numReviews: 0 });
  });

  test("10. Scenario 11, 12: Doctor Card and Admin Panel display format consistency", () => {
    const formatDoctorRating = (doc, context = "client") => {
      if (!doc.numReviews || doc.numReviews === 0) {
        return context === "admin" ? "No Reviews" : "New (0)";
      }
      return `${Number(doc.rating).toFixed(1)} (${doc.numReviews})`;
    };

    const newDoc = { rating: 0, numReviews: 0 };
    assert.equal(formatDoctorRating(newDoc, "client"), "New (0)");
    assert.equal(formatDoctorRating(newDoc, "admin"), "No Reviews");

    const reviewedDoc = { rating: 4.666, numReviews: 12 };
    assert.equal(formatDoctorRating(reviewedDoc, "client"), "4.7 (12)");
    assert.equal(formatDoctorRating(reviewedDoc, "admin"), "4.7 (12)");
  });

  test("11. Scenario 13: Numerical rating bounds validation (1 to 5)", () => {
    const validateRating = (rating) => {
      if (rating === undefined || rating === null) return "Required";
      const num = Number(rating);
      if (isNaN(num) || num < 1 || num > 5) return "Invalid";
      return "Valid";
    };

    assert.equal(validateRating(undefined), "Required");
    assert.equal(validateRating(null), "Required");
    assert.equal(validateRating(0), "Invalid");
    assert.equal(validateRating(-1), "Invalid");
    assert.equal(validateRating(6), "Invalid");
    assert.equal(validateRating("NaN"), "Invalid");
    assert.equal(validateRating(1), "Valid");
    assert.equal(validateRating(5), "Valid");
    assert.equal(validateRating("4.8"), "Valid");
  });

  test("12. Express 5 compatible in-place sanitization", () => {
    const queryData = {
      search: "cardio",
      $where: "malicious code",
      "nested.dot": "invalid",
      normal: 123,
    };

    const fakeReq = {};
    Object.defineProperty(fakeReq, "query", {
      get() {
        return queryData;
      },
      enumerable: true,
      configurable: false,
    });

    fakeReq.body = { valid: true, $regex: ".*" };
    fakeReq.params = { id: "123" };

    let nextCalled = false;
    sanitizeMiddleware(fakeReq, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(fakeReq.query.search, "cardio");
    assert.equal(fakeReq.query.normal, 123);
    assert.equal(fakeReq.query.$where, undefined);
    assert.equal(fakeReq.query["nested.dot"], undefined);
    assert.equal(fakeReq.body.valid, true);
    assert.equal(fakeReq.body.$regex, undefined);
  });
});
