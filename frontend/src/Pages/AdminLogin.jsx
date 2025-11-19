import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { showToast } from '../utils/toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const emailRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    if (emailRef.current) emailRef.current.focus();
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const isAdmin = parsed?.isAdmin || parsed?.user?.isAdmin;
        if (isAdmin) navigate('/admin', { replace: true });
      }
    } catch (e) {}
  }, [navigate]);

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    const emailTrim = String(email || '').trim();
    const passTrim = String(password || '').trim();
    if (!emailTrim || !passTrim) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post('/api/auth/login', { email: emailTrim, password: passTrim });
      const data = resp?.data || {};

      const token = data.token || data?.user?.token || data?.accessToken || null;
      const isAdminResp = Boolean(data.isAdmin || data?.user?.isAdmin || data?.is_admin);

      if (!token) {
        throw new Error('Invalid login response');
      }
      if (!isAdminResp) {
        throw new Error('Access denied: You must be an admin.');
      }

      const storePayload = data?.user ? data : { ...data, user: data.user || null };
      try {
        localStorage.setItem('user', JSON.stringify(storePayload));
      } catch (e) {
        console.warn('Failed to persist user to localStorage', e);
      }

      if (isMounted.current) {
        showToast('Welcome back, admin');
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      console.error('Admin login error', err);
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      if (isMounted.current) {
        setError(msg);
        showToast(msg, 'error');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl px-6 py-8 border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700">
        <h1 className="text-2xl font-bold mb-6 dark:text-white text-center">Admin Login</h1>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 text-sm text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-3 rounded-md"
          >
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6" noValidate>
          <div>
            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Email</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email"
              className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-700 dark:text-white px-4 py-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
              placeholder="admin@yourdomain.com"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
              className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-700 dark:text-white px-4 py-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className={`w-full py-2.5 rounded-lg font-semibold transition ${loading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'}`}
            >
              {loading ? 'Signing in…' : 'Sign in as admin'}
            </button>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-zinc-700">
            Note: Only approved admin accounts can access this panel.
          </div>
        </form>
      </div>
    </div>
  );
}
