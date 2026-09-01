import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Layout/Navbar/Navbar";
import Footer from "./components/Layout/Footer/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import GalleryPage from "./pages/Gallery/GalleryPage";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import AllDoctors from "./pages/Doctors/AllDoctors";
import Appointments from "./pages/Doctors/Appointments";
import UserProfile from "./pages/User/UserProfile";
import MyAppointments from "./pages/User/MyAppointments"; 
import AppointmentDetails from "./pages/User/AppointmentDetails";
import ResetPassword from "./pages/User/ResetPassword";// Ya MyAppointments

function App() {
  return (
    <>
      <Navbar />
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/doctors" element={<AllDoctors />} />
        <Route path="/doctors/:id" element={<Appointments />} />
        <Route path="/user/profile" element={<UserProfile />} />
        <Route path="/user/appointments" element={<MyAppointments />} />
<Route path="/user/appointments/:id" element={<AppointmentDetails />} />
<Route path="/user/reset-password/:id" element={<ResetPassword />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;