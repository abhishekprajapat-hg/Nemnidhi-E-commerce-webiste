import React, {
  useReducer,
  useCallback,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { showToast } from "../utils/toast";
import { GoogleLogin } from "@react-oauth/google";

/* ================= REDUCER ================= */

const initialForm = {
  email: "",
  password: "",
  showPwd: false,
};

function formReducer(state, action) {
  switch (action.type) {
    case "setEmail":
      return { ...state, email: action.payload };
    case "setPassword":
      return { ...state, password: action.payload };
    case "toggleShow":
      return { ...state, showPwd: !state.showPwd };
    default:
      return state;
  }
}

/* ================= COMPONENT ================= */

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const redirectTo = useMemo(
    () => location.state?.from || "/",
    [location.state]
  );

  const [form, send] = useReducer(formReducer, initialForm);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const isValid = useMemo(
    () => form.email.trim() && form.password.length >= 1,
    [form.email, form.password]
  );

  const onEmail = useCallback(
    (e) => send({ type: "setEmail", payload: e.target.value }),
    []
  );

  const onPassword = useCallback(
    (e) => send({ type: "setPassword", payload: e.target.value }),
    []
  );

  const safeDispatchUser = useCallback(
    (payload) => {
      try {
        dispatch({ type: "auth/setUser", payload });
      } catch {}
    },
    [dispatch]
  );

  /* ================= EMAIL LOGIN ================= */

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (!isValid) {
        setError("Please enter email and password.");
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const { data } = await api.post(
          "/api/auth/login",
          { email: form.email.trim(), password: form.password },
          { signal: controller.signal }
        );

        localStorage.setItem("user", JSON.stringify(data));
        safeDispatchUser(data);
        showToast("Welcome back");

        mountedRef.current && navigate(redirectTo);
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || "Login failed";
        setError(msg);
        showToast(msg, "error");
      } finally {
        mountedRef.current && setLoading(false);
      }
    },
    [form.email, form.password, isValid, navigate, redirectTo, safeDispatchUser]
  );

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-semibold mb-1 dark:text-white">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Sign in to continue
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        {/* ✅ GOOGLE LOGIN (ID TOKEN) */}
        <div className="mb-4 flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setGoogleLoading(true);
              try {
                const { data } = await api.post("/api/auth/google", {
                  token: credentialResponse.credential, // ✅ ID TOKEN
                });

                localStorage.setItem("user", JSON.stringify(data));
                safeDispatchUser(data);
                showToast("Logged in with Google");
                navigate(redirectTo);
              } catch (err) {
                const msg =
                  err.response?.data?.message ||
                  "Google login failed";
                setError(msg);
                showToast(msg, "error");
              } finally {
                setGoogleLoading(false);
              }
            }}
            onError={() => {
              showToast("Google login failed", "error");
            }}
          />
        </div>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
        </div>

        {/* EMAIL LOGIN */}
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            value={form.email}
            onChange={onEmail}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border dark:border-zinc-600"
          />

          <input
            type="password"
            value={form.password}
            onChange={onPassword}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border dark:border-zinc-600"
          />

          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full py-3 rounded-lg bg-black text-white dark:bg-yellow-400 dark:text-black"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          New here?{" "}
          <Link to="/register" className="underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
