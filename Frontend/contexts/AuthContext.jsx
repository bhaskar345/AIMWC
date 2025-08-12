import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, fetchUserProfile, registerUser, refreshUser } from '../api';

const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            const getUser = async () => {
                const user = await fetchUserProfile(token);
                if (user){
                    setUser(user);
                } else {
                    const tokendata = await refreshUser(localStorage.getItem("refresh"));
                    localStorage.setItem('token', tokendata.access);
                    setToken(localStorage.getItem('token'));
                    const user = await fetchUserProfile(token);
                    if (user){
                        setUser(user);
                    }
                }
            };
            getUser();
        }
    }, [token]);

    const login = async (email, password) => {
        const response = await loginUser({ email, password });

        console.log(response)

        if (response.message=="Invalid Credentials!!"){
            navigate('/login', { state: { message: 'Invalid Credentails!!' }})
        };
        if (response?.access) {
            setToken(response.access);
            localStorage.setItem('token', response.access);
            localStorage.setItem('refresh', response.refresh);
            const userProfile = await fetchUserProfile(response.access);
            setUser(userProfile);
            navigate('/chat');
        }
    };

    const register = async (firstName, lastName, email, password) => {
        try{
            const message = await registerUser({firstName, lastName, email, password });
            if (message==="User already exists"){
                console.log("response message", message)
                navigate('/register', { state: { message: 'User already exists.' } });
            } else{
                navigate('/login', { state: { message: 'Registred! Please Login now.' }});
            }
        }
        catch (err){
            console.log(err);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ token, setToken, user,setUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export {AuthProvider, AuthContext}