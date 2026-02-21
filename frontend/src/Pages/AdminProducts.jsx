import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/admin/AdminLayout";
import { showToast } from "../utils/toast";

import FiltersBar from "../components/admin/products/FiltersBar";
import ProductsHeader from "../components/admin/products/ProductsHeader";
import ProductsTable from "../components/admin/products/ProductsTable";
import Pagination from "../components/admin/products/Pagination";

import {
  deriveThumbnail,
  derivePrice,
  deriveTotalStock,
} from "../components/admin/products/productHelpers";

const CACHE_TTL = 30 * 1000;
const DEBOUNCE_MS = 280;

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // filter / UI state
  const [searchInput, setSearchInput] = useState(() => searchParams.get("q") || "");
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get("inStock") === "1");
  const [category, setCategory] = useState(() => searchParams.get("category") || "");
  const [min, setMin] = useState(() => searchParams.get("min") || "");
  const [max, setMax] = useState(() => searchParams.get("max") || "");
  const [sort] = useState("-createdAt");
  const [page, setPage] = useState(() => parsePositiveInt(searchParams.get("page"), 1));
  const [limit] = useState(12);

  // data + UI flags
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);

  // selection
  const [selectedMap, setSelectedMap] = useState({});
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

  const cacheKey = useMemo(
    () =>
      `products:${q}|${inStockOnly ? 1 : 0}|${category}|${min}|${max}|${sort}|${page}|${limit}`,
    [q, inStockOnly, category, min, max, sort, page, limit]
  );

  const readCache = useCallback((key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || Date.now() - parsed._cachedAt > CACHE_TTL) {
        sessionStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }, []);

  const writeCache = useCallback((key, data) => {
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({ _cachedAt: Date.now(), data })
      );
    } catch {
      // Ignore storage write errors (quota/private mode).
    }
  }, []);

  const serializeParams = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (inStockOnly) p.set("inStock", "1");
    if (category) p.set("category", category);
    if (min !== "") p.set("min", min);
    if (max !== "") p.set("max", max);
    if (sort) p.set("sort", sort);
    p.set("page", page);
    p.set("limit", limit);
    return p.toString();
  }, [q, inStockOnly, category, min, max, sort, page, limit]);

  const fetchProducts = useCallback(
    async (useCache = true) => {
      setLoading(true);

      if (useCache) {
        const cached = readCache(cacheKey);
        if (cached) {
          setList(cached.products || []);
          setTotal(cached.total || 0);
          setCategories(cached.categories || []);
          setLoading(false);
        }
      }

      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();

      try {
        const qs = serializeParams();
        const res = await api.get(`/api/products?${qs}`, {
          signal: controllerRef.current.signal,
        });

        if (!mountedRef.current) return;

        const products = res.data.products || res.data || [];
        const tot = res.data.total || products.length;

        setList(products);
        setTotal(tot);

        const cats = Array.from(
          new Set(products.map((p) => p.category).filter(Boolean))
        ).sort();
        setCategories(cats);

        writeCache(cacheKey, { products, total: tot, categories: cats });
      } catch (err) {
        if (err.code !== "ERR_CANCELED")
          showToast("Failed to fetch products", "error");
      } finally {
        if (mountedRef.current) setLoading(false);
        controllerRef.current = null;
      }
    },
    [cacheKey, readCache, serializeParams, writeCache]
  );

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (q) nextParams.set("q", q);
    if (inStockOnly) nextParams.set("inStock", "1");
    if (category) nextParams.set("category", category);
    if (min !== "") nextParams.set("min", min);
    if (max !== "") nextParams.set("max", max);
    if (page > 1) nextParams.set("page", String(page));

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [q, inStockOnly, category, min, max, page, searchParams, setSearchParams]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const nextQuery = searchInput.trim();
    if (nextQuery === q) return undefined;

    debounceRef.current = setTimeout(() => {
      setPage(1);
      setQ(nextQuery);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, q]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const productsWithMeta = useMemo(
    () =>
      list.map((p) => ({
        p,
        thumb: deriveThumbnail(p),
        price: derivePrice(p),
        totalStock: deriveTotalStock(p),
      })),
    [list]
  );

  const allChecked = useMemo(
    () => list.length && list.every((p) => selectedMap[p._id]),
    [list, selectedMap]
  );

  const checkedIds = useMemo(
    () => Object.keys(selectedMap).filter((id) => selectedMap[id]),
    [selectedMap]
  );

  const toggleAll = useCallback(() => {
    if (allChecked) setSelectedMap({});
    else {
      const next = {};
      list.forEach((p) => (next[p._id] = true));
      setSelectedMap(next);
    }
  }, [allChecked, list]);

  const toggleOne = useCallback((id, checked) => {
    setSelectedMap((prev) => ({ ...prev, [id]: checked }));
  }, []);

  const deleteOne = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure?")) return;

      const prev = list;
      setList((l) => l.filter((x) => x._id !== id));

      try {
        await api.delete(`/api/products/${id}`);
        showToast("Product deleted");
      } catch {
        setList(prev);
        showToast("Delete failed", "error");
      }
    },
    [list]
  );

  const bulkDelete = useCallback(async () => {
    if (!checkedIds.length) return;
    if (!window.confirm(`Delete ${checkedIds.length} product(s)?`)) return;

    const prev = list;
    setList((l) => l.filter((x) => !checkedIds.includes(x._id)));
    setSelectedMap({});

    try {
      await Promise.all(
        checkedIds.map((id) => api.delete(`/api/products/${id}`))
      );
      showToast("Products deleted");
    } catch {
      setList(prev);
      showToast("Bulk delete failed", "error");
    }
  }, [checkedIds, list]);

  const displayedCountText =
    checkedIds.length > 0
      ? `${checkedIds.length} selected`
      : `Showing ${list.length} of ${total} products`;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <header>
          <h1 className="nm-display text-4xl font-semibold leading-none sm:text-5xl">Products</h1>
          <p className="mt-2 text-sm text-[var(--nm-muted)]">
            Manage catalog entries, pricing, stock, and bulk actions.
          </p>
        </header>

        <FiltersBar
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          category={category}
          setCategory={setCategory}
          categories={categories}
          min={min}
          max={max}
          setMin={setMin}
          setMax={setMax}
          inStockOnly={inStockOnly}
          setInStockOnly={setInStockOnly}
          setPage={setPage}
        />

        <ProductsHeader
          displayedCountText={displayedCountText}
          checkedCount={checkedIds.length}
          onBulkDelete={bulkDelete}
        />

        <ProductsTable
          loading={loading}
          list={list}
          productsWithMeta={productsWithMeta}
          selectedMap={selectedMap}
          allChecked={allChecked}
          toggleAll={toggleAll}
          toggleOne={toggleOne}
          onView={(id) => navigate(`/product/${id}`)}
          onEdit={(id) => navigate(`/admin/product/${id}`)}
          onDelete={deleteOne}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>
    </AdminLayout>
  );
}
