import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"; // Ya react-toastify jo aap use kar rahi hain
import InputForm from "../../components/Forms/InputForm";
import InputSelect from "../../components/Forms/InputSelect";
import { addDoctor } from "../../redux/actions/doctorActions";
import { reset } from "../../redux/slice/doctorSlice";

const AddDoctor = () => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Select Gender"); 
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(null); // File upload ke liye null sahi hai
  const [speciality, setSpeciality] = useState("Select Speciality");
  const [experience, setExperience] = useState("");
  const [degree, setDegree] = useState("");
  const [about, setAbout] = useState("");
  const [fees, setFees] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { success, error, loading } = useSelector((state) => state.doctor);

  const handleAddDoctor = (e) => {
    e.preventDefault(); // Page refresh rokne ke liye
    
    // FormData banayenge kyunki isme image file hai
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
    if (image) {
      formData.append("image", image);
    }

    dispatch(addDoctor(formData));
  };

  // Redux state change hone par Notification aur Navigation
  useEffect(() => {
    if (success) {
      toast.success("Doctor Created Successfully!");
      dispatch(reset());
      navigate("/all-doctors"); // Success hone par wapas list par bhej do
    }
    if (error) {
      toast.error(error);
      dispatch(reset());
    }
  }, [success, error, dispatch, navigate]);

  return (
    <Layout>
      <div className="d-flex p-3 justify-content-between bg-light mt-3">
        <h2>Add New Doctor</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/all-doctors")}
        >
          Go Back
        </button>
      </div>

      <div className="container mt-4 mb-5">
        <form onSubmit={handleAddDoctor} className="w-75 mx-auto card p-4 shadow-sm">
          <InputForm label="Name" value={name} setValue={setName} />
          <InputForm label="Email" value={email} setValue={setEmail} />
          <InputForm label="Degree" value={degree} setValue={setDegree} />
          
          <InputSelect
            label="Speciality"
            value={speciality}
            setValue={setSpeciality}
            options={[
              "Select Speciality",
              "General",
              "Dental",
              "Mental",
              "Eye",
            ]}
          />
          <InputSelect
  label="GENDER"
  value={gender}
  setValue={setGender}
  options={["Select Gender", "Male", "Female"]}
/>
          
          <InputForm label="Experience" value={experience} setValue={setExperience} />
          <InputForm label="Fees" value={fees} setValue={setFees} />
          <InputForm label="Phone" value={phone} setValue={setPhone} />
          <InputForm label="Address" value={address} setValue={setAddress} />
          <InputForm label="About" value={about} setValue={setAbout} />
          
          {/* Image Input */}
          <div className="mb-3">
            <label className="form-label">Doctor Image</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
            {loading ? "Creating Doctor..." : "Submit"}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AddDoctor;
