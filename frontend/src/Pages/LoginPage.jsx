import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { showToast } from "../utils/toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const redirectTo = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      try { localStorage.setItem("user", JSON.stringify(data)); } catch {}
      try { dispatch({ type: "auth/setUser", payload: data }); } catch {}
      showToast("Welcome back");
      navigate(redirectTo);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ⭐️ 1. Main Wrapper: Theme Support
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left: Brand / Marketing */}
        <div className="hidden md:flex flex-col justify-center gap-6 pl-6">
          <div className="text-4xl font-extrabold tracking-tight dark:text-white">My Shop</div>
          
          {/* ⭐️ 2. Content updated for Indian Clothing */}
          <p className="text-gray-600 dark:text-gray-300 max-w-md">
            Discover elegance woven in traditional fabrics. Sign in to manage your preferred shipping addresses, track past orders, and save your favorite styles.
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
        {/* ⭐️ 3. Form Card: Theme Support */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-lg font-semibold dark:text-white">Welcome back</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Sign in to continue</div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-2xl font-extrabold font-serif">
              My Shop
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Email Input */}
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                // ⭐️ Input Styles: Theme Support
                className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-yellow-400"
                autoFocus
              />
            </label>

            {/* Password Input */}
            <label className="block text-sm relative">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Password</span>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-yellow-400"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-9 text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              >
                {showPwd ? "Hide" : "Show"}
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
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition ${loading ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300"} `}
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