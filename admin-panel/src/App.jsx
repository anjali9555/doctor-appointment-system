import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/user/Login";
import Home from "./pages/Home";
import Allusers from "./pages/user/AllUsers";
import UserDetails from "./pages/user/UserDetails";
import AllDoctors from "./pages/doctors/AllDoctors";
import AddDoctor from './pages/doctors/AddDoctor';
import DoctorDetails from "./pages/doctors/DoctorDetails";
import AllAppointments from "./pages/appointments/AllAppointments";
import AppointmentDetails from "./pages/appointments/AppointmentDetails";
import "./App.css";

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/all-users" element={<Allusers />} />
        <Route path="/user-details/:id" element={<UserDetails />} /> {/* Yahan /> add kar diya hai */}
        <Route path="/all-doctors" element={<AllDoctors />} />
        <Route path="/add-doctor" element={<AddDoctor />} />
        <Route path="/doctor-details/:id" element={<DoctorDetails />} />
        <Route path="/all-appointments" element={<AllAppointments />} />
        <Route path="/appointment-details/:id" element={<AppointmentDetails />} />
      </Routes>
    </>
  );
}

export default App;
