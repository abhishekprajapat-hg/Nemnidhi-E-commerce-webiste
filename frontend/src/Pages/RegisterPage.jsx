import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api/axios";
import { showToast } from "../utils/toast";

function passwordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, label: "Too short" };
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[\W_]/.test(password)) score += 1;
  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  return { score, label };
}

function strengthClass(score) {
  if (score <= 1) return "bg-red-500";
  if (score === 2) return "bg-amber-500";
  if (score === 3) return "bg-emerald-500";
  return "bg-green-600";
}

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const isFormValid = useMemo(
    () => Boolean(name.trim()) && isValidEmail(email) && password.length >= 6,
    [name, email, password]
  );

  const submit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");

      if (!isFormValid) {
        setError("Please fix validation errors.");
        return;
      }

      setLoading(true);
      try {
        await api.post("/api/auth/register", {
          name: name.trim(),
          email: email.trim(),
          password,
        });
        showToast("OTP sent to your email");
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Registration failed";
        setError(message);
        showToast(message, "error");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [email, isFormValid, name, navigate, password]
  );

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    try {
      const { data } = await api.post("/api/auth/google", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("user", JSON.stringify(data));
      dispatch({ type: "auth/setUser", payload: data });
      showToast("Account created with Google");
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Google signup failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="nm-shell py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-6 shadow-2xl shadow-black/10 sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
          Account
        </p>
        <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">Create Account</h1>
        <p className="mt-2 text-sm text-[var(--nm-muted)]">Join Nemnidhi and start exploring.</p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5">
          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => showToast("Google signup failed", "error")} />
          </div>
          {googleLoading && (
            <p className="mt-2 text-center text-xs text-[var(--nm-muted)]">Completing Google sign-up...</p>
          )}
        </div>

        <div className="my-5 flex items-center gap-2">
          <div className="h-px flex-1 bg-[var(--nm-border)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">OR</span>
          <div className="h-px flex-1 bg-[var(--nm-border)]" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
          />

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
          />

          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 pr-20 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPwd((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]"
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.1em] text-[var(--nm-muted)]">
              <span>Password Strength</span>
              <span>{strength.label}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--nm-border)]">
              <div
                className={`h-full transition-all ${strengthClass(strength.score)}`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="nm-btn-primary mt-2 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--nm-muted)]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[var(--nm-accent-strong)] underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
