import React, { useReducer, useCallback, useRef, useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { showToast } from "../utils/toast";

/**
 * Optimized LoginPage
 * - useReducer for form fields (fewer re-renders)
 * - useCallback handlers
 * - AbortController + mountedRef for safe async
 * - simple validation to avoid unnecessary requests
 */

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
    case "reset":
      return initialForm;
    default:
      return state;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const redirectTo = useMemo(() => location.state?.from || "/", [location.state]);

  const [form, send] = useReducer(formReducer, initialForm);
  const [loading, setLoading] = useState(false);
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

  // basic inline validation
  const isValid = useMemo(() => {
    return form.email.trim() && form.password.length >= 1;
  }, [form.email, form.password]);

  // handlers (stable)
  const onEmail = useCallback((e) => {
    send({ type: "setEmail", payload: e.target.value });
  }, []);

  const onPassword = useCallback((e) => {
    send({ type: "setPassword", payload: e.target.value });
  }, []);

  const onToggleShow = useCallback(() => {
    send({ type: "toggleShow" });
  }, []);

  // safe redux dispatch wrapper
  const safeDispatchUser = useCallback(
    (payload) => {
      try {
        dispatch({ type: "auth/setUser", payload });
      } catch {
        try {
          dispatch({ type: "auth/logout" }); // fallback no-op
        } catch {}
      }
    },
    [dispatch]
  );

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      // avoid network call if form invalid
      if (!isValid) {
        setError("Please enter email and password.");
        return;
      }

      // abort previous request if any
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const { data } = await api.post(
          "/api/auth/login",
          { email: form.email.trim(), password: form.password },
          { signal: controller.signal }
        );

        // batch localStorage + redux (fast perceived UX)
        try {
          localStorage.setItem("user", JSON.stringify(data));
        } catch {}

        safeDispatchUser(data);

        showToast("Welcome back");

        // navigate after storing user
        if (mountedRef.current) navigate(redirectTo);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          // aborted — ignore
        } else {
          const msg = err.response?.data?.message || err.message || "Login failed";
          setError(msg);
          showToast(msg, "error");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [form.email, form.password, isValid, navigate, redirectTo, safeDispatchUser]
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Brand / Marketing */}
        <div className="hidden md:flex flex-col justify-center gap-6 pl-6">
          <div className="text-4xl font-extrabold tracking-tight dark:text-white">NEMNIDHI</div>

          <p className="text-gray-600 dark:text-gray-300 max-w-md">
            Discover elegance woven in traditional fabrics. Sign in to manage addresses, track orders, and save favorites.
          </p>

          <div className="mt-6 flex gap-3">
            <div className="px-3 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
              Handloom Quality
            </div>
            <div className="px-3 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
              Track your journey
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            New here? <Link to="/register" className="text-indigo-600 dark:text-yellow-400 underline">Create an account</Link>
          </div>
        </div>

        {/* Right: Clean Login form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-lg font-semibold dark:text-white">Welcome back</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Sign in to continue</div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-2xl font-extrabold font-serif">NEMNIDHI</div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            {/* Email Input */}
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={onEmail}
                placeholder="you@example.com"
                className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-yellow-400"
                autoFocus
                autoComplete="email"
                inputMode="email"
              />
            </label>

            {/* Password Input */}
            <label className="block text-sm relative">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Password</span>
              <input
                type={form.showPwd ? "text" : "password"}
                value={form.password}
                onChange={onPassword}
                placeholder="••••••••"
                className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-yellow-400"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={onToggleShow}
                className="absolute right-3 top-9 text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                aria-pressed={form.showPwd}
              >
                {form.showPwd ? "Hide" : "Show"}
              </button>
            </label>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-indigo-600 dark:accent-yellow-400" /> Remember me
              </label>
              <Link to="/forgot" className="text-indigo-600 dark:text-yellow-400 hover:underline">Forgot password?</Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                loading || !isValid
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300"
              }`}
              aria-disabled={loading || !isValid}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              New here? <Link to="/register" className="text-indigo-600 dark:text-yellow-400 underline">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
