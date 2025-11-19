// src/pages/AdminProducts.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/admin/AdminLayout";
import { showToast } from "../utils/toast";

const CACHE_TTL = 8 * 1000; // 8 seconds

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium border rounded-md bg-white disabled:opacity-50 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-300"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium border rounded-md bg-white disabled:opacity-50 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-300"
      >
        Next
      </button>
    </div>
  );
}

function deriveThumbnail(product) {
  if (!product) return "/placeholder.png";
  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      if (Array.isArray(v.images) && v.images.length) return v.images[0];
    }
  }
  if (Array.isArray(product.images) && product.images.length) return product.images[0];
  if (product.image) return product.image;
  return "/placeholder.png";
}

function deriveTotalStock(product) {
  if (!product) return 0;
  if (Array.isArray(product.variants) && product.variants.length) {
    return product.variants.reduce((pv, v) => {
      const sizesSum = Array.isArray(v.sizes) ? v.sizes.reduce((sa, s) => sa + (Number(s.stock) || 0), 0) : 0;
      return pv + sizesSum;
    }, 0);
  }
  return Number(product.countInStock || 0);
}

function derivePrice(product) {
  if (!product) return 0;
  if (Array.isArray(product.variants) && product.variants.length) {
    for (const v of product.variants) {
      if (Array.isArray(v.sizes) && v.sizes.length) {
        const s = v.sizes.find((x) => typeof x.price !== "undefined");
        if (s) return Number(s.price || 0);
      }
    }
  }
  return Number(product.price || 0);
}

function RowSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-700 rounded-md" />
      <div className="flex-1">
        <div className="w-48 h-4 bg-gray-200 dark:bg-zinc-700 rounded" />
      </div>
      <div className="w-20 h-4 bg-gray-200 dark:bg-zinc-700 rounded" />
      <div className="w-16 h-4 bg-gray-200 dark:bg-zinc-700 rounded" />
      <div className="w-32 h-8 bg-gray-200 dark:bg-zinc-700 rounded" />
    </div>
  );
}

