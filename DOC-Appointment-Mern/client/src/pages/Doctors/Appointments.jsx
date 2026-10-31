import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  Star,
  Award,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  User,
} from "lucide-react";
import API from "../../Api/API";

/**
 * Canonical YYYY-MM-DD local calendar date formatter.
 * Extracts local year, month, and day components directly from the Date object,
 * completely avoiding UTC timezone shift bugs introduced by toISOString().
 */
export const formatLocalDateToYYYYMMDD = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Appointments = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingDoc, setLoadingDoc] = useState(true);

  // Scheduling state: Canonical local calendar date YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    return formatLocalDateToYYYYMMDD(new Date());
  });
  const [slotsData, setSlotsData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patientNotes, setPatientNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const { user } = useSelector((state) => state.auth);

  // 1. Fetch Doctor details and reviews
  useEffect(() => {
    const fetchDoc = async () => {
      setLoadingDoc(true);
      try {
        const res = await API.get(`/doctor/get-details/${id}`);
        if (res.data?.success) {
          setDoctor(res.data.doctor);
          setReviews(res.data.reviews || []);
        }
      } catch (err) {
        toast.error("Failed to load doctor profile");
      } finally {
        setLoadingDoc(false);
      }
    };
    fetchDoc();
  }, [id]);

  // 2. Fetch Live Available Slots whenever doctor or selectedDate changes
  useEffect(() => {
    if (!id || !selectedDate) return;

    let isSubscribed = true;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setSlotsData(null); // Clear previous slots while loading new date's data
      try {
        const res = await API.get(`/doctor/${id}/slots?date=${selectedDate}`);
        if (isSubscribed) {
          if (res.data?.success && (!res.data.date || res.data.date === selectedDate)) {
            setSlotsData(res.data);
          } else {
            setSlotsData(null);
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setSlotsData({ available: false, reason: "Schedule unavailable for this date", slots: [] });
        }
      } finally {
        if (isSubscribed) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isSubscribed = false;
    };
  }, [id, selectedDate]);

  // Helper: Next 14 dates generator using local calendar date calculation
  const getNext14Days = () => {
    const days = [];
    const baseDate = new Date();
    // Normalize to midday (12:00:00) to safely prevent midnight boundary crossing or DST drift
    baseDate.setHours(12, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = formatLocalDateToYYYYMMDD(d);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({
        dateStr,
        iso: dateStr, // keep for backward compatibility
        dayName,
        monthDay,
        isToday: i === 0,
      });
    }
    return days;
  };

  const availableDays = getNext14Days();

  // 3. Handle Concurrency-Safe Booking
  const handleBooking = async () => {
    if (!user || !user._id) {
      toast.error("Please login to complete your appointment booking.");
      return navigate("/login");
    }

    if (!selectedSlot) {
      return toast.error("Please select an available time slot.");
    }

    setBookingLoading(true);
    try {
      const res = await API.post("/appointment/create", {
        doctorId: id,
        slotDate: selectedDate,
        slotTime: selectedSlot.time,
        patientNotes,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Appointment request submitted! Awaiting clinic confirmation.");
        navigate("/user/appointments");
      }
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error(err.response?.data?.message || "Too many booking requests. Please wait a moment before trying again.");
      } else {
        const message =
          err.response?.data?.message ||
          "Could not book slot. It may have just been reserved by another patient.";
        toast.error(message);
      }
      // Refresh slots immediately on conflict
      const refreshRes = await API.get(`/doctor/${id}/slots?date=${selectedDate}`);
      if (refreshRes.data?.success) {
        setSlotsData(refreshRes.data);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const getDoctorImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  if (loadingDoc) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2">Loading doctor profile and availability...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container py-5 text-center">
        <h4>Doctor not found</h4>
        <button onClick={() => navigate("/doctors")} className="btn btn-primary mt-2">
          Back to Doctors
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: "1050px" }}>
      {/* Back button */}
      <button
        onClick={() => navigate("/doctors")}
        className="btn btn-outline-secondary btn-sm rounded-pill mb-3 d-inline-flex align-items-center gap-1"
      >
        <ArrowLeft size={16} /> Back to Doctor Directory
      </button>

      <div className="row g-4">
        {/* Left Column: Doctor Profile Card */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden sticky-top" style={{ top: "20px" }}>
            {doctor.image ? (
              <img
                src={getDoctorImageUrl(doctor.image)}
                alt={doctor.name}
                className="w-100"
                style={{ height: "260px", objectFit: "cover" }}
              />
            ) : null}
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-semibold">
                  {doctor.speciality}
                </span>
                {doctor.numReviews > 0 || reviews.length > 0 ? (
                  <span className="d-flex align-items-center gap-1 text-warning fw-bold">
                    <Star size={16} className="text-warning fill-warning" />
                    {Number(doctor.rating || (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)).toFixed(1)} ({doctor.numReviews || reviews.length} reviews)
                  </span>
                ) : (
                  <span className="badge bg-light text-muted border small fw-normal">
                    New (0 reviews)
                  </span>
                )}
              </div>

              <h4 className="fw-bold mb-1">{doctor.name}</h4>
              <p className="text-muted small mb-3">{doctor.degree}</p>

              <div className="p-3 bg-light rounded-3 mb-3">
                <div className="row g-2 text-center">
                  <div className="col-6 border-end">
                    <small className="text-muted d-block">Experience</small>
                    <span className="fw-bold">{doctor.experience} Years</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Consultation Fee</small>
                    <span className="fw-bold text-primary fs-5">₹{doctor.fees}</span>
                  </div>
                </div>
              </div>

              <h6 className="fw-bold mb-2">About the Doctor</h6>
              <p className="text-muted small mb-4">{doctor.about}</p>

              <div className="border-top pt-3 text-muted small">
                <p className="mb-1">
                  <strong>Consultation Days:</strong>{" "}
                  {(doctor.workingDays || ["Mon - Sat"]).join(", ")}
                </p>
                <p className="mb-0">
                  <strong>Hours:</strong> {doctor.workingHours?.start || "09:00"} -{" "}
                  {doctor.workingHours?.end || "17:00"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Slot Booking & Reviews */}
        <div className="col-lg-7">
          {/* Booking Card */}
          <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
            <h5 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
              <Calendar size={20} className="text-primary" />
              Select Appointment Date
            </h5>

            {/* Date Pills Slider */}
            <div className="d-flex gap-2 overflow-auto pb-2 mb-4" style={{ whiteSpace: "nowrap" }}>
              {availableDays.map((day) => {
                const isSelected = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`btn rounded-3 px-3 py-2 text-center border ${
                      isSelected
                        ? "btn-primary text-white border-primary shadow-sm"
                        : "btn-light bg-white text-dark"
                    }`}
                    style={{ minWidth: "85px" }}
                  >
                    <small className="d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                      {day.dayName}
                    </small>
                    <span className="fw-bold">{day.monthDay}</span>
                    {day.isToday && (
                      <span className="d-block badge bg-success-subtle text-success" style={{ fontSize: "9px" }}>
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Slots Section */}
            <h5 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
              <Clock size={20} className="text-primary" />
              Available Time Slots ({selectedDate})
            </h5>

            {loadingSlots ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
                <p className="text-muted small mt-2">Checking real-time doctor availability...</p>
              </div>
            ) : !slotsData || !slotsData.available || slotsData.slots?.length === 0 ? (
              <div className="alert alert-warning d-flex align-items-center gap-2 rounded-3">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>
                  {slotsData?.reason ||
                    "Doctor does not have open consultation slots on this date. Please choose another date above."}
                </span>
              </div>
            ) : (
              <div>
                <p className="text-muted small mb-2">
                  Showing <strong>{slotsData.availableSlotsCount}</strong> open slots out of{" "}
                  {slotsData.totalSlots} total intervals:
                </p>

                <div className="d-flex flex-wrap gap-2 mb-4">
                  {slotsData.slots.map((slot, idx) => (
                    <button
                      key={idx}
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`btn btn-sm rounded-pill px-3 py-2 transition-all ${
                        selectedSlot?.time === slot.time
                          ? "btn-primary text-white shadow-sm"
                          : slot.isAvailable
                          ? "btn-outline-primary bg-white text-primary"
                          : "btn-light text-muted border-0 text-decoration-line-through opacity-50"
                      }`}
                      style={{ minWidth: "95px" }}
                    >
                      {slot.time}
                      {!slot.isAvailable && (
                        <span className="d-block text-danger" style={{ fontSize: "9px" }}>
                          Reserved
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Patient Notes input */}
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-muted">
                    Notes for Doctor (Optional symptoms, reason for consultation):
                  </label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="E.g., Routine cardiac checkup, experiencing mild chest flutter..."
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                  />
                </div>

                {/* Booking Summary Box */}
                <div className="card bg-light border-0 rounded-3 p-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small">Selected Slot:</span>
                    <strong className="text-dark">
                      {selectedSlot ? `${selectedDate} at ${selectedSlot.time}` : "None selected"}
                    </strong>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted small">Consultation Fee (Authoritative):</span>
                    <strong className="text-primary fs-5">₹{doctor.fees}</strong>
                  </div>
                </div>

                {/* Confirm Booking Button */}
                <button
                  disabled={!selectedSlot || bookingLoading}
                  onClick={handleBooking}
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                >
                  {bookingLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      <span>Reserving Slot Atomically...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Confirm & Book Appointment (₹{doctor.fees})</span>
                    </>
                  )}
                </button>

                <p className="text-muted text-center mt-2 small" style={{ fontSize: "11px" }}>
                  <ShieldCheck size={14} className="text-success me-1" />
                  Instant confirmation. Protected against double booking. Free cancellation up to 2 hours before slot.
                </p>
              </div>
            )}
          </div>

          {/* Verified Patient Reviews Section */}
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Star size={20} className="text-warning fill-warning" />
                Verified Patient Reviews ({reviews.length})
              </h5>
              {reviews.length > 0 && (
                <span className="badge bg-warning-subtle text-dark px-3 py-2 rounded-pill fw-semibold">
                  ★ {Number(doctor.rating || (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)).toFixed(1)} Average Rating
                </span>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="p-4 bg-light rounded-3 text-center">
                <Star size={28} className="text-muted mb-2 opacity-50" />
                <p className="text-muted small mb-0">
                  No patient reviews yet. Patients who complete an appointment with Dr. {doctor.name} can leave verified ratings and feedback.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-3 bg-light rounded-3 shadow-xs">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        {rev.userId?.image ? (
                          <img
                            src={rev.userId.image.startsWith("http") || rev.userId.image.startsWith("data:") ? rev.userId.image : `data:image/jpeg;base64,${rev.userId.image}`}
                            alt={rev.userId?.name || "Patient"}
                            className="rounded-circle shadow-xs"
                            style={{ width: "32px", height: "32px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", fontSize: "13px" }}
                          >
                            <User size={16} />
                          </div>
                        )}
                        <div>
                          <span className="fw-semibold small d-block">{rev.userId?.name || "Verified Patient"}</span>
                          <span className="text-muted" style={{ fontSize: "11px" }}>
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Verified Consultation"}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-1 bg-white px-2 py-1 rounded-pill border">
                        <span className="fw-bold small text-dark">{rev.rating}</span>
                        <div className="text-warning d-flex align-items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < rev.rating ? "text-warning fill-warning" : "text-muted"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {rev.comment ? (
                      <p className="text-dark small mb-0 ps-1">{rev.comment}</p>
                    ) : (
                      <p className="text-muted small fst-italic mb-0 ps-1" style={{ fontSize: "12px" }}>
                        (Rating given without written comments)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
