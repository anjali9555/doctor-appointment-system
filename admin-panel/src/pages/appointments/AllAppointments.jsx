import React, { useEffect, useState, useMemo } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllAppointments, updateAppointmentStatus } from "../../redux/actions/appointmentAction";
import { Calendar, Search, Filter, RefreshCw, Eye, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

const AllAppointments = () => {
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    dispatch(getAllAppointments());
  }, [dispatch]);

  const { appointments, loading } = useSelector((state) => state.appointments);

  // Compute map of competing pending requests for the same doctor, date, and time
  const competingSlotMap = useMemo(() => {
    const map = new Map();
    (appointments || []).forEach((a) => {
      if (a.status === "pending" && a.doctorId && a.slotDate && a.slotTime) {
        const docId = a.doctorId._id || a.doctorId;
        const key = `${docId}_${a.slotDate}_${a.slotTime.trim()}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [appointments]);

  const handleConfirm = async (id) => {
    setActionLoadingId(id);
    try {
      await dispatch(updateAppointmentStatus({ id, bookingStatus: "confirmed" })).unwrap();
      toast.success("Appointment confirmed and slot successfully reserved!");
      dispatch(getAllAppointments());
    } catch (err) {
      toast.error(
        err || "This time slot has already been booked by another patient. Please select another appointment request."
      );
      dispatch(getAllAppointments());
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      await dispatch(updateAppointmentStatus({ id, bookingStatus: "rejected" })).unwrap();
      toast.success("Appointment request rejected.");
      dispatch(getAllAppointments());
    } catch (err) {
      toast.error(err || "Failed to reject appointment.");
      dispatch(getAllAppointments());
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAppointments = (appointments || []).filter((a) => {
    const matchesStatus =
      statusFilter === "all" ||
      a.status === statusFilter ||
      (statusFilter === "cancelled" && (a.status === "cancelled" || a.status === "cancel"));

    const patientName = a.userId?.name || "";
    const docName = a.doctorId?.name || "";
    const refId = a._id || "";

    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">Appointment Management</h2>
            <p className="text-muted small mb-0">Track, review, and manage all patient consultations.</p>
          </div>
          <button
            onClick={() => dispatch(getAllAppointments())}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0 bg-light"
                  placeholder="Search by patient name, doctor, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-7 d-flex justify-content-md-end gap-2 overflow-auto">
              {["all", "pending", "confirmed", "completed", "cancelled", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`btn btn-sm rounded-pill px-3 text-capitalize ${
                    statusFilter === status
                      ? "btn-primary text-white"
                      : "btn-light bg-light text-dark border"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ref ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Fee</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status" />
                    </td>
                  </tr>
                ) : filteredAppointments.length > 0 ? (
                  filteredAppointments.map((a) => {
                    const docId = a.doctorId?._id || a.doctorId;
                    const slotKey = `${docId}_${a.slotDate}_${(a.slotTime || "").trim()}`;
                    const hasCompetingRequests = a.status === "pending" && (competingSlotMap.get(slotKey) || 0) > 1;

                    return (
                      <tr key={a._id}>
                        <td className="font-monospace text-muted small">{a._id.slice(-6)}</td>
                        <td>
                          <strong className="d-block text-dark small">
                            {a.userId?.name || "Patient"}
                          </strong>
                          <span className="text-muted" style={{ fontSize: "11px" }}>
                            {a.userId?.phone || a.userId?.email || ""}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold small text-dark d-block">
                            {a.doctorId?.name || "Specialist"}
                          </span>
                          <span className="badge bg-light text-secondary border small">
                            {a.doctorId?.speciality || ""}
                          </span>
                        </td>
                        <td>
                          <div className="small fw-semibold">{a.slotDate}</div>
                          <div className="text-muted small">{a.slotTime}</div>
                          {hasCompetingRequests && (
                            <span
                              className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill mt-1"
                              style={{ fontSize: "10px" }}
                              title="Multiple patients have pending requests for this exact slot"
                            >
                              <AlertTriangle size={11} className="me-1 inline" />
                              {competingSlotMap.get(slotKey)} Competing Requests
                            </span>
                          )}
                        </td>
                        <td className="fw-bold text-dark">₹{a.amount}</td>
                        <td>
                          {a.payment ? (
                            <span className="badge bg-success-subtle text-success">Paid</span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning">Pending</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              a.status === "completed"
                                ? "bg-success"
                                : a.status === "confirmed"
                                ? "bg-primary"
                                : a.status === "rejected"
                                ? "bg-danger-subtle text-danger border border-danger-subtle"
                                : a.status === "cancelled" || a.status === "cancel"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {a.status === "rejected" ? "Rejected" : a.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1 align-items-center">
                            {a.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleConfirm(a._id)}
                                  disabled={actionLoadingId === a._id}
                                  className="btn btn-sm btn-success rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1"
                                  title="Confirm Appointment & Reserve Slot"
                                >
                                  <Check size={14} /> Confirm
                                </button>
                                <button
                                  onClick={() => handleReject(a._id)}
                                  disabled={actionLoadingId === a._id}
                                  className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1"
                                  title="Reject Appointment Request"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            <Link
                              to={`/appointment-details/${a._id}`}
                              className="btn btn-sm btn-outline-primary rounded-pill d-inline-flex align-items-center gap-1"
                            >
                              <Eye size={14} /> Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-5">
                      No appointments matching the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AllAppointments;
