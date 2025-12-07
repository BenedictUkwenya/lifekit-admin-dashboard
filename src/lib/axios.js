import axios from 'axios';

// Change this URL to your running backend URL
//const BASE_URL = 'http://localhost:3000'; 
const BASE_URL = 'https://lifekit-api.onrender.com';
const api = axios.create({
  baseURL: BASE_URL,
});

// 1. REQUEST: Attach Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// 2. RESPONSE: Handle Auth Errors (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - Force Logout
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;