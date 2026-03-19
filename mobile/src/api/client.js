import Constants from "expo-constants";
import { Platform } from "react-native";
import axios from "axios";

function trimTrailingSlash(value = "") {
  return String(value || "").replace(/\/+$/, "");
}

function normalizeLoopbackUrl(value = "") {
  const trimmed = trimTrailingSlash(value);
  if (Platform.OS !== "android") return trimmed;

  return trimmed.replace(
    /^([a-z]+:\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(?=[:/]|$)/i,
    "$110.0.2.2"
  );
}

function extractHost(value = "") {
  return String(value || "")
    .trim()
    .replace(/^[a-z]+:\/\//i, "")
    .split("/")[0]
    .split(":")[0];
}

function guessApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return normalizeLoopbackUrl(envUrl);

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    "";

  const host = extractHost(hostUri);
  if (host) return `http://${host}:5000`;

  return Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
}

export const API_BASE_URL = guessApiBaseUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");

let authToken = "";
let unauthorizedHandler = null;

export const setApiToken = (token) => {
  authToken = token ? String(token) : "";
};

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
};

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong"
) => {
  if (!error?.response && error?.message === "Network Error") {
    return `Cannot reach the server at ${API_BASE_URL}. Check that the backend is running and that your phone can access that address.`;
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

export const toAbsoluteAssetUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (raw.startsWith("data:")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${API_ORIGIN}${raw}`;

  return `${API_ORIGIN}/${raw.replace(/^\.?\//, "")}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  nextConfig.headers = nextConfig.headers || {};

  if (authToken) {
    nextConfig.headers.Authorization = `Bearer ${authToken}`;
  }

  return nextConfig;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && unauthorizedHandler) {
      try {
        await unauthorizedHandler(error);
      } catch {
        // noop
      }
    }

    return Promise.reject(error);
  }
);

export default api;
