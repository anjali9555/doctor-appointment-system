import React, { useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getAllDoctors } from "../../redux/actions/doctorActions";
import { reset } from "../../redux/slice/doctorSlice"; // 👈 YEH IMPORT ZAROORI THA

const AllDoctors = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { doctors, loading, error } = useSelector((state) => state.doctor);

  useEffect(() => {
    dispatch(getAllDoctors());
  }, [dispatch]);

  return (
    <Layout>
      {/* Header and Add Doctor Button */}
      <div className="d-flex p-3 justify-content-between bg-light mt-3">
        <h1>All Doctors List</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            dispatch(reset()); // 👈 FORM KHULNE SE PEHLE REDUX KA KACHRA SAAF KAREGA
            navigate("/add-doctor");
          }}
        >
          + ADD DOCTOR
        </button>
      </div>

      {/* Doctors List Table */}
      <div className="table-responsive">
        <table className="table mt-3 text-center align-middle">
          <thead>
            <tr>
              <th>SNO</th>
              <th>IMAGE</th>
              <th>NAME</th>
              <th>SPECIALITY</th>
              <th>FEES</th>
              <th>AVAILABLE</th>
              <th>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {doctors && doctors.length > 0 ? (
              doctors.map((d, i) => (
                <tr key={i + 1}>
                  <td>{i + 1}</td>
                  <td>
                    <img
                      src={d?.image ? `data:image/jpeg;base64,${d.image}` : "https://via.placeholder.com/50"} 
  alt="docimage"
                      className="bg-info rounded"
                      height={50}
                      width={50}
                      style={{ objectFit: "cover" }}
                    />
                  </td>
                  <td>{d?.name}</td>
                  <td>{d?.speciality}</td>
                  <td>{d?.fees}</td>
                  <td>
                    {d?.available ? (
                      <span className="badge bg-success">Available</span>
                    ) : (
                      <span className="badge bg-danger">Not Available</span>
                    )}
                  </td>
                  <td>
                    <Link
                      to={`/doctor-details/${d?._id}`}
                      className="btn btn-sm btn-outline-info"
                    >
                      MORE DETAILS
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-danger">
                  No Doctors Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AllDoctors;