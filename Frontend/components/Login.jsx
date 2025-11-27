import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import './styles/Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const { login } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        login(formData.email, formData.password);
    };

    const location = useLocation();
    const message = location.state?.message;

    return (
        <div className="login-page">
            <div className="login-card">
                <h2 className="login-title">Welcome Back</h2>
                {message && <p className="login-message">{message}</p>}
                <form onSubmit={handleSubmit} className="login-form">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                    />
                    <button type="submit" className="login-btn">Login</button>
                </form>
                <p className="signup-link">
                    Don't have an account? <a href="/register">Sign Up</a>
                </p>
            </div>
            <footer className="footer">
                <p>&copy; 2025 Bhaskar Singh Chauhan. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Login;
