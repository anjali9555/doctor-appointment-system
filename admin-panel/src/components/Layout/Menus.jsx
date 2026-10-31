import React from "react";
import toast from "react-hot-toast";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  Calendar,
  MessageSquare,
  BookOpen,
  LogOut,
  HeartPulse,
} from "lucide-react";

const Menus = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("appData");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", path: "/home", icon: <LayoutDashboard size={18} /> },
    { label: "Appointments", path: "/all-appointments", icon: <Calendar size={18} /> },
    { label: "Doctors", path: "/all-doctors", icon: <Stethoscope size={18} /> },
    { label: "Add Doctor", path: "/add-doctor", icon: <UserPlus size={18} /> },
    { label: "Patients", path: "/all-users", icon: <Users size={18} /> },
    { label: "Enquiries", path: "/messages", icon: <MessageSquare size={18} /> },
    { label: "AI Knowledge Base", path: "/knowledge-base", icon: <BookOpen size={18} /> },
  ];

  return (
    <div
      className="d-flex flex-column bg-white border-end shadow-sm"
      style={{ width: "240px", minHeight: "100vh", position: "sticky", top: 0 }}
    >
      {/* Brand Header */}
      <div className="p-3 border-bottom d-flex align-items-center gap-2">
        <div className="p-2 bg-primary text-white rounded-3">
          <HeartPulse size={22} />
        </div>
        <div>
          <h5 className="mb-0 fw-bold text-dark">MediCare</h5>
          <small className="text-muted" style={{ fontSize: "11px" }}>
            Admin Management
          </small>
        </div>
      </div>

      {/* Nav Menu Items */}
      <nav className="p-3 flex-grow-1">
        <div className="d-flex flex-column gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none fw-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-secondary hover-bg-light"
                }`
              }
            >
              {item.icon}
              <span style={{ fontSize: "14px" }}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout Action */}
      <div className="p-3 border-top mt-auto">
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 rounded-pill d-flex align-items-center justify-content-center gap-2 btn-sm py-2"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Menus;
