import React, {
  useReducer,
  useCallback,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api/axios";
import { showToast } from "../utils/toast";

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

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const redirectTo = useMemo(() => location.state?.from || "/", [location.state]);
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
      abortRef.current?.abort();
    };
  }, []);

  const isValid = useMemo(
    () => Boolean(form.email.trim()) && form.password.length > 0,
    [form.email, form.password]
  );

  const onEmail = useCallback(
    (event) => send({ type: "setEmail", payload: event.target.value }),
    []
  );

  const onPassword = useCallback(
    (event) => send({ type: "setPassword", payload: event.target.value }),
    []
  );

  const safeDispatchUser = useCallback(
    (payload) => {
      try {
        dispatch({ type: "auth/setUser", payload });
      } catch {
        // ignore
      }
    },
    [dispatch]
  );

  const submit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");

      if (!isValid) {
        setError("Please enter email and password.");
        return;
      }

      abortRef.current?.abort();
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
        if (mountedRef.current) navigate(redirectTo);
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Login failed";
        setError(message);
        showToast(message, "error");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [form.email, form.password, isValid, navigate, redirectTo, safeDispatchUser]
  );

  return (
    <div className="nm-shell py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-6 shadow-2xl shadow-black/10 sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
          Account
        </p>
        <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">Welcome Back</h1>
        <p className="mt-2 text-sm text-[var(--nm-muted)]">Sign in to continue shopping.</p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setGoogleLoading(true);
                try {
                  const { data } = await api.post("/api/auth/google", {
                    token: credentialResponse.credential,
                  });
                  localStorage.setItem("user", JSON.stringify(data));
                  safeDispatchUser(data);
                  showToast("Logged in with Google");
                  navigate(redirectTo);
                } catch (err) {
                  const message = err.response?.data?.message || "Google login failed";
                  setError(message);
                  showToast(message, "error");
                } finally {
                  setGoogleLoading(false);
                }
              }}
              onError={() => {
                showToast("Google login failed", "error");
              }}
            />
          </div>
          {googleLoading && (
            <p className="mt-2 text-center text-xs text-[var(--nm-muted)]">Completing Google sign-in...</p>
          )}
        </div>

        <div className="my-5 flex items-center gap-2">
          <div className="h-px flex-1 bg-[var(--nm-border)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">OR</span>
          <div className="h-px flex-1 bg-[var(--nm-border)]" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={form.email}
            onChange={onEmail}
            placeholder="Email"
            className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
          />

          <div className="relative">
            <input
              type={form.showPwd ? "text" : "password"}
              value={form.password}
              onChange={onPassword}
              placeholder="Password"
              className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 pr-20 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => send({ type: "toggleShow" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]"
            >
              {form.showPwd ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !isValid}
            className="nm-btn-primary mt-2 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--nm-muted)]">
          New here?{" "}
          <Link to="/register" className="font-semibold text-[var(--nm-accent-strong)] underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
