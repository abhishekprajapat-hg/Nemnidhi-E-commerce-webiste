import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { showToast } from "../utils/toast"; 

// ⭐️ 1. Pagination component (Dark Mode support)
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
      <span className="text-sm text-gray-700 dark:text-gray-300">
        Page {currentPage} of {totalPages}
      </span>
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

export default function AdminProducts() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
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
  const allChecked = useMemo(
    () => list.length > 0 && list.every((p) => selected[p._id]),
    [list, selected]
  );
  const checkedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  async function fetchProducts(signal) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (inStockOnly) params.set("inStock", "1");
      if (category) params.set("category", category);
      if (min) params.set("min", min);
      if (max) params.set("max", max);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));

      let res;
      try {
        res = await api.get(`/api/products?${params.toString()}`, { signal });
      } catch (e) {
        if (e.name === "CanceledError" || e.code === "ERR_CANCELED") return;
        res = await api.get(`/api/products/product?${params.toString()}`, {
          signal,
        });
      }

      const payload = Array.isArray(res.data)
        ? { products: res.data, total: res.data.length }
        : res.data;

      setList(payload.products || []);
      setTotal(Number(payload.total || (payload.products || []).length) || 0);

      const cats = Array.from(
        new Set(
          (payload.products || []).map((p) => p.category || "").filter(Boolean)
        )
      );
      setCategories(cats.sort((a, b) => a.localeCompare(b)));
    } catch (e) {
      if (e.name !== "CanceledError" && e.code !== "ERR_CANCELED") {
        console.error("fetch products error", e);
        showToast("Failed to fetch products", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    fetchProducts(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, inStockOnly, category, min, max, sort, page, limit]);
  
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const toggleAll = () => {
    if (allChecked) setSelected({});
    else {
      const next = {};
      list.forEach((p) => (next[p._id] = true));
      setSelected(next);
    }
  };

  const deleteOne = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const prev = list;
    setList((l) => l.filter((x) => x._id !== id));
    setTotal((t) => Math.max(0, t - 1));
    try {
      await api.delete(`/api/products/${id}`);
      showToast("Product deleted");
    } catch (e) {
      setList(prev);
      setTotal(prev.length);
      showToast(e?.response?.data?.message || e.message, "error");
    }
  };

  const bulkDelete = async () => {
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
  };

  const typeTimer = useRef();
  const onType = (v) => {
    clearTimeout(typeTimer.current);
    typeTimer.current = setTimeout(() => {
      setPage(1);
      setQ(v);
    }, 250);
  };

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto">
        {/* Toolbar ko white card mein daal diya hai */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6 dark:bg-zinc-800 dark:border-zinc-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Search</label>
              <input
                onChange={(e) => onType(e.target.value)}
                placeholder="Title, slug..."
                className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setPage(1);
                  setCategory(e.target.value);
                }}
                className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Min ₹</label>
                <input
                  value={min}
                  type="number"
                  onChange={(e) => {
                    setPage(1);
                    setMin(e.target.value);
                  }}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Max ₹</label>
                <input
                  value={max}
                  type="number"
                  onChange={(e) => {
                    setPage(1);
                    setMax(e.target.value);
                  }}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setPage(1);
                    setInStockOnly(e.target.checked);
                  }}
                  className="accent-indigo-600"
                />
                In stock only
              </label>
            </div>
          </div>
        </div>
        
        {/* Bulk Actions Toolbar */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {checkedIds.length > 0 ? (
              <span>{checkedIds.length} selected</span>
            ) : (
              <span>Showing {list.length} of {total} products</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!!checkedIds.length && (
              <button
                onClick={bulkDelete}
                className="px-3 py-1.5 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 text-sm dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Delete selected ({checkedIds.length})
              </button>
            )}
            <button
              onClick={() => navigate("/admin/create-product")}
              className="px-3 py-1.5 rounded-lg bg-black text-white font-medium hover:opacity-90 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Create product
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-200 dark:bg-zinc-800 dark:border-zinc-700 dark:divide-zinc-700">
          <div className="px-4 py-3 flex items-center gap-3 text-xs text-gray-500 font-medium uppercase bg-gray-50 dark:bg-zinc-700 dark:text-gray-400">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-indigo-600" />
            <div className="w-16">Image</div>
            <div className="flex-1">Product</div>
            <div className="w-28 text-right">Price</div>
            <div className="w-24 text-right">Stock</div>
            <div className="w-44 text-right">Actions</div>
          </div>

          {loading
            ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
            : list.length === 0
            ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No products found.
              </div>
            )
            : list.map((p) => (
              <div
                key={p._id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition dark:hover:bg-zinc-700/50"
              >
                <input
                  type="checkbox"
                  checked={!!selected[p._id]}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, [p._id]: e.target.checked }))
                  }
                  className="accent-indigo-600"
                />
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0">
                  {p.images?.length ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium dark:text-white">{p.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{p.slug}</div>
                </div>

                <div className="w-28 text-right dark:text-white">₹{p.price}</div>
                <div className="w-24 text-right">
                  {p.countInStock > 0 ? (
                    <span className="text-green-700 dark:text-green-400">{p.countInStock}</span>
                  ) : (
                    <span className="text-red-700 dark:text-red-400">0</span>
                  )}
                </div>

                <div className="w-44 text-right flex justify-end gap-2 text-sm">
                  <button
                    onClick={() => navigate(`/product/${p._id}`)}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/admin/product/${p._id}`)}
                    className="px-3 py-1 bg-yellow-400 text-black rounded-md hover:opacity-80 dark:bg-yellow-500 dark:hover:bg-yellow-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteOne(p._id)}
                    className="px-3 py-1 border border-red-500 text-red-600 rounded-md hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
        
        {!loading && totalPages > 1 && (
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </AdminLayout>
  );
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
      <div className="w-16 h-4 bg-gray-200 rounded" />
      <div className="w-32 h-8 bg-gray-200 rounded" />
    </div>
  );
}