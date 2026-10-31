import React, { useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { getUserDetails } from "../../redux/actions/userAction";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin } from "lucide-react";

const UserDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    if (id) {
      dispatch(getUserDetails(id));
    }
  }, [dispatch, id]);

  const { user, appointments, loading } = useSelector((state) => state.user);

  const getUserImage = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  return (
    <Layout>
      <div className="p-4">
        <Link to="/all-users" className="btn btn-outline-secondary btn-sm rounded-pill mb-3 d-inline-flex align-items-center gap-1">
          <ArrowLeft size={16} /> Back to Patients
        </Link>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <>
            {/* Patient Card */}
            <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-light">
              <div className="d-flex align-items-center gap-4 flex-wrap">
                {user?.image ? (
                  <img
                    src={getUserImage(user.image)}
                    alt={user.name || "user"}
                    className="rounded-circle shadow-sm"
                    style={{ width: "90px", height: "90px", objectFit: "cover" }}
                  />
                ) : null}
                <div>
                  <h3 className="fw-bold mb-1">{user?.name || "Patient Profile"}</h3>
                  <div className="d-flex flex-wrap gap-3 text-muted small mt-2">
                    <span className="d-flex align-items-center gap-1">
                      <Mail size={15} /> {user?.email}
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <Phone size={15} /> {user?.phone || "No phone provided"}
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <MapPin size={15} /> {user?.address || "No address on file"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments History */}
            <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Calendar size={22} className="text-primary" />
              Patient's Consultation History ({appointments?.length || 0})
            </h4>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Ref</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Doctor</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments && appointments.length > 0 ? (
                    appointments.map((a, i) => (
                      <tr key={a._id || i}>
                        <td className="font-monospace text-muted">{a._id?.slice(-6) || i + 1}</td>
                        <td className="fw-semibold">{a.slotDate}</td>
                        <td className="text-muted small">{a.slotTime}</td>
                        <td>{a.doctorId?.name || a.doctorId || "Specialist"}</td>
                        <td className="fw-bold">₹{a.amount}</td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              a.status === "completed"
                                ? "bg-success"
                                : a.status === "confirmed"
                                ? "bg-primary"
                                : a.status === "cancelled"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              a.paymentStatus === "paid" ? "bg-success-subtle text-success" : "bg-light text-muted border"
                            }`}
                          >
                            {a.paymentStatus || "pending"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No appointments found for this patient.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserDetails;
