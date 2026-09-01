import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateUserData, getLoginUserDetails } from "../../redux/actions/authActions";
import { reset } from "../../redux/slice/authSlice";
import toast from "react-hot-toast";

const EditUserProfile = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state se user, success, error nikal rahe hain
  const { user, success, error } = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState("");
  useEffect(() => {
    if (isOpen) {
      dispatch(reset());
    }
  }, [isOpen, dispatch]);

  // Jab user data load ho, toh form fields mein purana data set ho jaye
  useEffect(() => {
    if (user) {
      setName(user?.name || "");
      setPhone(user?.phone || "");
      setGender(user?.gender || "Male");
      setDob(user?.dob || "");
      setAddress(user?.address || "");
      setImage(user?.image || "");
    }
  }, [user]);

  // Handle Update Form Submission
  const handleUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("image", image);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("gender", gender);
    formData.append("dob", dob);

    if (user?._id) {
      dispatch(updateUserData({ id: user._id, formData }));
    }
  };

  // Success ya Error handle karne ke liye useEffect
  useEffect(() => {
    if (success) {
      toast.success("Profile Updated Successfully!");
      if (user?._id) {
        dispatch(getLoginUserDetails(user._id));
      }
      dispatch(reset());
      onClose();
    }
    if (error) {
      toast.error(error);
      dispatch(reset());
    }
  }, [success, error, dispatch, onClose, user]);

  if (!isOpen) return null;

  return (
    <div className="editModal modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content p-3">
          <div className="modal-header">
            <h5 className="modal-title">Edit Your Profile</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="modal-body">
              {/* Profile Image Preview & Input */}
              <div className="d-flex flex-column align-items-center mb-3">
                <img
                  src={
                    typeof image === "object"
                      ? URL.createObjectURL(image)
                      : (image ? `data:image/jpeg;base64,${image}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png")
                  }
                  alt="userPic"
                  className="rounded-circle mb-2 shadow-sm"
                  height={80}
                  width={80}
                  style={{ objectFit: "cover" }}
                />
                <input
                  type="file"
                  className="form-control form-control-sm"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>

              {/* Name */}
              <div className="mb-2">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Gender */}
              <div className="mb-2">
                <label className="form-label">Gender</label>
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

              {/* DOB */}
              <div className="mb-2">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="mb-2">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Address */}
              <div className="mb-2">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserProfile;