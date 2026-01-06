import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { showToast } from "../utils/toast";
import { GoogleLogin } from "@react-oauth/google";

/* ---------- helpers ---------- */
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

const isValidEmail = (s) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");

/* ---------- component ---------- */
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
    () => name.trim() && isValidEmail(email) && password.length >= 6,
    [name, email, password]
  );

  /* ================= EMAIL REGISTER ================= */

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
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
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Registration failed";
        setError(msg);
        showToast(msg, "error");
      } finally {
        mountedRef.current && setLoading(false);
      }
    },
    [email, isFormValid, name, navigate, password]
  );

  /* ================= GOOGLE REGISTER ================= */

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    try {
      const { data } = await api.post("/api/auth/google", {
        token: credentialResponse.credential, // ✅ ID TOKEN
      });

      localStorage.setItem("user", JSON.stringify(data));
      dispatch({ type: "auth/setUser", payload: data });

      showToast("Account created with Google");
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Google signup failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-semibold mb-1 dark:text-white">
          Create your account
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Join NEMNIDHI today
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        {/* GOOGLE SIGNUP */}
        <div className="mb-4 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              showToast("Google signup failed", "error")
            }
          />
        </div>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
        </div>

        {/* EMAIL REGISTER */}
        <form onSubmit={submit} className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border dark:border-zinc-600"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border dark:border-zinc-600"
          />

          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border dark:border-zinc-600"
          />

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full py-3 rounded-lg bg-black text-white dark:bg-yellow-400 dark:text-black"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
