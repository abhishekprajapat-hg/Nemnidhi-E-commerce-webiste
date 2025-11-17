const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include', // important: send cookies
    headers: {
      'Content-Type': options.body ? 'application/json' : undefined,
      ...(options.headers || {})
    },
    ...options
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = text; }

  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'API error');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export default api;
