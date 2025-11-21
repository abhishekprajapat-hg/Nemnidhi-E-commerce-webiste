// src/pages/ProductsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const DEFAULT_CAT_IMAGE = "/mnt/data/d5ff4896-1e72-4950-a3f0-2be7cede2a70.png";

const SkeletonCard = () => (
  <div className="animate-pulse border rounded-xl overflow-hidden bg-white dark:bg-zinc-800 dark:border-zinc-700">
    <div className="aspect-[4/5] bg-gray-200 dark:bg-zinc-700" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-zinc-700 w-2/3 rounded" />
      <div className="h-4 bg-gray-100 dark:bg-zinc-900 w-1/3 rounded" />
    </div>
  </div>
);

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
      >
        &larr; Previous
      </button>
      <span className="text-gray-700 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
      >
        Next &rarr;
      </button>
    </div>
  );
};

/* ---------- helper functions for variant-aware data ---------- */

function deriveThumbnail(product) {
  if (product?.variants && product.variants.length) {
    for (const v of product.variants) {
      if (Array.isArray(v.images) && v.images.length) return v.images[0];
    }
  }
  if (Array.isArray(product?.images) && product.images.length) return product.images[0];
  if (product?.image) return product.image;
  return "/placeholder.png";
}

function deriveTotalStock(product) {
  if (product?.variants && product.variants.length) {
    return product.variants.reduce((pv, v) => {
      const sizesSum = Array.isArray(v.sizes)
        ? v.sizes.reduce((sAcc, s) => sAcc + (Number(s.stock) || 0), 0)
        : 0;
      return pv + sizesSum;
    }, 0);
  }
  return Number(product?.countInStock || 0);
}

function derivePrice(product) {
  if (product?.variants && product.variants.length) {
    for (const v of product.variants) {
      if (Array.isArray(v.sizes) && v.sizes.length) {
        const s = v.sizes[0];
        if (s && typeof s.price !== "undefined") return Number(s.price);
      }
    }
  }
  return Number(product?.price || 0);
}

