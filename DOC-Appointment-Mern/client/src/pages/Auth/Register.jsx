import React, { useState, useEffect } from "react";
import "./Auth.css";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../../redux/actions/authActions";
import { reset } from "../../redux/slice/authSlice"; // Reset import karna mat bhoolna

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error, success } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return toast.error("Please Provide all fields");
    }
    dispatch(register({ name, email, password }));
  };

  useEffect(() => {
    if (success) {
      toast.success("Register successfully");
      navigate("/login");
      setName("");
      setEmail("");
      setPassword("");
      dispatch(reset());
    }
    if (error) {
      toast.error(error);
      dispatch(reset());
    }
  }, [dispatch, error, success, navigate]);

  return (
    <>
      <div className="auth-container">
        <div className="card">
          <h2>Create a account</h2>
          <p>please enter your details to register</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Register
            </button>
          </form>

        </div>
      </div>
    </>
  );
};

export default Register;