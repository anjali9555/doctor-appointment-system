import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Layout from "../../components/Layout/Layout";
import InputForm from "../../components/Forms/InputForm";
import InputSelect from "../../components/Forms/InputSelect";
import { MASTER_SPECIALTIES } from "../../constants/specialties";
import { Star, User } from "lucide-react";
import API from "../../Api/API";

import { getDoctorDetails, updateStatus, updateDoctor, deleteDoctor } from "../../redux/actions/doctorActions";

const DoctorDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    dispatch(getDoctorDetails(id));
    API.get(`/doctor/${id}/reviews`)
      .then((res) => {
        if (res.data?.success) setReviews(res.data.reviews || []);
      })
      .catch(() => {});
  }, [dispatch, id]);

  const { doctor, success, error } = useSelector((state) => state.doctor);

  const [edit, setEdit] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [speciality, setSpeciality] = useState("");
  const [experience, setExperience] = useState("");
  const [degree, setDegree] = useState("");
  const [about, setAbout] = useState("");
  const [fees, setFees] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (doctor) {
      setName(doctor?.name || "");
      setEmail(doctor?.email || "");
      setImage(doctor?.image || "");
      setSpeciality(doctor?.speciality || "");
      setExperience(doctor?.experience || "");
      setDegree(doctor?.degree || "");
      setAbout(doctor?.about || "");
      setFees(doctor?.fees || "");
      setAddress(doctor?.address || "");
      setGender(doctor?.gender || "");
      setPhone(doctor?.phone || "");
    }
  }, [doctor]);

  const handleUpdateStatus = (statusValue) => {
    dispatch(updateStatus({ id: doctor._id, availableStatus: statusValue }));

    if (success) {
      toast.success("Doctor Status Updated!");
      navigate("/all-doctors");
    }
    if (error) {
      toast.error(error);
    }
  };

  const handleUpdateDoctor = () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("speciality", speciality);
    formData.append("experience", experience);
    formData.append("degree", degree);
    formData.append("about", about);
    formData.append("fees", fees);
    formData.append("address", address);
    formData.append("gender", gender);
    formData.append("phone", phone);

    if (newImageFile) {
      formData.append("image", newImageFile);
    }

    dispatch(updateDoctor({ id: doctor._id, formData }));

    toast.success("Doctor Details Updated Successfully!");
    setEdit(true);
    setNewImageFile(null);
    setTimeout(() => dispatch(getDoctorDetails(id)), 400);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      dispatch(deleteDoctor(doctor._id));
      toast.success("Doctor Deleted!");
      navigate("/all-doctors");
    }
  };

  const getImageSrc = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  return (
    <Layout>
      <div className="d-flex p-3 justify-content-between bg-light mb-4 shadow-sm">
        <button className="btn btn-primary fw-bold" onClick={() => navigate("/all-doctors")}>
          GO Back
        </button>
        <div>
          <button
            className="btn btn-warning me-3 text-white fw-bold"
            onClick={() => setEdit(!edit)}
          >
            {edit ? "EDIT" : "CANCEL"}
          </button>
          <button className="btn btn-danger fw-bold" onClick={handleDelete}>
            DELETE
          </button>
        </div>
      </div>

      <div className="w-75 mx-auto">
        {/* Doctor Photo Display - Conditionally rendered only if valid image exists */}
        {image ? (
          <div className="mb-4 text-center">
            <img
              src={getImageSrc(image)}
              alt={name || "Doctor"}
              className="rounded-circle shadow-sm"
              style={{ width: "110px", height: "110px", objectFit: "cover" }}
            />
          </div>
        ) : null}

        {/* Optional Photo Upload in Edit Mode */}
        {!edit && (
          <div className="card p-3 mb-4 bg-light border-0 rounded-3">
            <label className="form-label fw-bold small">Doctor Photograph (Optional)</label>
            <input
              type="file"
              className="form-control"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => setNewImageFile(e.target.files[0])}
            />
            <small className="text-muted mt-1">Leave empty to keep existing image setting</small>
          </div>
        )}

        <InputForm label={"Name"} value={name} setValue={setName} disabled={edit} />
        <InputForm label={"Email"} value={email} setValue={setEmail} disabled={edit} />
        <InputForm label={"Degree"} value={degree} setValue={setDegree} disabled={edit} />

        <InputSelect
          label={"Speciality"}
          value={speciality}
          setValue={setSpeciality}
          disabled={edit}
          options={["Select Speciality", ...Array.from(new Set([...MASTER_SPECIALTIES, ...(speciality ? [speciality] : [])]))]}
        />

        <InputSelect
          label={"GENDER"}
          value={gender}
          setValue={setGender}
          disabled={edit}
          options={["Select Gender", "Male", "Female"]}
        />

        <InputForm label={"experience"} value={experience} setValue={setExperience} disabled={edit} />
        <InputForm label={"Fees"} value={fees} setValue={setFees} disabled={edit} />
        <InputForm label={"About"} value={about} setValue={setAbout} disabled={edit} />
        <InputForm label={"Phone"} value={phone} setValue={setPhone} disabled={edit} />
        <InputForm label={"Address"} value={address} setValue={setAddress} disabled={edit} />

        <div className="d-flex gap-3 mt-4 mb-5">
          {!edit && (
            <button className="btn btn-primary fw-bold" onClick={handleUpdateDoctor}>
              UPDATE DOCTOR
            </button>
          )}

          {doctor?.available ? (
            <button
              className="btn btn-danger fw-bold"
              onClick={() => handleUpdateStatus(false)}
            >
              MARK AS Un-Available
            </button>
          ) : (
            <button
              className="btn btn-success fw-bold"
              onClick={() => handleUpdateStatus(true)}
            >
              MARK AS Available
            </button>
          )}
        </div>

        {/* Verified Patient Reviews (Read-only for Admin) */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mt-4 mb-5">
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <Star size={20} className="text-warning fill-warning" />
              Verified Patient Reviews ({reviews.length})
            </h5>
            {reviews.length > 0 ? (
              <span className="badge bg-warning-subtle text-dark px-3 py-2 rounded-pill fw-semibold">
                ★ {Number(doctor?.rating || 0).toFixed(1)} Average Rating
              </span>
            ) : (
              <span className="badge bg-light text-muted border px-3 py-2 rounded-pill">
                No Reviews
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-muted small mb-0">
              No patient reviews have been submitted for this doctor yet. Reviews will automatically appear once patients complete appointments and submit feedback.
            </p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "28px", height: "28px", fontSize: "12px" }}
                      >
                        <User size={15} />
                      </div>
                      <div>
                        <span className="fw-semibold small">{rev.userId?.name || "Verified Patient"}</span>
                        <span className="text-muted ms-2" style={{ fontSize: "11px" }}>
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-warning d-flex align-items-center small">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < rev.rating ? "text-warning fill-warning" : "text-muted"}
                        />
                      ))}
                      <span className="text-dark fw-bold ms-1" style={{ fontSize: "12px" }}>({rev.rating})</span>
                    </div>
                  </div>
                  {rev.comment ? (
                    <p className="text-muted small mb-0 ms-4">{rev.comment}</p>
                  ) : (
                    <p className="text-muted small fst-italic mb-0 ms-4" style={{ fontSize: "11px" }}>
                      (No written comment)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DoctorDetails;
