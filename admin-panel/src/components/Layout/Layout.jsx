import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Menus from "./Menus";

const Layout = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("appData");
      if (!stored) {
        toast.error("Please login to access admin panel");
        navigate("/");
        return;
      }
      const parsed = JSON.parse(stored);
      const user = parsed?.user;
      const isAdmin = user?.isAdmin === true || user?.role === "admin";
      if (!parsed?.token || !isAdmin) {
        toast.error("Access denied. Admin privileges required.");
        localStorage.removeItem("appData");
        navigate("/");
      }
    } catch {
      localStorage.removeItem("appData");
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar */}
      <Menus />

      {/* Main Content Area */}
      <div className="flex-grow-1 overflow-auto" style={{ maxHeight: "100vh" }}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
