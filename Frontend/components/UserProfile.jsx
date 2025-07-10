// src/UserProfile.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { Navigate } from 'react-router-dom';


const UserProfile = () => {
    const { user, logout } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace={true} />;
    }

    return (
        <>
        <div className='py-2'>
            <div className="card mw-10 container py-2">
                <h2>User Profile</h2>
                <div className="card-body">
                    <p className="card-text">
                        <p>Username: {user.username}</p>
                        <p>Email: {user.email}</p>
                        <button onClick={logout}>Logout</button>
                    </p>
                </div>
            </div>
        </div>
        </>
    );
};

export default UserProfile;