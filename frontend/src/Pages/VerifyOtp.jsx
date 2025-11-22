import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import { useDispatch } from "react-redux";

const RESEND_COOLDOWN_SECONDS = 30; // cooldown between resend attempts

export default function VerifyOtp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const email = params.get("email"); // from URL

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const mountedRef = useRef(true);
  const inputRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  // Mount/unmount guard
  useEffect(() => {
    mountedRef.current = true;
    // autofocus
    if (inputRef.current) inputRef.current.focus();
    return () => {
      mountedRef.current = false;
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Countdown for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
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

  const handleOtpChange = useCallback((e) => {
    // allow only digits, limit to 6 chars
    const cleaned = (e.target.value || "").replace(/\D/g, "").slice(0, 6);
    setOtp(cleaned);
    setError("");

    // auto-submit when 6 digits entered
    if (cleaned.length === 6) {
      // small delay to allow state to update & user to see last digit
      setTimeout(() => {
        // only auto-submit if input still has 6 digits and not already loading
        if (mountedRef.current && cleaned.length === 6 && !loading) {
          // create a fake submit event - call verify directly
          // but avoid duplicating code: call handleVerify with null and skip preventDefault
          handleVerify(null, cleaned);
        }
      }, 150);
    }
  }, [loading]); // loading included to avoid auto-submit when already submitting

  const handleVerify = useCallback(
    async (e, suppliedOtp) => {
      if (e && e.preventDefault) e.preventDefault();
      setError("");

      const code = typeof suppliedOtp === "string" ? suppliedOtp : otp;

      if (!/^\d{6}$/.test(code)) {
        setError("Please enter a valid 6-digit OTP");
        showToast("Please enter a valid 6-digit OTP", "error");
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.post("/api/auth/verify-otp", {
          email,
          otp: code,
        });

        // Save user token after verification
        const userData = {
          email,
          token: data.token,
          emailVerified: true,
        };

        try {
          localStorage.setItem("user", JSON.stringify(userData));
        } catch {
          // ignore localStorage errors
        }

        try {
          // keep your existing pattern: dispatch a setUser action
          dispatch({ type: "auth/setUser", payload: userData });
        } catch {
          // swallow dispatch errors
        }

        showToast("Email verified successfully");
        if (mountedRef.current) navigate("/");
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "OTP verification failed";
        setError(msg);
        showToast(msg, "error");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [dispatch, email, navigate, otp]
  );

  const handleResend = useCallback(async () => {
    if (!email) {
      setError("Missing email address");
      return;
    }
    if (cooldown > 0) return; // guard

    setResending(true);
    setError("");

    try {
      await api.post("/api/auth/resend-otp", { email });
      showToast("OTP sent again!");
      // start cooldown
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to resend OTP";
      setError(msg);
      showToast(msg, "error");
    } finally {
      if (mountedRef.current) setResending(false);
    }
  }, [cooldown, email]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        Invalid request. Email missing.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify your Email</h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          OTP has been sent to <b>{email}</b>. Enter it below to verify your account.
        </p>

        {error && (
          <div role="alert" className="mb-4 text-sm text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleVerify(e)} className="space-y-4" aria-describedby="otp-instructions">
          <div id="otp-instructions" className="sr-only">
            Enter the 6-digit OTP sent to your email
          </div>

          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            type="tel"
            value={otp}
            onChange={handleOtpChange}
            placeholder="Enter 6-digit OTP"
            aria-label="6-digit OTP"
            aria-invalid={!!error}
            maxLength={6}
            className="w-full text-center tracking-widest text-xl py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-yellow-400"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              loading ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300"
            }`}
            aria-disabled={loading}
          >
            {loading ? "Verifying…" : "Verify OTP"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-indigo-600 dark:text-yellow-400 hover:underline text-sm"
            aria-disabled={resending || cooldown > 0}
          >
            {resending ? "Sending…" : cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
