// /src/hooks/useOrders.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import { showToast } from '../utils/toast';

const CACHE_TTL = 8 * 1000; // 8s

function serializeParams(obj = {}) {
  const p = [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null || v === '') continue;
    p.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return p.join('&');
}

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - (parsed._cachedAt || 0) > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
}
function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ _cachedAt: Date.now(), data }));
  } catch (e) {}
}

export default function useOrders(filters) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({});
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });

  const mountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const cacheKey = useMemo(() => {
    const s = `${filters.q || ''}|${filters.status || ''}|${filters.page || 1}|${filters.limit || 20}|${filters.sort || '-createdAt'}`;
    return `orders:${s}`;
  }, [filters]);

  const load = useCallback(
    async (useCache = true) => {
      setLoading(true);
      setFacets({});
      setPageInfo({ page: 1, pages: 1, total: 0 });

      if (useCache) {
        const cached = readCache(cacheKey);
        if (cached) {
          setOrders(cached.orders || []);
          setFacets(cached.facets || {});
          setPageInfo({ page: cached.page || 1, pages: cached.pages || 1, total: cached.total || 0 });
          setLoading(false);
          // continue to fetch to refresh
        }
      }

      if (controllerRef.current) {
        try {
          controllerRef.current.abort();
        } catch (e) {}
      }
      controllerRef.current = new AbortController();

      const qs = serializeParams(filters);
      try {
        const res = await api.get(`/api/orders${qs ? `?${qs}` : ''}`, { signal: controllerRef.current.signal });
        if (!mountedRef.current) return;
        const d = res.data || {};
        setOrders(d.orders || []);
        setFacets(d.facets || {});
        setPageInfo({ page: d.page || 1, pages: d.pages || 1, total: d.total || 0 });
        writeCache(cacheKey, { orders: d.orders || [], facets: d.facets || {}, page: d.page, pages: d.pages, total: d.total });
      } catch (err) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
        console.error('Failed to load orders', err);
        if (mountedRef.current) showToast('Failed to load orders', 'error');
      } finally {
        if (mountedRef.current) setLoading(false);
        controllerRef.current = null;
      }
    },
    [filters, cacheKey]
  );

  // reload when filters change
  useEffect(() => {
    load(true);
  }, [load]);

  const refresh = useCallback(() => load(false), [load]);

  return {
    orders,
    loading,
    facets,
    pageInfo,
    refresh,
  };
}
