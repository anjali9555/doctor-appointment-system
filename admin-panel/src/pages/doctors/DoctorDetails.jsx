import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Layout from "../../components/Layout/Layout";
import InputForm from "../../components/Forms/InputForm";
import InputSelect from "../../components/Forms/InputSelect";

// 🚀 FIXED: Aapki file ke exact functions yahan import kiye hain
import { getDoctorDetails, updateStatus, updateDoctor, deleteDoctor } from "../../redux/actions/doctorActions"; 

const DoctorDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getDoctorDetails(id));
  }, [dispatch, id]);

  const { doctor, success, error } = useSelector((state) => state.doctor);
  
  const [edit, setEdit] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
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

  // 🚀 FIXED: Aapki theek ki gayi spelling 'availableStatus' use ho rahi hai
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

  // 🚀 FIXED: FormData banakar bheja hai kyunki aapke action me "multipart/form-data" hai
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

    // Aapka asli update action yahan call ho raha hai
    dispatch(updateDoctor({ id: doctor._id, formData })); 
    
    toast.success("Doctor Details Updated Successfully!");
    setEdit(true); // Form wapas lock ho jayega
  };

  // 🚀 ADDED: Delete Button Logic
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      dispatch(deleteDoctor(doctor._id));
      toast.success("Doctor Deleted!");
      navigate("/all-doctors");
    }
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
        <InputForm label={"Name"} value={name} setValue={setName} disabled={edit} />
        <InputForm label={"Email"} value={email} setValue={setEmail} disabled={edit} />
        <InputForm label={"Degree"} value={degree} setValue={setDegree} disabled={edit} />
        
        <InputSelect
          label={"Spceciality"} 
          value={speciality}
          setValue={setSpeciality}
          disabled={edit}
          options={["Select Spceciality", "Genral", "dental", "Mental", "eye"]}
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

          {/* Yahan true/false seedha pass kiya hai backend match karne ke liye */}
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
      </div>
    </Layout>
  );
};

export default DoctorDetails;