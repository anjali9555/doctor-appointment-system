import React, { useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getUserData } from "../redux/actions/authActions";
import { getStats } from "../redux/actions/userAction";
import {
  Users,
  UserCheck,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  IndianRupee,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  MessageSquare,
} from "lucide-react";

const Home = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUserData());
    dispatch(getStats());
  }, [dispatch]);

  const { user } = useSelector((state) => state.auth);
  const { stats, loading } = useSelector((state) => state.user);

  const totalAppts = stats?.totalAppointments || 1;
  const pendingPct = Math.round(((stats?.pendingAppointments || 0) / totalAppts) * 100);
  const confirmedPct = Math.round(((stats?.confirmedAppointments || 0) / totalAppts) * 100);
  const completedPct = Math.round(((stats?.completedAppointments || 0) / totalAppts) * 100);
  const cancelledPct = Math.round(((stats?.cancelledAppointments || 0) / totalAppts) * 100);

  return (
    <Layout>
      <div className="p-4">
        {/* Welcome Banner */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">Executive Clinical Dashboard</h2>
            <p className="text-muted small mb-0">
              Welcome back, <strong>{user?.name || "Administrator"}</strong> ({user?.email}) &bull; MediCare Management Control
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/add-doctor" className="btn btn-primary btn-sm rounded-pill d-flex align-items-center gap-1 px-3">
              <PlusCircle size={15} /> Add New Doctor
            </Link>
            <Link to="/all-appointments" className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-1 px-3">
              <Calendar size={15} /> Manage Bookings
            </Link>
          </div>
        </div>

        {/* 8 Metric KPI Cards Grid */}
        <div className="row g-3 mb-4">
          {/* Total Patients */}
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Total Patients</span>
                <div className="p-2 bg-primary-subtle text-primary rounded-3">
                  <Users size={20} />
                </div>
              </div>
              <h3 className="fw-bold mb-0">{stats?.totalUsers || 0}</h3>
              <small className="text-success d-flex align-items-center gap-1 mt-1">
                <TrendingUp size={13} /> Active Patients
              </small>
            </div>
          </div>

          {/* Total Doctors */}
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Certified Specialists</span>
                <div className="p-2 bg-success-subtle text-success rounded-3">
                  <UserCheck size={20} />
                </div>
              </div>
              <h3 className="fw-bold mb-0">{stats?.totalDoctors || 0}</h3>
              <small className="text-muted d-block mt-1">Active Clinic Staff</small>
            </div>
          </div>

          {/* Total Appointments */}
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Total Bookings</span>
                <div className="p-2 bg-info-subtle text-info rounded-3">
                  <Calendar size={20} />
                </div>
              </div>
              <h3 className="fw-bold mb-0">{stats?.totalAppointments || 0}</h3>
              <small className="text-muted d-block mt-1">All Scheduled Visits</small>
            </div>
          </div>

          {/* Actual Paid Revenue */}
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Actual Paid Revenue</span>
                <div className="p-2 bg-warning-subtle text-warning rounded-3">
                  <IndianRupee size={20} />
                </div>
              </div>
              <h3 className="fw-bold text-success mb-0">₹{stats?.actualRevenue || stats?.earnings || 0}</h3>
              <small className="text-success d-flex align-items-center gap-1 mt-1">
                Verified Transactions
              </small>
            </div>
          </div>

          {/* Confirmed Appointments */}
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small fw-semibold">Confirmed</span>
                <span className="badge bg-primary-subtle text-primary">{confirmedPct}%</span>
              </div>
              <h4 className="fw-bold text-primary mb-0">{stats?.confirmedAppointments || 0}</h4>
            </div>
          </div>

          {/* Pending Appointments */}
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small fw-semibold">Pending Review</span>
                <span className="badge bg-warning-subtle text-warning">{pendingPct}%</span>
              </div>
              <h4 className="fw-bold text-warning mb-0">{stats?.pendingAppointments || 0}</h4>
            </div>
          </div>

          {/* Completed Visits */}
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small fw-semibold">Completed Visits</span>
                <span className="badge bg-success-subtle text-success">{completedPct}%</span>
              </div>
              <h4 className="fw-bold text-success mb-0">{stats?.completedAppointments || 0}</h4>
            </div>
          </div>

          {/* Cancelled Bookings */}
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small fw-semibold">Cancelled</span>
                <span className="badge bg-danger-subtle text-danger">{cancelledPct}%</span>
              </div>
              <h4 className="fw-bold text-danger mb-0">{stats?.cancelledAppointments || 0}</h4>
            </div>
          </div>
        </div>

        {/* Appointment Status Distribution Progress Bar */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <Activity size={20} className="text-primary" />
            Appointment Status Distribution
          </h5>
          <div className="progress" style={{ height: "18px", borderRadius: "10px", overflow: "hidden" }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${completedPct}%` }}
              title={`Completed: ${stats?.completedAppointments || 0}`}
            />
            <div
              className="progress-bar bg-primary"
              style={{ width: `${confirmedPct}%` }}
              title={`Confirmed: ${stats?.confirmedAppointments || 0}`}
            />
            <div
              className="progress-bar bg-warning text-dark"
              style={{ width: `${pendingPct}%` }}
              title={`Pending: ${stats?.pendingAppointments || 0}`}
            />
            <div
              className="progress-bar bg-danger"
              style={{ width: `${cancelledPct}%` }}
              title={`Cancelled: ${stats?.cancelledAppointments || 0}`}
            />
          </div>
          <div className="d-flex flex-wrap gap-4 mt-3 small text-muted">
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-success rounded-circle p-1"> </span> Completed ({stats?.completedAppointments || 0})
            </span>
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-primary rounded-circle p-1"> </span> Confirmed ({stats?.confirmedAppointments || 0})
            </span>
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-warning rounded-circle p-1"> </span> Pending ({stats?.pendingAppointments || 0})
            </span>
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-danger rounded-circle p-1"> </span> Cancelled ({stats?.cancelledAppointments || 0})
            </span>
          </div>
        </div>

        {/* Recent Activity: Recent Appointments & Recent Users */}
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 rounded-4 p-4 h-100 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold mb-0">Recent Scheduled Consultations</h5>
                <Link to="/all-appointments" className="small text-primary text-decoration-none fw-semibold">
                  View All &rarr;
                </Link>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Slot</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
                      stats.recentAppointments.map((a) => (
                        <tr key={a._id}>
                          <td className="fw-semibold small">{a.userId?.name || "Patient"}</td>
                          <td className="small text-muted">{a.doctorId?.name || "Specialist"}</td>
                          <td className="small">
                            {a.slotDate} <span className="text-muted">({a.slotTime})</span>
                          </td>
                          <td>
                            <span
                              className={`badge rounded-pill small ${
                                a.status === "completed"
                                  ? "bg-success"
                                  : a.status === "confirmed"
                                  ? "bg-primary"
                                  : a.status === "cancelled" || a.status === "cancel"
                                  ? "bg-danger"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-3 small">
                          No recent appointments recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm border-0 rounded-4 p-4 h-100 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold mb-0">Recent Registrations</h5>
                <Link to="/all-users" className="small text-primary text-decoration-none fw-semibold">
                  View All &rarr;
                </Link>
              </div>

              <div className="d-flex flex-column gap-3">
                {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map((u) => (
                    <div key={u._id} className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px", fontSize: "12px" }}
                        >
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <strong className="d-block small">{u.name}</strong>
                          <span className="text-muted" style={{ fontSize: "11px" }}>
                            {u.email}
                          </span>
                        </div>
                      </div>
                      <Link to={`/user-details/${u._id}`} className="btn btn-sm btn-link p-0 text-primary">
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small text-center my-auto">No recent registrations.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
