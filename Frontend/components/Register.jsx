// src/Register.jsx
import React, { useState, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import Alert from 'react-bootstrap/Alert';
import './styles/Register.css'
import Footer from './FooterComponent.jsx';

const Register = () => {

    const PasCheckElement = useRef(null);
    const checkPasswordStrength = (pw) => {
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[a-z]/.test(pw)) score++;
        if (/\d/.test(pw)) score++;
        if (/[!@#$%^&*()]/.test(pw)) score++;
    
        if (score === 5) return 'Strong';
        if (score >= 3) return 'Medium';
        return 'Weak';
    };

    const location = useLocation();
    const message = location.state?.message;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName:'',
        email: '',
        password: ''
    });

    const { register } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        PasCheckElement.current.style.display= "none"
        const checkedstrength = checkPasswordStrength(formData.password)
        if (checkedstrength=='Strong'){
            register(formData.firstName, formData.lastName, formData.email, formData.password);
        } else {
            PasCheckElement.current.innerHTML="Weak Password!! It must be at least 8 characters long and it should include uppercase letters, lowercase letters, numbers and characters."
            PasCheckElement.current.style.display= "block"
        }
        
    };

    return (
        <>
            <div>
            <div class="container pt-5">
                <div class="row justify-content-md-center">
                <div class="col-12 col-md-11 col-lg-8 col-xl-7 col-xxl-6">
                    <div class="bg-light p-md-5 rounded shadow-sm">
                    <div class="row">
                        <div class="col-12">
                            <div class="text-center mb-5">
                            <h5>Registration Form</h5>
                        </div>
                        </div>
                    </div>

                    {message && <h5 className='text-info'>{message}</h5>}
                    <Alert ref={PasCheckElement} variant="primary" style={{color:'black', backgroundColor: "#e7fffe", display:'none'}}>
                    </Alert>

                    <form onSubmit={handleSubmit}>
                        <div class="row gy-3 gy-md-4 overflow-hidden">

                        <div class="col-12">
                            <label for="firstName" class="form-label">First Name <span class="text-danger">*</span></label>
                            <div class="input-group">
                            <span class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-vcard" viewBox="0 0 16 16">
                                <path d="M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m4-2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5M9 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 9 8m1 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5" />
                                <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8.96c.026-.163.04-.33.04-.5C9 10.567 7.21 9 5 9c-2.086 0-3.8 1.398-3.984 3.181A1.006 1.006 0 0 1 1 12z" />
                                </svg>
                            </span>
                            <input type="text" class="form-control" onChange={handleChange} name="firstName" id="firstName" required/>
                            </div>
                        </div>

                        <div class="col-12">
                            <label for="lastName" class="form-label">Last Name <span class="text-danger">*</span></label>
                            <div class="input-group">
                            <span class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-card-checklist" viewBox="0 0 16 16">
                                <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z" />
                                <path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0M7 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0" />
                                </svg>
                            </span>
                            <input type="text" class="form-control" onChange={handleChange} name="lastName" id="lastName" required/>
                            </div>
                        </div>

                        <div class="col-12">
                            <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
                            <div class="input-group">
                            <span class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope" viewBox="0 0 16 16">
                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                                </svg>
                            </span>
                            <input type="email" class="form-control" onChange={handleChange} name="email" id="email" required/>
                            </div>
                        </div>

                        <div class="col-12">
                            <label for="password" class="form-label">Password <span class="text-danger">*</span></label>
                            <div class="input-group">
                            <span class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-key" viewBox="0 0 16 16">
                                <path d="M0 8a4 4 0 0 1 7.465-2H14a.5.5 0 0 1 .354.146l1.5 1.5a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0L13 9.207l-.646.647a.5.5 0 0 1-.708 0L11 9.207l-.646.647a.5.5 0 0 1-.708 0L9 9.207l-.646.647A.5.5 0 0 1 8 10h-.535A4 4 0 0 1 0 8zm4-3a3 3 0 1 0 2.712 4.285A.5.5 0 0 1 7.163 9h.63l.853-.854a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.793-.793-1-1h-6.63a.5.5 0 0 1-.451-.285A3 3 0 0 0 4 5z" />
                                <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                </svg>
                            </span>
                            <input type="password" class="form-control" onChange={handleChange} name="password" id="password" required/>
                            </div>
                        </div>

                        <div class="col-12">
                            <div class="d-grid">
                            <button class="btn btn-primary btn-lg" type="submit">Sign Up</button>
                            </div>
                        </div>
                        
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

export default Register;