export default function AdminProducts() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [category, setCategory] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);

  const [selected, setSelected] = useState({});
  const mountedRef = useRef(true);
  const controllerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const cacheKey = useMemo(() => `products:${q}|${inStockOnly ? 1 : 0}|${category}|${min}|${max}|${sort}|${page}|${limit}`, [q, inStockOnly, category, min, max, sort, page, limit]);

  const readCache = useCallback((key) => {
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
  }, []);

  const writeCache = useCallback((key, data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ _cachedAt: Date.now(), data }));
    } catch (e) {}
  }, []);

  const serializeParams = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (inStockOnly) p.set("inStock", "1");
    if (category) p.set("category", category);
    if (min !== "") p.set("min", String(min));
    if (max !== "") p.set("max", String(max));
    if (sort) p.set("sort", sort);
    p.set("page", String(page));
    p.set("limit", String(limit));
    return p.toString();
  }, [q, inStockOnly, category, min, max, sort, page, limit]);

  const fetchProducts = useCallback(async (useCache = true) => {
    setLoading(true);

    if (useCache) {
      const cached = readCache(cacheKey);
      if (cached) {
        setList(cached.products || []);
        setTotal(Number(cached.total || (cached.products || []).length) || 0);
        setCategories(cached.categories || []);
        setLoading(false);
        // still fetch in background to refresh recent changes
      }
    }

    if (controllerRef.current) {
      try { controllerRef.current.abort(); } catch (e) {}
    }
    controllerRef.current = new AbortController();

    const qs = serializeParams();
    try {
      let res;
      try {
        res = await api.get(`/api/products?${qs}`, { signal: controllerRef.current.signal });
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        // fallback endpoint shape
        res = await api.get(`/api/products/product?${qs}`, { signal: controllerRef.current.signal });
      }

      if (!mountedRef.current) return;
      const payload = Array.isArray(res.data) ? { products: res.data, total: res.data.length } : res.data || {};
      const products = payload.products || [];
      const tot = Number(payload.total || products.length) || 0;

      setList(products);
      setTotal(tot);

      const cats = Array.from(new Set((products || []).map((p) => p.category || "").filter(Boolean))).sort((a, b) => a.localeCompare(b));
      setCategories(cats);

      writeCache(cacheKey, { products, total: tot, categories: cats });
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      console.error("fetch products error", err);
      if (mountedRef.current) showToast("Failed to fetch products", "error");
    } finally {
      if (mountedRef.current) setLoading(false);
      controllerRef.current = null;
    }
  }, [cacheKey, readCache, serializeParams, writeCache]);

  // initial + deps change
  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  // debounced search input -> apply to q
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setQ(searchInput.trim());
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  }, [totalPages]);

  const allChecked = useMemo(() => list.length > 0 && list.every((p) => selected[p._id]), [list, selected]);
  const checkedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const toggleAll = useCallback(() => {
    if (allChecked) setSelected({});
    else {
      const next = {};
      list.forEach((p) => (next[p._id] = true));
      setSelected(next);
    }
  }, [allChecked, list]);

  const deleteOne = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const prevList = list;
    const prevTotal = total;
    setList((l) => l.filter((x) => x._id !== id));
    setTotal((t) => Math.max(0, t - 1));
    try {
      await api.delete(`/api/products/${id}`);
      showToast("Product deleted");
    } catch (e) {
      setList(prevList);
      setTotal(prevTotal);
      showToast(e?.response?.data?.message || e.message, "error");
    }
  }, [list, total]);

  const bulkDelete = useCallback(async () => {
    if (!checkedIds.length) return;
    if (!window.confirm(`Delete ${checkedIds.length} product(s)?`)) return;
    const prev = list;
    setList((l) => l.filter((x) => !checkedIds.includes(x._id)));
    setSelected({});
    try {
      for (const id of checkedIds) {
        await api.delete(`/api/products/${id}`);
      }
      showToast(`${checkedIds.length} products deleted`);
    } catch (e) {
      setList(prev);
      showToast(e?.response?.data?.message || e.message, "error");
    }
  }, [checkedIds, list]);

  // small helpers to avoid runtime crashes
  const safeNumber = useCallback((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const displayedCountText = useMemo(() => (checkedIds.length > 0 ? `${checkedIds.length} selected` : `Showing ${list.length} of ${total} products`), [checkedIds.length, list.length, total]);

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6 dark:bg-zinc-800 dark:border-zinc-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Search</label>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Title, slug..."
                className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
                aria-label="Search products"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Category</label>
              <select
                value={category}
                onChange={(e) => { setPage(1); setCategory(e.target.value); }}
                className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
              >
                <option value="">All</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Min ₹</label>
                <input
                  value={min}
                  type="number"
                  onChange={(e) => { setPage(1); setMin(e.target.value); }}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Max ₹</label>
                <input
                  value={max}
                  type="number"
                  onChange={(e) => { setPage(1); setMax(e.target.value); }}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex items-end gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => { setPage(1); setInStockOnly(e.target.checked); }}
                  className="accent-indigo-600"
                />
                In stock only
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">{displayedCountText}</div>
          <div className="flex items-center gap-2">
            {!!checkedIds.length && (
              <button onClick={bulkDelete} className="px-3 py-1.5 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 text-sm dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10">
                Delete selected ({checkedIds.length})
              </button>
            )}
            <button onClick={() => navigate("/admin/create-product")} className="px-3 py-1.5 rounded-lg bg-black text-white font-medium hover:opacity-90 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200">
              Create product
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-200 dark:bg-zinc-800 dark:border-zinc-700 dark:divide-zinc-700">
          <div className="px-4 py-3 flex items-center gap-3 text-xs text-gray-500 font-medium uppercase bg-gray-50 dark:bg-zinc-700 dark:text-gray-400">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-indigo-600" aria-label="Select all products" />
            <div className="w-16">Image</div>
            <div className="flex-1">Product</div>
            <div className="w-28 text-right">Price</div>
            <div className="w-24 text-right">Stock</div>
            <div className="w-44 text-right">Actions</div>
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No products found.</div>
          ) : (
            list.map((p) => {
              const thumb = deriveThumbnail(p);
              const totalStock = deriveTotalStock(p);
              const price = derivePrice(p);
              return (
                <div key={String(p._id)} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition dark:hover:bg-zinc-700/50">
                  <input
                    type="checkbox"
                    checked={!!selected[p._id]}
                    onChange={(e) => setSelected((s) => ({ ...s, [p._id]: e.target.checked }))}
                    className="accent-indigo-600"
                    aria-label={`Select product ${p.title || p._id}`}
                  />
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0">
                    {thumb ? (
                      <img src={thumb} alt={p.title || "product"} className="object-cover w-full h-full" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }} />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-gray-400">No image</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium dark:text-white">{p.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{p.slug}</div>
                  </div>

                  <div className="w-28 text-right dark:text-white">₹{safeNumber(price).toFixed(2)}</div>
                  <div className="w-24 text-right">{Number(totalStock) > 0 ? <span className="text-green-700 dark:text-green-400">{totalStock}</span> : <span className="text-red-700 dark:text-red-400">0</span>}</div>

                  <div className="w-44 text-right flex justify-end gap-2 text-sm">
                    <button onClick={() => navigate(`/product/${p._id}`)} className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700">View</button>
                    <button onClick={() => navigate(`/admin/product/${p._id}`)} className="px-3 py-1 bg-yellow-400 text-black rounded-md hover:opacity-80 dark:bg-yellow-500 dark:hover:bg-yellow-400">Edit</button>
                    <button onClick={() => deleteOne(p._id)} className="px-3 py-1 border border-red-500 text-red-600 rounded-md hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10">Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!loading && totalPages > 1 && <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />}
      </div>
    </AdminLayout>
  );
}
