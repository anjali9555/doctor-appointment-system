import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { addDoctor } from "../../redux/actions/doctorActions";
import { reset } from "../../redux/slice/doctorSlice";
import { UserPlus, ArrowLeft, Clock, Calendar, DollarSign, Stethoscope } from "lucide-react";
import { MASTER_SPECIALTIES } from "../../constants/specialties";

const AddDoctor = () => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(null);
  const [speciality, setSpeciality] = useState("Cardiologist");
  const [experience, setExperience] = useState("");
  const [degree, setDegree] = useState("");
  const [about, setAbout] = useState("");
  const [fees, setFees] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Availability schedule
  const [workingDays, setWorkingDays] = useState([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState("30");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { success, error, loading } = useSelector((state) => state.doctor);

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleAddDoctor = (e) => {
    e.preventDefault();

    if (!name || !email || !degree || !fees || !experience || !about) {
      return toast.error("Please fill in all mandatory fields.");
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("gender", gender);
    formData.append("email", email);
    formData.append("about", about);
    formData.append("speciality", speciality);
    formData.append("fees", fees);
    formData.append("experience", experience);
    formData.append("degree", degree);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("workingDays", JSON.stringify(workingDays));
    formData.append("workingHoursStart", workingHoursStart);
    formData.append("workingHoursEnd", workingHoursEnd);
    formData.append("slotDuration", slotDuration);

    if (image) {
      formData.append("image", image);
    }

    dispatch(addDoctor(formData));
  };

  useEffect(() => {
    if (success) {
      toast.success("Doctor created and schedule configured!");
      dispatch(reset());
      navigate("/all-doctors");
    }
    if (error) {
      toast.error(error);
      dispatch(reset());
    }
  }, [success, error, dispatch, navigate]);

  return (
    <Layout>
      <div className="p-4" style={{ maxWidth: "900px" }}>
        <button
          onClick={() => navigate("/all-doctors")}
          className="btn btn-outline-secondary btn-sm rounded-pill mb-3 d-inline-flex align-items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to Doctors
        </button>

        <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
          <div className="d-flex align-items-center gap-2 mb-4 border-bottom pb-3">
            <div className="p-2 bg-primary text-white rounded-3">
              <UserPlus size={20} />
            </div>
            <div>
              <h4 className="fw-bold mb-0">Register New Medical Specialist</h4>
              <p className="text-muted small mb-0">
                Configure doctor credentials, clinical specialty, and weekly availability schedule.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddDoctor}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Doctor Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Sarah Mitchell"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="doctor@medicare.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Speciality *</label>
                <select
                  className="form-select"
                  value={speciality}
                  onChange={(e) => setSpeciality(e.target.value)}
                >
                  {MASTER_SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Medical Degree *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="MBBS, MD - Cardiology"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Experience (Years) *</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 10"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Consultation Fee (₹) *</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 800"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Gender</label>
                <select
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold">Clinic Room / Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Suite 401, MediCare Specialty Tower"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold">Profile Bio / About *</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Detailed summary of clinical specialties, fellowships, and experience..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold">Doctor Photograph</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>
            </div>

            {/* Weekly Availability Schedule Configuration */}
            <div className="p-3 bg-light rounded-4 mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <Clock size={18} className="text-primary" />
                Working Hours & Availability Schedule
              </h6>

              <div className="mb-3">
                <label className="form-label small fw-semibold d-block">Consultation Days:</label>
                <div className="d-flex flex-wrap gap-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                    (day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`btn btn-sm rounded-pill px-3 ${
                          workingDays.includes(day)
                            ? "btn-primary text-white"
                            : "btn-outline-secondary bg-white text-dark"
                        }`}
                      >
                        {day}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="row g-3">
                <div className="col-sm-4">
                  <label className="form-label small fw-semibold">Shift Start Time (24h)</label>
                  <input
                    type="time"
                    className="form-control"
                    value={workingHoursStart}
                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                  />
                </div>
                <div className="col-sm-4">
                  <label className="form-label small fw-semibold">Shift End Time (24h)</label>
                  <input
                    type="time"
                    className="form-control"
                    value={workingHoursEnd}
                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  />
                </div>
                <div className="col-sm-4">
                  <label className="form-label small fw-semibold">Slot Duration (Minutes)</label>
                  <select
                    className="form-select"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                  >
                    <option value="15">15 Minutes</option>
                    <option value="20">20 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm"
            >
              {loading ? "Registering Doctor..." : "Register Doctor & Deploy Schedule"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddDoctor;
