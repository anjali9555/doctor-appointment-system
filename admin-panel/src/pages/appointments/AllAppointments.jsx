import React, { useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllAppointments } from "../../redux/actions/appointmentAction";

const AllAppointments = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllAppointments());
  }, [dispatch]);

  const { appointments } = useSelector((state) => state.appointments);

  return (
    <Layout>
      <div className="w-100 bg-white m-0 p-4 shadow-sm" style={{ minHeight: "100vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h2 className="m-0 text-dark fw-bold">All Appointments</h2>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th>S.NO</th>
                <th>ID</th>
                <th>DATE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {appointments?.map((a, i) => (
                <tr key={i + 1}>
                  <td className="fw-bold">{i + 1}</td>
                  <td>{a?._id}</td>
                  {/* Tutorial me a?.slotDate ya bookingDate ho sakta hai, backend ke hisaab se check kar lijiye */}
                  <td>{a?.bookingDate || a?.slotDate}</td>
                  <td>₹ {a?.amount}</td>
                  <td>
                    <span 
                      className={`badge px-3 py-2 ${
                        a?.bookingStatus === "pending" ? "bg-warning text-dark" 
                        : a?.bookingStatus === "completed" ? "bg-success" 
                        : "bg-danger"
                      }`}
                    >
                      {a?.bookingStatus || a?.status}
                    </span>
                  </td>
                  <td>
                    <Link 
                      to={`/appointment-details/${a?._id}`} 
                      className="btn btn-sm btn-info fw-bold text-white shadow-sm"
                    >
                      More Details
                    </Link>
                  </td>
                </tr>
              ))}
              
              {/* Agar appointments khali hon */}
              {appointments?.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted p-4">
                    No Appointments Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AllAppointments;