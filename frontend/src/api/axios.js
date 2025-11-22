import axios from "axios";
import { showToast } from "../utils/toast";

// ⭐ Use Vite env (process.env works only in CRA)
const baseURL = import.meta.env.VITE_API_URL || "/";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // If you use cookies, enable this:
  // withCredentials: true,
});

// ⭐ Add token automatically
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const usr = JSON.parse(raw);
      const token = usr?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});

// ⭐ Global 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try { localStorage.removeItem("user"); } catch {}
      showToast("Session expired — please login again", "error");

      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
    return Promise.reject(err);
  }
);

export default api;
