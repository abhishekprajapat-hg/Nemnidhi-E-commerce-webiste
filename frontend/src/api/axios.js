// src/api/axios.js
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch (e) {}
  return config;
});
export default api;
