import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const loginUser = async (credentials) => {
    try {
        const params = new URLSearchParams();
        for (const key in credentials) {
            params.append(key, credentials[key]);
        }

        const response = await axios.post(
            `${API_URL}/auth/login/`,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register/`, userData);
        return response.data.message
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
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
        // console.error("Fetch user profile error:", error);
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
        console.error("Refresh user error:", error);
        throw error;
    };
};

const LogEntry = async (data, token) =>{
    try{
        const response = await axios.post(`${API_URL}/journal/add/`, data, {headers: {Authorization: `Bearer ${token}`}});
        return response.data
    } catch(error){
        throw error;
    }
}

export {API_URL, refreshUser, loginUser, registerUser, fetchUserProfile, LogEntry };