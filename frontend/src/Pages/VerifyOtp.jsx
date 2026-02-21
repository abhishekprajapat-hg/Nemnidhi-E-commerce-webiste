import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { showToast } from "../utils/toast";

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const email = params.get("email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const mountedRef = useRef(true);
  const inputRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    inputRef.current?.focus();
    return () => {
      mountedRef.current = false;
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldown]);

  const verifyOtp = async (code) => {
    setError("");

    if (!/^\d{6}$/.test(code)) {
      const message = "Please enter a valid 6-digit OTP";
      setError(message);
      showToast(message, "error");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/verify-otp", {
        email,
        otp: code,
      });

      const userData = {
        email,
        token: data.token,
        emailVerified: true,
      };

      try {
        localStorage.setItem("user", JSON.stringify(userData));
      } catch {
        // ignore
      }

      try {
        dispatch({ type: "auth/setUser", payload: userData });
      } catch {
        // ignore
      }

      showToast("Email verified successfully");
      if (mountedRef.current) navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || err.message || "OTP verification failed";
      setError(message);
      showToast(message, "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleOtpChange = (event) => {
    const cleaned = (event.target.value || "").replace(/\D/g, "").slice(0, 6);
    setOtp(cleaned);
    setError("");

    if (cleaned.length === 6 && !loading) {
      setTimeout(() => {
        if (mountedRef.current && cleaned.length === 6) verifyOtp(cleaned);
      }, 150);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await verifyOtp(otp);
  };

  const handleResend = async () => {
    if (!email) {
      setError("Missing email address");
      return;
    }
    if (cooldown > 0) return;

    setResending(true);
    setError("");
    try {
      await api.post("/api/auth/resend-otp", { email });
      showToast("OTP sent again");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to resend OTP";
      setError(message);
      showToast(message, "error");
    } finally {
      if (mountedRef.current) setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="nm-shell py-16 text-center text-red-600">
        Invalid request. Email missing.
      </div>
    );
  }

  return (
    <div className="nm-shell py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-6 shadow-2xl shadow-black/10 sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
          Verification
        </p>
        <h1 className="nm-display nm-auth-title mt-2 font-semibold">Verify Email</h1>
        <p className="mt-2 text-sm text-[var(--nm-muted)]">
          OTP sent to <span className="font-semibold text-[var(--nm-text)]">{email}</span>
        </p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            type="tel"
            value={otp}
            onChange={handleOtpChange}
            placeholder="Enter 6-digit OTP"
            aria-label="6-digit OTP"
            maxLength={6}
            className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-4 text-center text-xl tracking-[0.35em] focus:border-[var(--nm-accent)] focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="nm-btn-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-sm font-semibold text-[var(--nm-accent-strong)] underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? "Sending..." : cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
