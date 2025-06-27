import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500/api/v1',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    // Try to get token from cookies first, then localStorage
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // Only clear tokens on explicit authentication failures
    if (error.response && error.response.status === 401) {
        const token = Cookies.get('token') || localStorage.getItem('token');
        const errorMessage = error.response.data?.message?.toLowerCase() || '';
        
        // Only clear tokens if the error explicitly indicates invalid/expired token
        const isTokenError = errorMessage.includes('token') && 
                            (errorMessage.includes('invalid') || 
                             errorMessage.includes('expired') || 
                             errorMessage.includes('malformed'));
        
        if (token && isTokenError && window.location.pathname !== '/') {
            // Clear invalid tokens and redirect
            Cookies.remove('token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    }
    return Promise.reject(error);
});

export default api;