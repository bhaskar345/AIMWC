import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/Login.css'
import Footer from './FooterComponent';

const ResetPassword = () => {
    const { token } = useParams(); // Get the token from the URL
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Optionally, you can validate the token with the backend here if needed
        // before allowing the user to enter a new password.
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
        }
        setError(''); // Clear previous errors

        try {
        const response = await axios.post('YOUR_DRF_API_URL/auth/users/reset_password_confirm/', { // Adjust API endpoint
            token: token,
            new_password: password,
        });
        setMessage('Password reset successfully!');
        setTimeout(() => {
            navigate('/login'); // Redirect to login page after successful reset
        }, 2000);
        } catch (err) {
        setError('Failed to reset password. Please try again.');
        console.error(err);
        }
    };

    return (
        <>
        <div id="login">
            <div className="container">
                <div id="login-row" className="row justify-content-center align-items-center">
                    <div id="login-column" className="col-md-6">
                        <div id="login-box" className="col-md-12">
                            <form id="login-form" className="form" onSubmit={handleSubmit}>
                            {message && <h5 className='text-info'>{message}</h5>}
                                <h3 className="text-center text-info">Reset Password</h3>
                                <div className="form-group">
                                    <label for="password" className="text-info"><h6>Password:</h6></label><br/>
                                    <input type="text" onChange={(e) => setPassword(e.target.value)} name="password" id="password" className="form-control"/>
                                </div>
                                <div className="form-group">
                                    <label for="confirm_password" className="text-info"><h6>Confirm Password:</h6></label><br/>
                                    <input type="password" onChange={(e) => setConfirmPassword(e.target.value)} name="confirm-password" id="confirm-password" className="form-control"/>
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
    )
}
export default ResetPassword;