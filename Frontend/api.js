import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const loginUser = async (credentials) => {
    try {
        const response = await axios.post(
            `${API_URL}/auth/login/`,
            credentials
        );
        return response.data;
    } catch (error) {
        if (error.response.statusText=="Unauthorized"){
            return error.response.data
        };
    }
};

const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register/`, userData);
        return response.data.message
    } catch (error) {
        if (error.response.statusText=="Unauthorized"){
            return error.response.data.message
        };
    }
};

const fetchUserProfile = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/auth/me/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response.statusText=="Unauthorized"){
            return null
        };
    }
};

const refreshUser = async (refresh) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login/refresh/`, {"refresh":refresh});
        return response.data
    } catch (error) {
        if (error.response.statusText=="Unauthorized"){
            return error.response.data.message
        };
        throw error;
    };
};

const LogEntry = async (data, token) =>{
    try{
        const response = await axios.post(`${API_URL}/journal/add/`, data, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });
        return response.data
    } catch(error){
        throw error;
    }
}

export {API_URL, refreshUser, loginUser, registerUser, fetchUserProfile, LogEntry };