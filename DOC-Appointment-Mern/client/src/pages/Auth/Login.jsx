import React, { useState, useEffect } from "react";
import "./Auth.css"; // Make sure css is imported
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../redux/actions/authActions";
import { reset } from "../../redux/slice/authSlice"; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state se error aur success nikal rahe hain
  const { error, success } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please Provide email or password");
    }
    dispatch(login({ email, password }));
  };

  useEffect(() => {
    if (success) {
      toast.success("login successfully");
      navigate("/doctors"); // Login ke baad doctors page par redirect
      setEmail("");
      setPassword("");
      dispatch(reset()); // 🔥 YEH LINE ADD KI HAI (Fake popup rokne ke liye)
    }
    if (error) {
      toast.error(error);
      dispatch(reset()); // Error aane par state reset kar do
    }
  }, [dispatch, error, success, navigate]);

  return (
    <>
      <div className="auth-container">
        <div className="card">
          <h2>Login Here</h2>
          <p>Please enter your details to login</p>
          
          <form onSubmit={handleSubmit}>
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
              Login
            </button>
          </form>
          
          <div className="mt-3 text-center">
            <span>Don't have an account? </span>
            <NavLink to="/register">Register</NavLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;