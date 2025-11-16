import axios from 'axios';

// Determine API base URL based on environment
const getBaseURL = () => {
    // In production (Vercel), use the production backend URL
    if (process.env.NODE_ENV === 'production') {
        return process.env.REACT_APP_API_URL || 'https://society-hub.onrender.com';
    }
    // In development, use localhost
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Interceptor to add JWT token and handle Content-Type
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Only set Content-Type for non-FormData requests
        // FormData will automatically set Content-Type: multipart/form-data
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }
        
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default api;
