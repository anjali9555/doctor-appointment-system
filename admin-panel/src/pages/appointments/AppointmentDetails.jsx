import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
// 👉 FIX 1: useNavigate ko yahan import kiya hai
import { useParams, useNavigate } from "react-router-dom"; 
import { getAppointmentDetails, updateAppointmentStatus } from "../../redux/actions/appointmentAction";
import InputSelect from "../../components/Forms/InputSelect";
import { toast } from "react-hot-toast";
import { reset } from "../../redux/slice/appointmentSlice";

const AppointmentDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  // 👉 FIX 2: navigate ko yahan define kiya hai (Ye line missing thi aapke code mein)
  const navigate = useNavigate(); 

  const { appointment, error, success } = useSelector((state) => state.appointments);

  const [appointmentStatus, setAppointmentStatus] = useState("");

  useEffect(() => {
    dispatch(reset());
    dispatch(getAppointmentDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (appointment) {
      setAppointmentStatus(appointment?.bookingStatus);
    }
  }, [appointment]);

const handleUpdateStatus = () => {
    console.log("🔍 Dropdown se kya value mili:", appointmentStatus);
    
    // 👉 Yahan key ka naam 'bookingStatus' hona chahiye, kyunki action wahi expect kar raha hai
    dispatch(updateAppointmentStatus({ id, bookingStatus: appointmentStatus }));
  };

  // Success hone par navigate chalega
  useEffect(() => {
    if (success) {
      toast.success("Status Updated Successfully!");
      dispatch(reset());
      // 👉 Yahan navigate use ho raha hai
      navigate("/all-appointments"); 
    }
    if (error) {
      toast.error(error);
      dispatch(reset());
    }
  }, [success, error, dispatch, navigate]);

  return (
    <Layout>
      <div className="w-100 bg-white m-0 p-4 shadow-sm mb-4">
        
        <div className="border-bottom pb-3 mb-4">
          <h2 className="m-0 text-dark fw-bold">Appointment Details</h2>
        </div>

        <div className="card shadow-sm border-0" style={{ maxWidth: "800px" }}>
          <table className="table table-bordered mb-0">
            <tbody>
              <tr>
                <th className="bg-light w-25">Client Name</th>
                <td>{appointment?.clientName}</td>
              </tr>
              <tr>
                <th className="bg-light">Client Phone</th>
                <td>{appointment?.clientPhone}</td>
              </tr>
              <tr>
                <th className="bg-light">Client Email</th>
                <td>{appointment?.clientEmail}</td>
              </tr>
              <tr>
                <th className="bg-light">Doctor Name</th>
                <td>{appointment?.doctorName}</td>
              </tr>
              <tr>
                <th className="bg-light">Doctor Email</th>
                <td>{appointment?.doctorEmail}</td>
              </tr>
              <tr>
                <th className="bg-light">Booking Date</th>
                <td>{appointment?.bookingDate}</td>
              </tr>
              <tr>
                <th className="bg-light">Booking Time</th>
                <td>{appointment?.bookingTime}</td>
              </tr>
              <tr>
                <th className="bg-light">Booking Amount</th>
                <td className="fw-bold text-success">₹ {appointment?.amount}</td>
              </tr>
              <tr>
                <th className="bg-light align-middle">Booking Status</th>
                <td>
                  <span 
                    className={`badge px-3 py-2 ${
                      appointment?.bookingStatus === "pending" ? "bg-warning text-dark" 
                      : appointment?.bookingStatus === "completed" ? "bg-success" 
                      : "bg-danger"
                    }`}
                  >
                    {appointment?.bookingStatus}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Update Status Section */}
          <div className="p-4 bg-light border-top">
            <h5 className="mb-3 fw-bold">Update Booking Status</h5>
            <div className="w-50">
              <InputSelect 
                value={appointmentStatus} 
                setValue={setAppointmentStatus} 
                options={["pending", "completed", "cancel"]} 
              />
              <button 
                className="btn btn-primary mt-3 fw-bold shadow-sm" 
                onClick={handleUpdateStatus}
              >
                UPDATE STATUS
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
};

export default AppointmentDetails;