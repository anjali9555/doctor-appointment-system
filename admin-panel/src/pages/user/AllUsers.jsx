import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers } from "../../redux/actions/userAction";
import { Link } from "react-router-dom";
import { Users, Search, Eye, Mail, Phone, Calendar } from "lucide-react";

const AllUsers = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const { users, loading } = useSelector((state) => state.user);

  const filteredUsers = (users || []).filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserImage = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">Registered Patients</h2>
            <p className="text-muted small mb-0">Browse registered patient profiles and view consultation histories.</p>
          </div>
          <span className="badge bg-primary rounded-pill px-3 py-2 fs-6">
            Total: {users?.length || 0}
          </span>
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
              placeholder="Search by patient name, email, or contact number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Patients Table */}
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Patient Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Registered On</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status" />
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u, i) => (
                    <tr key={u._id}>
                      <td className="text-muted small">{i + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {u.image ? (
                            <img
                              src={getUserImage(u.image)}
                              alt={u.name || "Patient"}
                              className="rounded-circle shadow-sm"
                              style={{ width: "34px", height: "34px", objectFit: "cover" }}
                            />
                          ) : null}
                          <div>
                            <strong className="d-block text-dark small">{u.name}</strong>
                            <span className="badge bg-light text-muted border small">
                              {u.role || "Patient"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted small">
                        <span className="d-flex align-items-center gap-1">
                          <Mail size={13} /> {u.email}
                        </span>
                      </td>
                      <td className="text-muted small">
                        <span className="d-flex align-items-center gap-1">
                          <Phone size={13} /> {u.phone || "N/A"}
                        </span>
                      </td>
                      <td className="text-muted small">
                        <span className="d-flex align-items-center gap-1">
                          <Calendar size={13} /> {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/user-details/${u._id}`}
                          className="btn btn-outline-primary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1"
                        >
                          <Eye size={14} /> Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <Users size={36} className="text-muted mb-2 opacity-50 d-block mx-auto" />
                      No registered patients found.
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

export default AllUsers;
