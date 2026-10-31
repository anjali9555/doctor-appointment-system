import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CreditCard, ShieldCheck, User, Phone, Mail, Award } from "lucide-react";
import API from "../../Api/API";
import toast from "react-hot-toast";

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/appointment/get-user-appointment-details/${id}`);
        if (res.data?.success) {
          setDetails(res.data.appointmentDetails);
        }
      } catch (error) {
        toast.error("Failed to fetch appointment details");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [id]);

  return (
    <div className="container py-5" style={{ maxWidth: "750px" }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline-secondary btn-sm rounded-pill mb-3 d-inline-flex align-items-center gap-1"
      >
        <ArrowLeft size={16} /> Back to Appointments
      </button>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        {/* Header */}
        <div className="card-header bg-primary text-white p-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <span className="badge bg-white text-primary rounded-pill px-3 py-1 mb-2 fw-semibold">
              Appointment Slip
            </span>
            <h4 className="m-0 fw-bold">Consultation Details</h4>
          </div>
          <div className="text-end">
            <small className="opacity-75 d-block">Booking Reference</small>
            <span className="font-monospace fw-bold">{id.slice(-8).toUpperCase()}</span>
          </div>
        </div>

        {/* Details Body */}
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2">Loading appointment record...</p>
            </div>
          ) : details ? (
            <>
              {/* Doctor Details Section */}
              <div className="p-3 bg-light rounded-3 mb-4">
                <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <Award size={18} className="text-primary" />
                  Assigned Medical Specialist
                </h6>
                <div className="row g-2">
                  <div className="col-sm-6">
                    <small className="text-muted d-block">Doctor Name</small>
                    <strong className="text-dark fs-6">{details.doctorName}</strong>
                  </div>
                  <div className="col-sm-6">
                    <small className="text-muted d-block">Specialty</small>
                    <span className="badge bg-info-subtle text-info-emphasis rounded-pill">
                      {details.doctorSpeciality || "Specialist"}
                    </span>
                  </div>
                  <div className="col-sm-6 mt-2">
                    <small className="text-muted d-block">Doctor Phone</small>
                    <span className="text-dark d-flex align-items-center gap-1 small">
                      <Phone size={13} className="text-muted" /> {details.doctorPhone || "Clinic Desk"}
                    </span>
                  </div>
                  <div className="col-sm-6 mt-2">
                    <small className="text-muted d-block">Doctor Email</small>
                    <span className="text-dark d-flex align-items-center gap-1 small">
                      <Mail size={13} className="text-muted" /> {details.doctorEmail || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule and Fee */}
              <div className="row g-3 mb-4">
                <div className="col-sm-4">
                  <div className="p-3 border rounded-3 text-center">
                    <Calendar size={20} className="text-primary mx-auto mb-1" />
                    <small className="text-muted d-block">Date</small>
                    <strong className="text-dark">{details.bookingDate}</strong>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="p-3 border rounded-3 text-center">
                    <Clock size={20} className="text-primary mx-auto mb-1" />
                    <small className="text-muted d-block">Time Slot</small>
                    <strong className="text-dark">{details.bookingTime}</strong>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="p-3 border rounded-3 text-center">
                    <CreditCard size={20} className="text-primary mx-auto mb-1" />
                    <small className="text-muted d-block">Consultation Fee</small>
                    <strong className="text-primary fs-5">₹{details.amount}</strong>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
                <div>
                  <small className="text-muted d-block mb-1">Current Booking Status</small>
                  <span
                    className={`badge px-3 py-2 rounded-pill fw-semibold ${
                      details.bookingStatus === "confirmed"
                        ? "bg-primary"
                        : details.bookingStatus === "completed"
                        ? "bg-success"
                        : details.bookingStatus === "rejected"
                        ? "bg-danger-subtle text-danger border border-danger-subtle"
                        : details.bookingStatus === "cancelled" || details.bookingStatus === "cancel"
                        ? "bg-danger"
                        : "bg-warning text-dark"
                    }`}
                  >
                    {details.bookingStatus === "pending"
                      ? "Pending — Awaiting Confirmation"
                      : details.bookingStatus === "confirmed"
                      ? "Confirmed"
                      : details.bookingStatus === "rejected"
                      ? "Rejected — Slot no longer available"
                      : details.bookingStatus?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <small className="text-muted d-block">Payment Status</small>
                  <span
                    className={`badge px-3 py-2 rounded-pill ${
                      details.paymentMode ? "bg-success" : "bg-warning text-dark"
                    }`}
                  >
                    {details.paymentMode ? "Paid Online" : "Payment Pending"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top text-center text-muted small">
                <ShieldCheck size={16} className="text-success me-1" />
                This is a verified appointment record from the MediCare Health Platform.
              </div>
            </>
          ) : (
            <div className="text-center py-4">No appointment record found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
