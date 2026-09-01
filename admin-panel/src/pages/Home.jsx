import React, { useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { getUserData } from "../redux/actions/authActions";
import { getStats } from "../redux/actions/userAction";

const Home = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUserData());
    dispatch(getStats());
  }, [dispatch]);

  const { user } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.user); // 🔥 Redux store se stats nikal rahe hain

  return (
    <Layout>
      <div className="d-flex flex-column my-3 border bg-light rounded-3 text-center p-3">
        <h1 className="pt-3">DASHBOARD</h1>
        <p>Doctor Appointment App</p>
        <p className="text-success">
          Welcome {user?.name} || Email : {user?.email}
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className="d-flex flex-wrap justify-content-around">
        {/* Total Users Card */}
        <div className="card m-3 bg-success text-white w-50 shadow-sm" style={{ minWidth: "250px" }}>
          <div className="card-body d-flex flex-column align-items-center p-4">
            <h1 className="fw-bold">{stats?.totalUsers || 0}</h1>
            <h4>Total Users</h4>
          </div>
        </div>

        {/* Total Doctors Card */}
        <div className="card m-3 bg-warning text-white w-50 shadow-sm" style={{ minWidth: "250px" }}>
          <div className="card-body d-flex flex-column align-items-center p-4">
            <h1 className="fw-bold">{stats?.totalDoctors || 0}</h1>
            <h4>Total Doctors</h4>
          </div>
        </div>

        {/* Total Earnings Card */}
        <div className="card m-3 bg-info text-white w-50 shadow-sm" style={{ minWidth: "250px" }}>
          <div className="card-body d-flex flex-column align-items-center p-4">
            <h1 className="fw-bold">₹ {stats?.earnings || 0}</h1>
            <h4>Total Earnings</h4>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;