import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate,Link } from "react-router-dom"; // 🔥 Yeh line missing hai! Isko add karo.
import EditUserProfile from "./EditUserProfile";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slice/authSlice";
import { getLoginUserDetails } from "../../redux/actions/authActions";

const UserProfile = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // 🔥 Page load hote hi API call jayegi
  useEffect(() => {
    const localData = localStorage.getItem("appData");
    if (localData) {
      const appData = JSON.parse(localData);
      const id = appData?.user?._id;
      if (id) {
        dispatch(getLoginUserDetails(id));
      }
    }
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("appData");
    navigate("/login");
    toast.success("logout successfully");
  };

  return (
    <>
      <div className="container mt-5">
        <div className="row">
          <h4 className="text-center mb-4">Manage Your Account & Appointments</h4>
          
          <div className="col-md-3 text-center">
            {/* Agar user ki photo database mein hai toh wo dikhao, warna default dummy pic */}
            <img 
              src={user?.image ? `data:image/jpeg;base64,${user.image}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
              alt="userPic" 
              className="card p-2 shadow-sm rounded-circle mx-auto" 
              width={150} 
              height={150} 
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="col-md-8 mt-3">
            <div className="user-container mb-3 p-3 border rounded bg-light">
              {/* 🔥 Ab data hardcoded nahi, seedha database/redux se aayega */}
              <h6 className="mb-2">Name : {user?.name || "N/A"}</h6>
              <h6 className="mb-2">Gender : {user?.gender || "Not Added"}</h6>
              <h6 className="mb-2">DOB : {user?.dob || "Not Added"}</h6>
              <h6 className="mb-2">Email : {user?.email || "N/A"}</h6>
              <h6 className="mb-2">Phone : {user?.phone || "Not Added"}</h6>
              <h6 className="mb-0">Address : {user?.address || "Not Added"}</h6>
              <h4 className="mt-3">
  <Link to={`/user/reset-password/${user?._id}`} className="text-primary text-decoration-none" style={{ fontSize: "16px", cursor: "pointer" }}>
    Reset Password
  </Link>
</h4>
            </div>

            {/* Buttons */}
            <div className="button-container mt-4">
              <button 
                className="btn btn-warning" 
                onClick={() => setIsOpen(!isOpen)}
              >
                <i className="fa-solid fa-pen-to-square me-2"></i> Edit Profile
              </button>
              
              <button 
                className="btn btn-primary ms-3"
                onClick={() => navigate("/user/appointments")}
              >
                <i className="fa-solid fa-list me-2"></i> Appointments
              </button>
              
              <button 
                className="btn btn-danger ms-3" 
                onClick={handleLogout}
              >
                <i className="fa-solid fa-power-off me-2"></i> LOGOUT
              </button>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isOpen && (
          <EditUserProfile isOpen={isOpen} onClose={() => setIsOpen(false)} />
        )}
      </div>
    </>
  );
};

export default UserProfile;