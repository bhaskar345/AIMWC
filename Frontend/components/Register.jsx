// src/Register.jsx
import React, { useState, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext.jsx";
import Alert from "react-bootstrap/Alert";
import "./styles/Register.css";

const Register = () => {
  const PasCheckElement = useRef(null);

  const checkPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[!@#$%^&*()]/.test(pw)) score++;

    if (score === 5) return "Strong";
    if (score >= 3) return "Medium";
    return "Weak";
  };

  const location = useLocation();
  const message = location.state?.message;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const { register } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    PasCheckElement.current.style.display = "none";

    const strength = checkPasswordStrength(formData.password);

    if (strength === "Strong") {
      register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password
      );
    } else {
      PasCheckElement.current.innerHTML =
        "Weak Password! Must contain 8+ chars, uppercase, lowercase, number & symbol.";
      PasCheckElement.current.style.display = "block";
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-title">Create Your Account</h2>
        <p className="register-subtitle">
          Join us and start your journey today.
        </p>

        {message && <h5 className="text-info mt-2 mb-3">{message}</h5>}

        <Alert
          ref={PasCheckElement}
          variant="danger"
          className="password-alert"
          style={{ display: "none" }}
        />

        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group-modern">
            <input type="text" name="firstName" onChange={handleChange} required />
            <label>First Name</label>
          </div>

          <div className="input-group-modern">
            <input type="text" name="lastName" onChange={handleChange} required />
            <label>Last Name</label>
          </div>

          <div className="input-group-modern">
            <input type="email" name="email" onChange={handleChange} required />
            <label>Email</label>
          </div>

          <div className="input-group-modern">
            <input type="password" name="password" onChange={handleChange} required />
            <label>Password</label>
          </div>

          <button type="submit" className="register-btn">
            Sign Up
          </button>
        </form>
      </div>

      <footer className="footer-container">
        <p>&copy; 2025 Bhaskar Singh Chauhan. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Register;
