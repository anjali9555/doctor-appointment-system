import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllDoctors } from "../../redux/actions/doctorActions";
import { MASTER_SPECIALTIES } from "../../constants/specialties";
import {
  Search,
  Star,
  Clock,
  IndianRupee,
  Calendar,
  CheckCircle,
  XCircle,
  Filter,
  ArrowRight,
} from "lucide-react";

const AllDoctors = () => {
  const dispatch = useDispatch();
  const { doctors, loading } = useSelector((state) => state.doctor);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [sortBy, setSortBy] = useState("recommended");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    dispatch(getAllDoctors());
  }, [dispatch]);

  // Merge the standard 9 master specialties with any custom specialties present in the database
  const mergedMap = new Map();
  MASTER_SPECIALTIES.forEach((s) => mergedMap.set(s.toLowerCase().trim(), s));
  (doctors || []).forEach((d) => {
    if (d.speciality && d.speciality.trim()) {
      const clean = d.speciality.trim();
      const lower = clean.toLowerCase();
      if (!mergedMap.has(lower)) {
        mergedMap.set(lower, clean);
      }
    }
  });

  const specialities = [
    "All Specialties",
    ...Array.from(mergedMap.values()),
  ];

  // Filtered & sorted doctor list with case-insensitive and trimmed specialty comparison
  const filteredDoctors = (doctors || []).filter((doc) => {
    const matchesSearch =
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      doc.speciality?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      doc.degree?.toLowerCase().includes(searchTerm.toLowerCase().trim());

    const matchesSpecialty =
      !selectedSpecialty ||
      selectedSpecialty.toLowerCase() === "all" ||
      selectedSpecialty.toLowerCase() === "all specialties" ||
      doc.speciality?.trim().toLowerCase() === selectedSpecialty.trim().toLowerCase();

    const matchesAvailability = !availableOnly || doc.available;

    return matchesSearch && matchesSpecialty && matchesAvailability;
  }).sort((a, b) => {
    if (sortBy === "fees_asc") return (a.fees || 0) - (b.fees || 0);
    if (sortBy === "fees_desc") return (b.fees || 0) - (a.fees || 0);
    if (sortBy === "experience") return (b.experience || 0) - (a.experience || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  // Helper for rendering image cleanly whether base64 or URL
  const getDoctorImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  return (
    <div className="container py-4">
      {/* Header Banner */}
      <div className="text-center mb-4">
        <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">
          Verified Medical Specialists
        </span>
        <h2 className="fw-bold text-dark">Find & Book Your Doctor</h2>
        <p className="text-muted" style={{ maxWidth: "600px", margin: "auto" }}>
          Browse certified doctors, view live schedule availability, and book an appointment with instant confirmation.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
        <div className="row g-3 align-items-center">
          {/* Search Box */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 bg-light"
                placeholder="Search by doctor name, specialty, degree..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Specialty Filter Dropdown (Always includes all 9 master specialties + custom) */}
          <div className="col-6 col-md-3">
            <select
              className="form-select bg-light"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              {specialities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="col-6 col-md-2">
            <select
              className="form-select bg-light"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">Sort: Default</option>
              <option value="fees_asc">Fee: Low to High</option>
              <option value="fees_desc">Fee: High to Low</option>
              <option value="experience">Most Experienced</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Available Only Toggle */}
          <div className="col-12 col-md-2 d-flex align-items-center">
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="availableOnlyToggle"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              <label
                className="form-check-label small fw-semibold text-muted ms-1"
                htmlFor="availableOnlyToggle"
              >
                Available Today
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">Loading medical specialists...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-4 my-4 p-4">
          <h5 className="text-muted mb-2">No doctors found matching your criteria</h5>
          <p className="text-muted small">Try modifying your specialty filter or clearing the search query.</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedSpecialty("All Specialties");
              setAvailableOnly(false);
            }}
            className="btn btn-outline-primary btn-sm mx-auto"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredDoctors.map((doc) => (
            <div className="col" key={doc._id}>
              <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden transition-all hover-shadow">
                {doc.image ? (
                  <div className="position-relative">
                    <img
                      src={getDoctorImageUrl(doc.image)}
                      alt={doc.name}
                      className="card-img-top"
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <span
                      className={`position-absolute top-0 end-0 m-2 badge rounded-pill px-3 py-2 ${
                        doc.available ? "bg-success" : "bg-danger"
                      }`}
                    >
                      {doc.available ? (
                        <span className="d-flex align-items-center gap-1">
                          <CheckCircle size={13} /> Available
                        </span>
                      ) : (
                        <span className="d-flex align-items-center gap-1">
                          <XCircle size={13} /> Unavailable
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="d-flex justify-content-end p-3 pb-0">
                    <span
                      className={`badge rounded-pill px-3 py-2 ${
                        doc.available ? "bg-success" : "bg-danger"
                      }`}
                    >
                      {doc.available ? (
                        <span className="d-flex align-items-center gap-1">
                          <CheckCircle size={13} /> Available
                        </span>
                      ) : (
                        <span className="d-flex align-items-center gap-1">
                          <XCircle size={13} /> Unavailable
                        </span>
                      )}
                    </span>
                  </div>
                )}

                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-info-subtle text-info-emphasis rounded-pill px-3 py-1 fw-semibold">
                      {doc.speciality}
                    </span>
                    {doc.numReviews > 0 ? (
                      <span className="d-flex align-items-center gap-1 text-warning fw-bold small">
                        <Star size={14} className="fill-warning text-warning" />
                        {Number(doc.rating).toFixed(1)} ({doc.numReviews})
                      </span>
                    ) : (
                      <span className="badge bg-light text-muted border small fw-normal">
                        New (0)
                      </span>
                    )}
                  </div>

                  <h5 className="card-title fw-bold text-dark mb-1">{doc.name}</h5>
                  <p className="text-muted small mb-2">{doc.degree}</p>

                  <div className="d-flex align-items-center gap-3 text-muted small mb-3">
                    <span className="d-flex align-items-center gap-1">
                      <Clock size={14} /> {doc.experience} Years Exp.
                    </span>
                    <span>&bull;</span>
                    <span className="fw-bold text-primary">₹{doc.fees} Consultation</span>
                  </div>

                  <p
                    className="card-text text-muted small mb-4 flex-grow-1"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {doc.about || "Experienced practitioner providing comprehensive medical care and patient consultations."}
                  </p>

                  <div className="mt-auto">
                    {doc.available ? (
                      <Link
                        to={`/doctors/${doc._id}`}
                        className="btn btn-primary w-100 rounded-pill d-flex align-items-center justify-content-center gap-2 fw-semibold shadow-sm"
                      >
                        <Calendar size={16} /> Book Appointment
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="btn btn-outline-secondary w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                      >
                        Doctor Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllDoctors;
