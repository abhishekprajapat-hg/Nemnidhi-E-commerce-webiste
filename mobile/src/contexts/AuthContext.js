import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, {
  getApiErrorMessage,
  registerUnauthorizedHandler,
  setApiToken,
} from "../api/client";
import { useToast } from "./ToastContext";

const USER_STORAGE_KEY = "nemnidhi:user";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const persistUser = useCallback(async (nextUser) => {
    setUser(nextUser);
    setApiToken(nextUser?.token || "");

    if (nextUser) {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    }

    return nextUser;
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (!raw || !active) return;

        const parsed = JSON.parse(raw);
        if (!parsed) return;

        setUser(parsed);
        setApiToken(parsed?.token || "");
      } catch {
        // noop
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const clearSession = useCallback(
    async (withNotice = false) => {
      await persistUser(null);
      if (withNotice) {
        showToast("Session expired. Please sign in again.", "error");
      }
    },
    [persistUser, showToast]
  );

  useEffect(() => {
    registerUnauthorizedHandler(() => clearSession(true));
    return () => registerUnauthorizedHandler(null);
  }, [clearSession]);

  const mergeUserSession = useCallback(
    async (patch) => {
      const current = userRef.current || {};
      const nextPatch = typeof patch === "function" ? patch(current) : patch;
      const nextUser = { ...current, ...(nextPatch || {}) };
      return persistUser(nextUser);
    },
    [persistUser]
  );

  const login = useCallback(
    async ({ email, password }) => {
      const { data } = await api.post("/api/auth/login", { email, password });
      await persistUser(data);
      return data;
    },
    [persistUser]
  );

  const register = useCallback(async ({ name, email, password }) => {
    const { data } = await api.post("/api/auth/register", {
      name,
      email,
      password,
    });
    return data;
  }, []);

  const resendOtp = useCallback(async (email) => {
    const { data } = await api.post("/api/auth/resend-otp", { email });
    return data;
  }, []);

  const verifyOtp = useCallback(
    async ({ email, otp }) => {
      const { data } = await api.post("/api/auth/verify-otp", { email, otp });
      setApiToken(data?.token || "");

      const profileResponse = await api.get("/api/auth/profile");
      const nextUser = {
        ...(profileResponse.data || {}),
        email,
        token: data?.token || "",
      };

      await persistUser(nextUser);
      return nextUser;
    },
    [persistUser]
  );

  const refreshProfile = useCallback(async () => {
    const token = userRef.current?.token;
    if (!token) return null;

    const { data } = await api.get("/api/auth/profile");
    const nextUser = {
      ...(userRef.current || {}),
      ...(data || {}),
      token,
    };

    await persistUser(nextUser);
    return nextUser;
  }, [persistUser]);

  const logout = useCallback(async () => {
    await persistUser(null);
  }, [persistUser]);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user?.token),
      login,
      register,
      resendOtp,
      verifyOtp,
      refreshProfile,
      mergeUserSession,
      setUserSession: persistUser,
      logout,
      getErrorMessage: getApiErrorMessage,
    }),
    [
      authLoading,
      login,
      logout,
      mergeUserSession,
      persistUser,
      refreshProfile,
      register,
      resendOtp,
      user,
      verifyOtp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
