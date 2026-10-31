import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getAllDoctors, updateStatus } from "../../redux/actions/doctorActions";
import { reset } from "../../redux/slice/doctorSlice";
import { Plus, Search, Stethoscope, Star, CheckCircle, XCircle } from "lucide-react";

const AllDoctors = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { doctors, loading } = useSelector((state) => state.doctor);

  useEffect(() => {
    dispatch(getAllDoctors());
  }, [dispatch]);

  const handleToggleStatus = (id, currentStatus) => {
    dispatch(updateStatus({ id, availableStatus: !currentStatus }));
    setTimeout(() => dispatch(getAllDoctors()), 400);
  };

  const getDoctorImage = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  const filteredDoctors = (doctors || []).filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.speciality?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">Medical Staff & Doctor Management</h2>
            <p className="text-muted small mb-0">Manage doctor profiles, consultation fees, and live availability schedules.</p>
          </div>
          <button
            className="btn btn-primary btn-sm rounded-pill d-flex align-items-center gap-1 px-3 shadow-sm"
            onClick={() => {
              dispatch(reset());
              navigate("/add-doctor");
            }}
          >
            <Plus size={16} /> Add Doctor
          </button>
        </div>

        {/* Search */}
        <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <Search size={18} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0 bg-light"
              placeholder="Search by doctor name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Doctors Table */}
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Doctor</th>
                  <th>Speciality</th>
                  <th>Degree & Exp</th>
                  <th>Consultation Fee</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status" />
                    </td>
                  </tr>
                ) : filteredDoctors.length > 0 ? (
                  filteredDoctors.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {d.image ? (
                            <img
                              src={getDoctorImage(d.image)}
                              alt="doc"
                              className="rounded-circle shadow-sm"
                              height={44}
                              width={44}
                              style={{ objectFit: "cover" }}
                            />
                          ) : null}
                          <div>
                            <strong className="d-block text-dark small">{d.name}</strong>
                            <span className="text-muted" style={{ fontSize: "11px" }}>
                              {d.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary rounded-pill small">
                          {d.speciality}
                        </span>
                      </td>
                      <td className="small">
                        <div className="text-dark">{d.degree}</div>
                        <div className="text-muted">{d.experience} Years Experience</div>
                      </td>
                      <td className="fw-bold text-dark">₹{d.fees}</td>
                      <td>
                        {d.numReviews > 0 ? (
                          <span className="d-flex align-items-center gap-1 text-warning fw-semibold small">
                            <Star size={14} className="fill-warning" /> {Number(d.rating).toFixed(1)} ({d.numReviews})
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border small fw-normal">
                            No Reviews
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(d._id, d.available)}
                          className={`btn btn-sm rounded-pill px-3 py-1 border-0 ${
                            d.available ? "btn-success" : "btn-outline-danger"
                          }`}
                          style={{ fontSize: "12px" }}
                        >
                          {d.available ? (
                            <span className="d-flex align-items-center gap-1">
                              <CheckCircle size={12} /> Available
                            </span>
                          ) : (
                            <span className="d-flex align-items-center gap-1">
                              <XCircle size={12} /> Unavailable
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/doctor-details/${d._id}`}
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <Stethoscope size={36} className="text-muted mb-2 opacity-50 d-block mx-auto" />
                      No doctors matching your query.
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

export default AllDoctors;
