import React, { useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { showToast } from "../utils/toast";

/* ---------- helpers ---------- */
function passwordStrength(pw) {
  let score = 0;
  if (!pw) return { score: 0, label: "Too short" };
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[\W_]/.test(pw)) score += 1;
  const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  return { score, label };
}

const getStrengthColor = (score) => {
  if (score <= 1) return "#ef4444";
  if (score === 2) return "#f59e0b";
  if (score === 3) return "#10b981";
  return "#059669";
};

const isValidEmail = (s) => {
  if (!s) return false;
  // simple but effective email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
};

/* ---------- component ---------- */
export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [loading, setLoading] = useState(false);
  // global form error (server message)
  const [error, setError] = useState("");

  // per-field touched state to show helpful hints only after interaction
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  // mounted ref to avoid state updates after unmount
  const mountedRef = useRef(true);

  // derived values
  const strength = useMemo(() => passwordStrength(password), [password]);

  const nameError = useMemo(() => {
    if (!touched.name) return "";
    if (!name.trim()) return "Please enter your full name.";
    return "";
  }, [name, touched.name]);

  const emailError = useMemo(() => {
    if (!touched.email) return "";
    if (!email.trim()) return "Please enter your email.";
    if (!isValidEmail(email)) return "Please enter a valid email address.";
    return "";
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!password) return "Please create a password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password.length < 8) return "Consider using 8+ characters for better security.";
    return "";
  }, [password, touched.password]);

  // overall form validity
  const isFormValid = useMemo(() => {
    return name.trim() && isValidEmail(email) && password.length >= 6;
  }, [name, email, password]);

  // safe update touched
  const markTouched = useCallback((field) => {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }, []);

  // handlers wrapped in useCallback to avoid re-creation on each render
  const handleName = useCallback((e) => {
    setName(e.target.value);
  }, []);

  const handleEmail = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  const handlePassword = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  const toggleShow = useCallback(() => setShowPwd((s) => !s), []);

  // submit with abort-safe pattern
  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      // mark all touched so errors show if user tries to submit prematurely
      setTouched({ name: true, email: true, password: true });

      if (!isFormValid) {
        setError("Please fix validation errors before continuing.");
        return;
      }

      setLoading(true);
      mountedRef.current = true;

      try {
        const { data } = await api.post("/api/auth/register", { name: name.trim(), email: email.trim(), password });

        // server will send OTP or similar; do not auto-login here
        showToast("OTP sent to your email");
        // navigate to verification with email prefilled (URL safe)
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Registration failed";
        setError(msg);
        showToast(msg, "error");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [email, isFormValid, name, navigate, password]
  );

  // cleanup on unmount
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-center gap-6 pl-6">
          <div className="text-4xl font-extrabold tracking-tight dark:text-white">Create your account</div>

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
              <div className="text-sm text-gray-500 dark:text-gray-400">Start your journey with NEMNIDHI</div>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-4 text-sm text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Full name</span>
              <input
                value={name}
                onChange={handleName}
                onBlur={() => markTouched("name")}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "name-error" : undefined}
                className={`mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border ${
                  nameError ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-zinc-600"
                }`}
                placeholder="Your name"
              />
              {nameError && <div id="name-error" className="mt-1 text-xs text-red-600 dark:text-red-300">{nameError}</div>}
            </label>

            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Email</span>
              <input
                value={email}
                onChange={handleEmail}
                onBlur={() => markTouched("email")}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className={`mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border ${
                  emailError ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-zinc-600"
                }`}
                placeholder="you@example.com"
                type="email"
                inputMode="email"
                autoComplete="email"
              />
              {emailError && <div id="email-error" className="mt-1 text-xs text-red-600 dark:text-red-300">{emailError}</div>}
            </label>

            <label className="block text-sm relative">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Password</span>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={handlePassword}
                onBlur={() => markTouched("password")}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
                placeholder="Create a strong password"
                className={`mt-1 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-700 border ${
                  passwordError ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-zinc-600"
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={toggleShow}
                className="absolute right-3 top-9 text-xs text-gray-500 dark:text-gray-400"
                aria-pressed={showPwd}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? "Hide" : "Show"}
              </button>

              {passwordError && <div id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-300">{passwordError}</div>}
            </label>

            {/* Password Strength */}
            <div className="mt-1" aria-hidden="false">
              <div className="flex items-center justify-between text-xs mb-1">
                <div>
                  Strength: <span className="font-medium dark:text-white">{strength.label}</span>
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
              disabled={loading || !isFormValid}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                loading || !isFormValid
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800 dark:bg-yellow-400 dark:text-black"
              }`}
              aria-disabled={loading || !isFormValid}
            >
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-600 dark:text-yellow-400 underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
