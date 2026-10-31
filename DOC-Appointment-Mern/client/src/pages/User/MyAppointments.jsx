import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  Star,
  RefreshCw,
  Eye,
} from "lucide-react";
import API from "../../Api/API";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Cancellation modal state
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Review modal state
  const [reviewAppt, setReviewAppt] = useState(null);
  const [existingReviewId, setExistingReviewId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Payment loading state
  const [payingApptId, setPayingApptId] = useState(null);

  const { user } = useSelector((state) => state.auth);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await API.get("/appointment/get-user-appointments/my");
      if (res.data?.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setCancelLoading(true);
    try {
      const res = await API.post(`/appointment/cancel/${cancellingAppt._id}`, {
        reason: cancelReason || "Cancelled by patient",
      });
      if (res.data?.success) {
        toast.success("Appointment cancelled successfully.");
        setCancellingAppt(null);
        setCancelReason("");
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancelLoading(false);
    }
  };

  // Open Review Modal (supports both new review and editing existing review)
  const handleOpenReviewModal = (appt) => {
    setReviewAppt(appt);
    if (appt.review) {
      setExistingReviewId(appt.review._id);
      setReviewRating(appt.review.rating || 5);
      setReviewComment(appt.review.comment || "");
    } else {
      setExistingReviewId(null);
      setReviewRating(5);
      setReviewComment("");
    }
  };

  // Handle Review Submission / Update
  const handleSubmitReview = async () => {
    if (!reviewAppt) return;
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      return toast.error("Please provide a rating between 1 and 5 stars.");
    }
    setReviewLoading(true);
    try {
      if (existingReviewId) {
        const res = await API.put(`/review/update/${existingReviewId}`, {
          rating: reviewRating,
          comment: reviewComment ? reviewComment.trim() : "",
        });
        if (res.data?.success) {
          toast.success("Review updated successfully!");
          setReviewAppt(null);
          setExistingReviewId(null);
          setReviewComment("");
          fetchAppointments();
        }
      } else {
        const res = await API.post("/review/create", {
          appointmentId: reviewAppt._id,
          rating: reviewRating,
          comment: reviewComment ? reviewComment.trim() : "",
        });
        if (res.data?.success) {
          toast.success("Thank you for your review!");
          setReviewAppt(null);
          setExistingReviewId(null);
          setReviewComment("");
          fetchAppointments();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  // Handle Delete Review
  const handleDeleteReview = async () => {
    if (!existingReviewId) return;
    if (!window.confirm("Are you sure you want to delete your review for this appointment?")) return;
    setReviewLoading(true);
    try {
      const res = await API.delete(`/review/delete/${existingReviewId}`);
      if (res.data?.success) {
        toast.success("Review deleted successfully.");
        setReviewAppt(null);
        setExistingReviewId(null);
        setReviewComment("");
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    } finally {
      setReviewLoading(false);
    }
  };

  // Helper to load Razorpay Checkout SDK dynamically if not already available
  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        if (window.Razorpay) return resolve(true);
      } else {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }
    });
  };

  // Handle Online Payment (Razorpay Checkout)
  const handlePayOnline = async (appt) => {
    // 1. Business Rule Validation: Only confirmed and unpaid appointments can be paid
    if (appt.payment) {
      return toast("This appointment has already been paid for.", { icon: "ℹ️" });
    }
    if (appt.status !== "confirmed") {
      return toast.error("Only confirmed appointments can be paid for online.");
    }

    setPayingApptId(appt._id);
    try {
      // 2. Gateway Status Check
      const statusRes = await API.get("/payment/status");
      if (!statusRes.data?.configured) {
        return toast(
          "Online payment gateway is in test mode. You can settle consultation fees at the clinic reception.",
          { icon: "ℹ️", duration: 5000 }
        );
      }

      // 3. Ensure Razorpay Checkout SDK is ready
      if (!window.Razorpay) {
        const sdkLoaded = await loadRazorpaySDK();
        if (!sdkLoaded || !window.Razorpay) {
          return toast.error("Unable to load Razorpay Checkout SDK. Please check your connection or pay at clinic.");
        }
      }

      // 4. Create Payment Order on Backend
      const orderRes = await API.post("/payment/create-order", {
        appointmentId: appt._id,
      });

      if (!orderRes.data?.success) {
        return toast.error(orderRes.data?.message || "Could not create payment order.");
      }

      const { orderId, amount, currency, keyId } = orderRes.data;

      // 5. Initialize Razorpay Checkout Options
      const options = {
        key: keyId,
        amount,
        currency: currency || "INR",
        name: "MediCare Health Clinic",
        description: `Consultation Fee with Dr. ${appt.doctorId?.name || "Doctor"}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // 6. Verify Payment Signature on Backend Only
            const verifyRes = await API.post("/payment/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              toast.success("Payment verified successfully! Consultation fee settled.");
              fetchAppointments();
            } else {
              toast.error(verifyRes.data?.message || "Payment verification failed.");
            }
          } catch (vErr) {
            console.error("Payment verification error:", vErr);
            toast.error(
              vErr.response?.data?.message || "Payment verification failed. Please contact clinic reception."
            );
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#0284c7",
        },
        modal: {
          ondismiss: function () {
            toast("Payment checkout was cancelled.", { icon: "ℹ️" });
          },
          escape: true,
          backdropclose: false,
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle Checkout Failure Event
      rzp.on("payment.failed", async function (response) {
        console.error("Razorpay payment failed:", response.error);
        toast.error(response.error?.description || "Payment failed. Please try again or pay at reception.");
        try {
          await API.post("/payment/record-failure", {
            razorpayOrderId: orderId,
            error: response.error,
          });
        } catch {
          // Failure reporting is non-blocking
        }
      });

      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err.response?.data?.message || err.message || "Payment initiation error");
    } finally {
      setPayingApptId(null);
    }
  };

  // Filter tabs
  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return a.status === "pending";
    if (activeTab === "confirmed") return a.status === "confirmed";
    if (activeTab === "completed") return a.status === "completed";
    if (activeTab === "cancelled") return a.status === "cancelled" || a.status === "cancel";
    if (activeTab === "rejected") return a.status === "rejected";
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="badge bg-primary px-3 py-2 rounded-pill">Confirmed</span>;
      case "completed":
        return <span className="badge bg-success px-3 py-2 rounded-pill">Completed</span>;
      case "cancelled":
      case "cancel":
        return <span className="badge bg-danger px-3 py-2 rounded-pill">Cancelled</span>;
      case "rejected":
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill fw-semibold">
            Rejected — Slot no longer available
          </span>
        );
      default:
        return (
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-semibold">
            Pending — Awaiting Confirmation
          </span>
        );
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: "1000px" }}>
      {/* Title & Stats */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">My Medical Visits</h2>
          <p className="text-muted small mb-0">Track upcoming consultations, payment status, and review history.</p>
        </div>
        <button onClick={fetchAppointments} className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-1">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-1">
        {["all", "pending", "confirmed", "completed", "cancelled", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn btn-sm rounded-pill px-3 py-1 text-capitalize ${
              activeTab === tab ? "btn-primary" : "btn-light bg-white text-dark border"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">Loading your medical appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="card shadow-sm border-0 rounded-4 text-center p-5">
          <Calendar size={48} className="text-muted mx-auto mb-3" />
          <h5 className="fw-bold text-dark">No appointments found in this category.</h5>
          <p className="text-muted small">You can schedule a consultation with any of our verified medical doctors.</p>
          <Link to="/doctors" className="btn btn-primary rounded-pill btn-sm mx-auto px-4 mt-2">
            Browse Doctors
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredAppointments.map((appt) => (
            <div key={appt._id} className="card shadow-sm border-0 rounded-4 p-4 transition-all">
              <div className="row g-3 align-items-center">
                {/* Doctor Avatar / Info */}
                <div className="col-md-5 d-flex align-items-center gap-3">
                  {appt.doctorId?.image ? (
                    <img
                      src={
                        appt.doctorId.image.startsWith("http") || appt.doctorId.image.startsWith("data:")
                          ? appt.doctorId.image
                          : `data:image/jpeg;base64,${appt.doctorId.image}`
                      }
                      alt={appt.doctorId?.name || "Doctor"}
                      className="rounded-circle"
                      style={{ width: "65px", height: "65px", objectFit: "cover" }}
                    />
                  ) : null}
                  <div>
                    <h5 className="fw-bold mb-1">{appt.doctorId?.name || "Doctor"}</h5>
                    <span className="badge bg-primary-subtle text-primary rounded-pill small">
                      {appt.doctorId?.speciality || "Specialist"}
                    </span>
                    <small className="text-muted d-block mt-1">
                      Ref: <span className="font-monospace">{appt._id.slice(-6)}</span>
                    </small>
                  </div>
                </div>

                {/* Date & Time Slot */}
                <div className="col-md-3">
                  <div className="d-flex align-items-center gap-2 text-dark fw-semibold mb-1">
                    <Calendar size={16} className="text-primary" />
                    <span>{appt.slotDate}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <Clock size={16} className="text-primary" />
                    <span>{appt.slotTime}</span>
                  </div>
                  <div className="mt-2">
                    <span className="fw-bold text-primary">₹{appt.amount}</span>{" "}
                    {appt.payment ? (
                      <span className="badge bg-success-subtle text-success ms-1">Paid</span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning ms-1">Unpaid</span>
                    )}
                  </div>
                </div>

                {/* Status & Action Buttons */}
                <div className="col-md-4 text-md-end">
                  <div className="mb-2">
                    {getStatusBadge(appt.status)}
                    {appt.cancellationReason && (
                      <div className="text-muted small mt-1" style={{ fontSize: "12px" }}>
                        {appt.cancellationReason}
                      </div>
                    )}
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                    <Link
                      to={`/user/appointments/${appt._id}`}
                      className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1"
                    >
                      <Eye size={14} /> Details
                    </Link>

                    {/* Pay Online Button: Strictly allowed only for CONFIRMED, UNPAID appointments */}
                    {!appt.payment && appt.status === "confirmed" && (
                      <button
                        onClick={() => handlePayOnline(appt)}
                        disabled={payingApptId === appt._id}
                        className="btn btn-success btn-sm rounded-pill d-inline-flex align-items-center gap-1 shadow-sm"
                      >
                        {payingApptId === appt._id ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard size={14} /> Pay ₹{appt.amount}
                          </>
                        )}
                      </button>
                    )}

                    {/* Review action for completed visits only */}
                    {appt.status === "completed" && (
                      appt.hasReviewed ? (
                        <button
                          onClick={() => handleOpenReviewModal(appt)}
                          className="btn btn-outline-warning btn-sm rounded-pill text-dark fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                        >
                          <Star size={14} className="fill-warning text-warning" /> Edit Review (★ {appt.review?.rating})
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenReviewModal(appt)}
                          className="btn btn-warning btn-sm rounded-pill text-dark fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                        >
                          <Star size={14} /> Rate Doctor
                        </button>
                      )
                    )}

                    {/* Cancel button if pending or confirmed */}
                    {(appt.status === "pending" || appt.status === "confirmed") && (
                      <button
                        onClick={() => setCancellingAppt(appt)}
                        className="btn btn-outline-danger btn-sm rounded-pill"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingAppt && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <AlertTriangle size={20} /> Cancel Appointment
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setCancellingAppt(null)}
                />
              </div>
              <div className="modal-body py-3">
                <p className="text-muted small">
                  Are you sure you want to cancel your appointment with{" "}
                  <strong>{cancellingAppt.doctorId?.name}</strong> on{" "}
                  <strong>{cancellingAppt.slotDate}</strong> at{" "}
                  <strong>{cancellingAppt.slotTime}</strong>?
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reason for cancellation (optional):</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="E.g., Rescheduling, recovered, emergency conflict..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3"
                  onClick={() => setCancellingAppt(null)}
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  disabled={cancelLoading}
                  className="btn btn-danger rounded-pill px-4 fw-semibold"
                  onClick={handleConfirmCancel}
                >
                  {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewAppt && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <Star size={20} className="text-warning fill-warning" />
                  {existingReviewId ? "Edit Your Review" : "Rate Doctor & Leave Review"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setReviewAppt(null);
                    setExistingReviewId(null);
                  }}
                />
              </div>
              <div className="modal-body py-3">
                <div className="bg-light p-3 rounded-3 mb-3">
                  <div className="fw-bold text-dark">Dr. {reviewAppt.doctorId?.name}</div>
                  <div className="text-muted small">
                    {reviewAppt.doctorId?.speciality} • Visit Date: {reviewAppt.slotDate} ({reviewAppt.slotTime})
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold d-block">
                    Your Rating ({reviewRating} / 5 Stars):
                  </label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="btn btn-link p-0 text-warning"
                        title={`${star} Star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={28}
                          className={star <= reviewRating ? "text-warning fill-warning" : "text-muted"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Your Review & Comments (Optional):</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Describe the diagnosis, doctor's communication, and treatment effectiveness..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                <div>
                  {existingReviewId && (
                    <button
                      type="button"
                      disabled={reviewLoading}
                      className="btn btn-outline-danger rounded-pill px-3 fw-semibold"
                      onClick={handleDeleteReview}
                    >
                      Delete Review
                    </button>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-3"
                    onClick={() => {
                      setReviewAppt(null);
                      setExistingReviewId(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={reviewLoading}
                    className="btn btn-primary rounded-pill px-4 fw-semibold"
                    onClick={handleSubmitReview}
                  >
                    {reviewLoading
                      ? "Saving..."
                      : existingReviewId
                      ? "Update Review"
                      : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
