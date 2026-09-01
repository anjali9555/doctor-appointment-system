import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast"; // 🔥 Toast zaroori hai notifications ke liye
import { getAllAppointments, cancelStatus } from "../../redux/actions/authActions";
import { reset } from "../../redux/slice/authSlice"; // 🔥 Reset zaroori hai fake popups rokne ke liye

const MyAppointments = () => {
  const dispatch = useDispatch();

  // Redux state se appointments, error, success aur user nikal rahe hain
  const { appointments, error, success, user } = useSelector((state) => state.auth);

  // ==========================================
  // 1. Fetch Appointments (Blank Page Fix)
  // ==========================================
  useEffect(() => {
    // Redux se id lo, agar nahi hai toh localStorage se lo (Safety ke liye)
    if (user && user._id) {
      dispatch(getAllAppointments(user._id));
    } else {
      const localData = localStorage.getItem("appData");
      if (localData) {
        const appData = JSON.parse(localData);
        const id = appData?.user?._id;
        if (id) {
          dispatch(getAllAppointments(id));
        }
      }
    }
  }, [dispatch, user]);

  // ==========================================
  // 2. Handle Cancel Button Click
  // ==========================================
  const handleCancel = (id) => {
    dispatch(cancelStatus(id));
  };

  // ==========================================
  // 3. Handle Cancel Success/Error Popup
  // ==========================================
  useEffect(() => {
    if (success) {
      toast.success("Appointment Cancelled Successfully!");
      dispatch(reset()); // Purana success state clear karo
      window.location.reload(); // Tutorial ke mutabiq page reload karne ke liye
    }
    if (error) {
      toast.error(error);
      dispatch(reset());
    }
  }, [success, error, dispatch]);

  return (
    <div className="container mt-4">
      <h1>My All Appointments</h1>
      <table className="table table-bordered mt-3">
        <thead className="table-dark">
          <tr>
            <th>SNO</th>
            <th>Booking Date</th>
            <th>FEES</th>
            <th>Status</th>
            <th>Details</th>
            <th>Update Booking</th>
          </tr>
        </thead>
        <tbody>
          {appointments && appointments.length > 0 ? (
            appointments.map((a, i) => (
              <tr key={i + 1}>
                <td>{i + 1}</td>
                <td>{a?.slotDate || "N/A"}</td>
                <td>{a?.amount || "N/A"}</td>
                <td>
                  <span className={`badge ${a?.status === 'pending' ? 'bg-warning' : 'bg-success'}`}>
                    {a?.status || "N/A"}
                  </span>
                </td>
                <td>
                  <Link to={`/user/appointments/${a?._id}`} className="btn btn-sm btn-info text-white">
                    Details
                  </Link>
                </td>
                <td>
                  {/* 🔥 Cancel Button Logic added here */}
                  {a?.status === "pending" ? (
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleCancel(a?._id)}
                    >
                      Cancel
                    </button>
                  ) : (
                    "NA"
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center text-muted">
                No appointments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MyAppointments;