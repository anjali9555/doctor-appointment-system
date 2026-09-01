import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getUserData } from "../../../redux/actions/authActions";

const NavMenu = () => {
  const dispatch = useDispatch();

  // 🔥 Naya Addition: Page refresh hone par user ka login data wapas laane ke liye
  useEffect(() => {
    dispatch(getUserData());
  }, [dispatch]);

  // Redux store se user ka status check kar rahe hain
  const { user } = useSelector((state) => state.auth);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white">
      <div className="container-fluid">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarTogglerDemo01"
          aria-controls="navbarTogglerDemo01"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
          
          {/* Main Links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about">About</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/doctors">Doctors</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/gallery">Gallery</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/contact">Contact</NavLink>
            </li>
          </ul>

          {/* Book Appointment Button */}
          <div className="d-flex me-4">
            <NavLink to="/doctors" className="btn btn-outline-success">
              Book A Appointment
            </NavLink>
          </div>

          {/* User Profile / Login Logic */}
          <ul className="navbar-nav mb-2 mb-lg-0">
            {user ? (
              <li className="nav-item">
                <NavLink className="nav-link fw-bold text-dark" to="/user/profile">
                  My Account
                </NavLink>
              </li>
            ) : (
              <li className="nav-item">
                <NavLink className="nav-link fw-bold text-dark" to="/login">
                  LOGIN
                </NavLink>
              </li>
            )}
          </ul>
          
        </div>
      </div>
    </nav>
  );
};

export default NavMenu;