/* -------------------- CategoryTabs component -------------------- */
/* This creates the arch-style category tabs (like your provided image) */
function CategoryTabs({ categories = [], activeCategory, onSelect }) {
  // Normalize incoming categories: it might be strings or objects from API
  const norm = categories.map((c) => {
    if (typeof c === "string") {
      return { name: c, slug: c, img: DEFAULT_CAT_IMAGE };
    }
    // object - support multiple field names
    return {
      name: c.name || c.title || c.label || "",
      slug: c.slug || c.name || c.title || "",
      img: c.img || c.image || DEFAULT_CAT_IMAGE,
    };
  });

  return (
    <nav className="mb-6">
      <div className="overflow-x-auto no-scrollbar">
        <ul className="flex items-end gap-8 px-4 sm:px-6 lg:px-8">
          {norm.map((cat) => {
            const isActive = activeCategory && (activeCategory === cat.name || activeCategory === cat.slug);
            return (
              <li key={cat.slug || cat.name} className="flex-shrink-0">
                <button
                  onClick={() => onSelect(cat.name || cat.slug)}
                  className={`flex flex-col items-center gap-2 py-1 px-2 focus:outline-none ${isActive ? "text-indigo-600" : "text-gray-600 hover:text-gray-800"}`}
                  aria-pressed={isActive}
                >
                  <div
                    className={`relative w-20 h-20 md:w-24 md:h-24 rounded-t-2xl rounded-b-full flex items-end justify-center bg-pink-50 transition-transform duration-300 ${
                      isActive ? "ring-2 ring-indigo-300" : "hover:scale-105"
                    }`}
                    style={{ paddingBottom: 6 }}
                  >
                    {/* Arch background */}
                    <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
                      <div className="w-full h-1/2 bg-pink-50 rounded-t-2xl" />
                    </div>

                    {/* Circular visible crop for image */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 mt-1 rounded-full overflow-hidden bg-white shadow-sm">
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out transform group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_CAT_IMAGE;
                        }}
                      />
                    </div>
                  </div>

                  <span className="text-xs md:text-sm mt-2 capitalize">{cat.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

/* -------------------- main component -------------------- */

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState(params.get("q") || "");
  const [q, setQ] = useState(params.get("q") || "");
  const [sort, setSort] = useState(params.get("sort") || "-createdAt");
  const category = params.get("category") || "";

  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(params.get("page") ? Number(params.get("page")) : 1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function loadCats() {
      // 1) try admin-managed homepage categories first
      try {
        const res = await api.get("/api/content/homepage");
        if (!mounted) return;
        const homepage = res.data || {};
        if (Array.isArray(homepage.categories) && homepage.categories.length) {
          const norm = homepage.categories.map((c) => {
            if (typeof c === "string") {
              return { name: c, slug: c, img: DEFAULT_CAT_IMAGE };
            }
            return {
              name: c.name || c.title || c.label || "",
              slug:
                c.slug ||
                (c.name || c.title || "")
                  .toString()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              img: c.img || c.image || DEFAULT_CAT_IMAGE,
              href: c.href || null,
            };
          });
          setCategories(norm);
          return;
        }
      } catch (err) {
        console.warn("Homepage categories fetch failed (will fallback):", err);
      }

      // 2) fallback to products/categories endpoint
      try {
        const res2 = await api.get("/api/products/categories");
        if (!mounted) return;
        const list = Array.isArray(res2.data) ? res2.data : res2.data?.categories || [];
        const norm2 = (list || []).map((c) =>
          typeof c === "string"
            ? { name: c, slug: c, img: DEFAULT_CAT_IMAGE }
            : { name: c.name || c, slug: c.slug || c.name || c, img: c.img || DEFAULT_CAT_IMAGE }
        );
        setCategories(norm2);
        return;
      } catch (err) {
        console.error("Fallback categories fetch failed:", err);
      }

      // 3) final small fallback
      if (mounted) {
        setCategories([
          { name: "Sarees", slug: "sarees", img: DEFAULT_CAT_IMAGE },
          { name: "Western", slug: "western", img: DEFAULT_CAT_IMAGE },
          { name: "Tops", slug: "tops", img: DEFAULT_CAT_IMAGE },
        ]);
      }
    }

    loadCats();

    return () => {
      mounted = false;
    };
  }, []);

  // debounce search term
  useEffect(() => {
    const t = setTimeout(() => setQ(searchTerm.trim()), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort, category]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (sort) p.set("sort", sort);
    if (category) p.set("category", category);
    if (page > 1) p.set("page", page);
    return p.toString();
  }, [q, sort, category, page]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/products${queryString ? `?${queryString}` : ""}`);
        const list = data.products || (Array.isArray(data) ? data : []);
        const currentPage = data.page || 1;
        const pages = data.pages || 1;
        if (on) {
          setItems(list);
          setPage(currentPage);
          setTotalPages(pages);
        }
      } catch (e) {
        console.error(e);
        if (on) {
          setItems([]);
          setTotalPages(1);
        }
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [queryString]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (sort) next.set("sort", sort);
    if (category) next.set("category", category);
    if (page > 1) next.set("page", page);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort, category, page]);

  const handleCategoryClick = (cat) => {
    setParams((prev) => {
      if (cat) prev.set("category", cat);
      else prev.delete("category");
      prev.delete("page");
      return prev;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Category Tabs (replaced with arch image tabs) */}
      <CategoryTabs categories={categories} activeCategory={category || null} onSelect={handleCategoryClick} />

      {/* Title + Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold dark:text-white capitalize">{category || "All Products"}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse our collection of curated products.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search products…" className="w-64 max-w-full border rounded-lg pl-10 pr-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
              </svg>
            </div>

            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-lg px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
              <option value="-createdAt">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="title">Title A–Z</option>
              <option value="-title">Title Z–A</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">No products found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((p) => {
                const thumb = deriveThumbnail(p);
                const totalStock = deriveTotalStock(p);
                const price = derivePrice(p);
                return (
                  <Link key={p._id} to={`/product/${p._id}`} className="group border rounded-xl overflow-hidden bg-white hover:shadow-md transition dark:border-zinc-700 dark:bg-zinc-800 dark:hover:shadow-lg dark:hover:shadow-black/50">
                    <div className="relative">
                      <div className="aspect-[4/5] bg-gray-100 dark:bg-zinc-700">
                        <img src={thumb} alt={p.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }} />
                      </div>

                      {Number(totalStock || 0) <= 0 && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs rounded px-2 py-1">
                          Out of stock
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="font-medium line-clamp-1 dark:text-white">{p.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">₹{Number(price || 0).toFixed(2)}</div>
                      {p.rating ? <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-500">★ {Number(p.rating).toFixed(1)} ({p.numReviews || 0})</div> : null}
                    </div>
                  </Link>
                );
              })}
            </div>

            <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
