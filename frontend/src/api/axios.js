import axios from "axios";
import { showToast } from "../utils/toast";
import { getApiOrigin } from "./base";

// Normalize env values so both https://domain.com and https://domain.com/api work.
const baseURL = getApiOrigin(import.meta.env.VITE_API_URL) || undefined;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem("user");
      } catch {}

      showToast("Session expired, please login again", "error");

      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }

    return Promise.reject(err);
  }
);

export default api;
