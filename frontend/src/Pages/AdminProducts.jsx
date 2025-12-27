import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
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

export default function AdminProducts() {
  const navigate = useNavigate();

  // filter / UI state
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [category, setCategory] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort] = useState("-createdAt");
  const [page, setPage] = useState(1);
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
    } catch {}
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setQ(searchInput.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

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
      } catch (e) {
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
      <div className="max-w-[1200px] mx-auto">
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
