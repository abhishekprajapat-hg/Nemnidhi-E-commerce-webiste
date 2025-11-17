import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, admin = false }) {
  const location = useLocation();

  // read user from redux or localStorage (single parse)
  const reduxUser = useSelector((s) => s.auth?.user || null);
  const storedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  }, []);

  const user = reduxUser || storedUser;

  // prevent redirect flash while we check localStorage once
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  if (!ready) return null; // or a tiny loader

  if (!user?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (admin && !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
