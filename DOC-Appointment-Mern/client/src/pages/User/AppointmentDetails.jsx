import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../Api/API"; // Dhyan rahe yeh path aapke API setup ke hisaab se sahi ho
import toast from "react-hot-toast";

const AppointmentDetails = () => {
  const { id } = useParams(); // URL se appointment ki ID nikal rahe hain
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    // Backend API call appointment details laane ke liye
    const fetchAppointmentDetails = async () => {
      try {
        const res = await API.get(`/appointment/get-user-appointment-details/${id}`);
        if (res.data.success) {
          setDetails(res.data.appointmentDetails);
        }
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch appointment details");
      }
    };

    fetchAppointmentDetails();
  }, [id]);

  return (
    <div className="container mt-5 mb-5" style={{ maxWidth: "800px" }}>
      <div className="card shadow-sm">
        {/* Header aur Go Back Button */}
        <div className="card-header bg-white d-flex justify-content-between align-items-center p-3">
          <h4 className="m-0">Your Appointment Details</h4>
          <button className="btn btn-dark" onClick={() => navigate(-1)}>
            GO BACK
          </button>
        </div>

        {/* Details Body */}
        <div className="card-body p-4">
          {details ? (
            <>
              <p className="mb-3">Doctor Name : {details?.doctorName}</p>
              <p className="mb-3">Doctor Phone : {details?.doctorPhone}</p>
              <p className="mb-3">Doctor Email : {details?.doctorEmail}</p>
              <p className="mb-3">Booking Date : {details?.bookingDate}</p>
              <p className="mb-3">Booking Time : {details?.bookingTime}</p>
              <p className="mb-4">Doctor Amount : {details?.amount}/- RS</p>
              
              {/* Status Box (Tutorial Style - Cyan/Info background) */}
              <div 
                className="p-3 text-white fs-5" 
                style={{ backgroundColor: "#00c6ff" }}
              >
                Booking Status : {details?.bookingStatus}
              </div>
            </>
          ) : (
            <div className="text-center">Loading details...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;