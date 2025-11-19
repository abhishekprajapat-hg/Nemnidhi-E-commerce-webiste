import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import { useDispatch } from "react-redux";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const email = params.get("email"); // from URL

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/api/auth/verify-otp", {
        email,
        otp,
      });

      // Save user token after verification
      const userData = {
        email,
        token: data.token,
        emailVerified: true,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      dispatch({ type: "auth/setUser", payload: userData });

      showToast("Email verified successfully");
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "OTP verification failed";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/api/auth/resend-otp", { email });
      showToast("OTP sent again!");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to resend OTP";
      showToast(msg, "error");
    } finally {
      setResending(false);
    }
  };

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

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verify your Email
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          OTP has been sent to <b>{email}</b>. Enter it below to verify your account.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
            }
            placeholder="Enter 6-digit OTP"
            className="w-full text-center tracking-widest text-xl py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-yellow-400"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300"
            }`}
          >
            {loading ? "Verifying…" : "Verify OTP"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-indigo-600 dark:text-yellow-400 hover:underline text-sm"
          >
            {resending ? "Sending…" : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
