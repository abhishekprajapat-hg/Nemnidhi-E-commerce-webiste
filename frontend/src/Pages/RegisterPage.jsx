import React, { useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { showToast } from "../utils/toast";

function passwordStrength(pw) {
  let score = 0;
  if (!pw) return { score: 0, label: "Too short" };
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[\W_]/.test(pw)) score += 1;
  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  return { score, label };
}

const getStrengthColor = (score) => {
  if (score <= 1) return "#ef4444";
  if (score === 2) return "#f59e0b";
  if (score === 3) return "#10b981";
  return "#059669";
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => passwordStrength(password), [password]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Please provide name, email and a password (min 6 chars).");
      return;
    }

    setLoading(true);

    try {
      // ⭐ CALL REGISTER API
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });

      // ⭐ No login here — OTP required
      showToast("OTP sent to your email");

      // ⭐ Navigate to OTP page
      navigate(`/verify-otp?email=${email}`);

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Registration failed";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-center gap-6 pl-6">
          <div className="text-4xl font-extrabold tracking-tight dark:text-white">
            Create your account
          </div>

          <p className="text-gray-600 dark:text-gray-300 max-w-md">
            Join NEMNIDHI and step into a world of authentic Indian craftsmanship.
          </p>

          <div className="mt-6 flex gap-3">
            <div className="px-3 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
              Handloom Quality
            </div>
            <div className="px-3 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
              Track orders easily
            </div>
          </div>
        </div>

        {/* Right: Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-lg font-semibold dark:text-white">Create account</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Start your journey with NEMNIDHI
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                Full name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600"
                placeholder="Your name"
              />
            </label>

            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                Email
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600"
                placeholder="you@example.com"
                type="email"
              />
            </label>

            <label className="block text-sm relative">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                Password
              </span>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowPwd((x) => !x)}
                className="absolute right-3 top-9 text-xs text-gray-500 dark:text-gray-400"
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </label>

            {/* Password Strength */}
            <div className="mt-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <div>
                  Strength:{" "}
                  <span className="font-medium dark:text-white">
                    {strength.label}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded">
                <div
                  className="h-2 rounded transition-all"
                  style={{
                    width: `${(strength.score / 4) * 100}%`,
                    background: getStrengthColor(strength.score),
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                loading
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800 dark:bg-yellow-400 dark:text-black"
              }`}
            >
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 dark:text-yellow-400 underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
