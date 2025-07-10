// src/Login.jsx
import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import './styles/Login.css'
import Footer from './FooterComponent.jsx';

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
        <>

        <div id="login">
            <div className="container">
                <div id="login-row" className="row justify-content-center align-items-center">
                    <div id="login-column" className="col-md-6">
                        <div id="login-box" className="col-md-12">
                            <form id="login-form" className="form" onSubmit={handleSubmit}>
                            {message && <h5 className='text-info'>{message}</h5>}
                                <h3 className="text-center text-info">Login</h3>
                                <div className="form-group">
                                    <label for="email" className="text-info"><h6>Email:</h6></label><br/>
                                    <input type="email" onChange={handleChange} name="email" id="email" className="form-control"/>
                                </div>
                                <div className="form-group">
                                    <label for="password" className="text-info"><h6>Password:</h6></label><br/>
                                    <input type="password" onChange={handleChange} name="password" id="password" className="form-control"/>
                                </div>
                                <div className="form-group">
                                    <br/>
                                    <input type="submit" name="submit" className="btn btn-info btn-md" value="submit"/>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Footer/>

        </>
    );
};

export default Login;