// /src/hooks/useProduct.js
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { showToast } from '../utils/toast';

const CACHE_TTL = 10 * 1000;

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export default function useProduct(productId) {
  const [product, setProduct] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    variants: [],
  });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(false);
  const controllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const readCache = useCallback((pid) => {
    try {
      const raw = sessionStorage.getItem(`product:${pid}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || Date.now() - (parsed._cachedAt || 0) > CACHE_TTL) {
        sessionStorage.removeItem(`product:${pid}`);
        return null;
      }
      return parsed.data || null;
    } catch {
      return null;
    }
  }, []);

  const writeCache = useCallback((pid, data) => {
    try {
      sessionStorage.setItem(`product:${pid}`, JSON.stringify({ _cachedAt: Date.now(), data }));
    } catch {}
  }, []);

  const normalize = useCallback((raw = {}) => {
    const variants = (Array.isArray(raw.variants) ? raw.variants : []).map((v) => ({
      id: v.id || genId(),
      color: v.color || '',
      images: Array.isArray(v.images) ? v.images : [],
      sizes: Array.isArray(v.sizes) ? v.sizes.map(s => ({ size: s.size || '', price: Number(s.price || 0), stock: Number(s.stock || 0) })) : [],
    }));
    return {
      title: raw.title || '',
      slug: raw.slug || '',
      description: raw.description || '',
      category: raw.category || '',
      variants,
    };
  }, []);

  const load = useCallback(async (useCache = true) => {
    if (!productId) {
      setProduct({ title: '', slug: '', description: '', category: '', variants: [] });
      setLoading(false);
      return;
    }

    setLoading(true);

    if (useCache) {
      const cached = readCache(productId);
      if (cached) {
        setProduct(cached);
        setLoading(false);
        // continue to refresh in background
      }
    }

    if (controllerRef.current) {
      try { controllerRef.current.abort(); } catch (e) {}
    }
    controllerRef.current = new AbortController();
    try {
      // load categories + product in parallel
      const pCats = api.get('/api/products/categories');
      const pProd = api.get(`/api/products/${productId}`, { signal: controllerRef.current.signal });

      const [catsRes, prodRes] = await Promise.allSettled([pCats, pProd]);

      if (!mountedRef.current) return;

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value.data)) {
        setAvailableCategories(prev => {
          const merged = Array.from(new Set([...(prev || []), ...catsRes.value.data.filter(Boolean)]));
          return merged;
        });
      }

      if (prodRes.status === 'fulfilled') {
        const data = prodRes.value.data || {};
        const normalized = normalize(data);
        setProduct(normalized);
        writeCache(productId, normalized);
      }
    } catch (err) {
      if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
      console.error('useProduct load error', err);
      if (mountedRef.current) showToast('Failed to load product', 'error');
    } finally {
      if (mountedRef.current) setLoading(false);
      controllerRef.current = null;
    }
  }, [productId, normalize, readCache, writeCache]);

  useEffect(() => { if (productId) load(true); else load(false); }, [productId, load]);

  const save = useCallback(async (payload) => {
    setSaving(true);
    try {
      if (productId) {
        await api.put(`/api/products/${productId}`, payload);
      } else {
        await api.post(`/api/products`, payload);
      }
      writeCache(productId, payload);
      showToast('Product saved successfully');
      return { ok: true };
    } catch (err) {
      console.error('save error', err);
      return { ok: false, message: err.response?.data?.message || err.message };
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [productId, writeCache]);

  const uploadFile = useCallback(async (file) => {
    const tryUpload = async (url) => {
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' }});
        return res.data?.url || null;
      } catch { return null; }
    };
    const endpoints = ['/api/upload/image', '/api/upload'];
    for (const ep of endpoints) {
      const r = await tryUpload(ep);
      if (r) return r;
    }
    // fallback to base64
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev?.target?.result || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    product, setProduct, loading, saving,
    availableCategories, setAvailableCategories,
    load, save, uploadFile,
  };
}
