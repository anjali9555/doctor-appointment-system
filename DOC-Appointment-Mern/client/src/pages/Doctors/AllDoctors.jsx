import React, { useEffect } from "react";
import "./AllDoctors.css";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { getAllDoctors } from "../../redux/actions/doctorActions";

const AllDoctors = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllDoctors());
  }, [dispatch]);

  const { doctors } = useSelector((state) => state.doctor);

  return (
    <>
      <div className="container doc-container">
        <h4 className="text-center text-success mt-3">
          Select a Doctor and book your appointment online now!
        </h4>
        <div className="d-flex flex-wrap">
          {doctors?.map((d) => (
            <div className="card m-4" key={d._id} style={{ width: "15rem" }}>
              <NavLink to={`/doctors/${d._id}`}>
             <img
  src={`data:image/jpeg;base64,${d?.image}`}
  alt="picture"
  style={{ width: "150px", height: "150px", objectFit: "cover" }}
  className="mx-auto d-block mt-3 mb-2 square shadow-sm"
/>
                <div className="card-body">
                  <h6>{d.name}</h6>
                  <p>{d.degree}</p>
                </div>
                <div className="card-footer">
                  <p>
                    {" "}
                    <i className={d.icon}></i> {d.speciality}
                  </p>
                </div>
              </NavLink>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AllDoctors;