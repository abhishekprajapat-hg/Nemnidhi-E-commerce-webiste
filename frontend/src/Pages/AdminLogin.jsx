import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const emailRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    emailRef.current?.focus();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const isAdmin = parsed?.isAdmin || parsed?.user?.isAdmin;
      if (isAdmin) navigate("/admin", { replace: true });
    } catch {
      // ignore
    }
  }, [navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const safeEmail = String(email || "").trim();
    const safePassword = String(password || "").trim();
    if (!safeEmail || !safePassword) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", {
        email: safeEmail,
        password: safePassword,
      });

      const data = response?.data || {};
      const token = data.token || data?.user?.token || data?.accessToken || null;
      const isAdmin = Boolean(data.isAdmin || data?.user?.isAdmin || data?.is_admin);

      if (!token) throw new Error("Invalid login response");
      if (!isAdmin) throw new Error("Access denied: admin account required.");

      const payload = data?.user ? data : { ...data, user: data.user || null };
      localStorage.setItem("user", JSON.stringify(payload));

      if (mountedRef.current) {
        showToast("Welcome back, admin");
        navigate("/admin", { replace: true });
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Login failed";
      if (mountedRef.current) {
        setError(message);
        showToast(message, "error");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-6 shadow-2xl shadow-black/10 sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
          Admin
        </p>
        <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">Sign In</h1>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
              Email
            </span>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              placeholder="admin@domain.com"
              autoComplete="username"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              placeholder="********"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="nm-btn-primary mt-2 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
