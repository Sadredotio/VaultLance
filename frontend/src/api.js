import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Automatically add Token to every request if we have it
API.interceptors.request.use((req) => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      if (user && user.token) {
        req.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
  }
  return req;
}, (error) => Promise.reject(error));

// Handle response errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;