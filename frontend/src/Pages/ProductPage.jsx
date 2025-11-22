// src/pages/ProductsPage.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";

// Components
import CategoryTabs from "../components/products/CategoryTabs";
import ProductGrid from "../components/products/ProductGrid";
import PaginationControls from "../components/products/PaginationControls";

const DEFAULT_CAT_IMAGE = "/mnt/data/d5ff4896-1e72-4950-a3f0-2be7cede2a70.png";

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();

  // Helper to read string param with fallback
  const getParam = (key, fallback = "") => params.get(key) || fallback;
  const getNumberParam = (key, fallback = 1) => {
    const v = params.get(key);
    const n = Number(v);
    return Number.isFinite(n) && n >= 1 ? n : fallback;
  };

  // Local controlled state (derived directly from current URL params on mount)
  const [searchTerm, setSearchTerm] = useState(() => getParam("q", ""));
  const [qDebounced, setQDebounced] = useState(() => getParam("q", ""));
  const [sort, setSort] = useState(() => getParam("sort", "-createdAt"));
  const [category, setCategory] = useState(() => getParam("category", ""));
  const [page, setPage] = useState(() => getNumberParam("page", 1));

  // Data
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // fetch guard
  const fetchIdRef = useRef(0);

  /* --------------------------
     Keep local state in sync if URL params changed externally
     (handles back/forward or outside navigation)
  -------------------------- */
  useEffect(() => {
    const u = getParam("q", "");
    const s = getParam("sort", "-createdAt");
    const c = getParam("category", "");
    const p = getNumberParam("page", 1);

    // Only update if different to avoid loops
    if (u !== searchTerm) setSearchTerm(u);
    if (u !== qDebounced) setQDebounced(u);
    if (s !== sort) setSort(s);
    if (c !== category) setCategory(c);
    if (p !== page) setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  /* --------------------------
     Debounce searchTerm -> qDebounced (350ms)
  -------------------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchTerm.trim();
      setQDebounced((prev) => {
        if (prev !== trimmed) {
          // whenever search changes, reset to page 1
          setPage(1);
          return trimmed;
        }
        return prev;
      });
    }, 350);
    return () => clearTimeout(t);
    // intentionally depends on searchTerm only
  }, [searchTerm]);

  // Immediate sync when user clears search using clear button (avoid 350ms wait)
  useEffect(() => {
    if (searchTerm === "" && qDebounced !== "") {
      setQDebounced("");
      setPage(1);
    }
  }, [searchTerm, qDebounced]);

  /* --------------------------
     Sync URL when filters change (single source of truth)
  -------------------------- */
  useEffect(() => {
    const next = new URLSearchParams();
    if (qDebounced) next.set("q", qDebounced);
    if (sort) next.set("sort", sort);
    if (category) next.set("category", category);
    if (page > 1) next.set("page", String(page));
    // Replace so back/forward semantics remain predictable
    setParams(next, { replace: true });
  }, [qDebounced, sort, category, page, setParams]);

  /* -----------------------------------------
     Build query string (include sort, sortBy & order)
  ----------------------------------------- */
  const queryString = useMemo(() => {
    const p = new URLSearchParams();

    if (qDebounced) p.set("q", qDebounced);

    if (sort) p.set("sort", sort);

    const isDesc = sort && String(sort).startsWith("-");
    const cleanSort = isDesc ? String(sort).slice(1) : sort;
    if (cleanSort) {
      p.set("sortBy", cleanSort);
      p.set("order", isDesc ? "desc" : "asc");
    }

    if (category) p.set("category", category);
    if (page > 1) p.set("page", String(page));

    return p.toString() ? `?${p.toString()}` : "";
  }, [qDebounced, sort, category, page]);

  /* --------------------------
     Fetch categories (homepage -> fallback)
  -------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const home = await api.get("/api/content/homepage");
        if (!alive) return;
        if (Array.isArray(home.data?.categories) && home.data.categories.length) {
          const formatted = home.data.categories.map((c) =>
            typeof c === "string"
              ? { name: c, slug: c, img: DEFAULT_CAT_IMAGE }
              : {
                  name: c.name || c.title || "",
                  slug: c.slug || (c.name || "").toLowerCase().replace(/\s+/g, "-"),
                  img: c.img || c.image || DEFAULT_CAT_IMAGE,
                }
          );
          setCategories(formatted);
          return;
        }
      } catch (err) {
        // swallow and fallback to categories endpoint
      }

      try {
        const res = await api.get("/api/products/categories");
        if (!alive) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.categories || [];
        setCategories(
          list.map((c) =>
            typeof c === "string"
              ? { name: c, slug: c, img: DEFAULT_CAT_IMAGE }
              : { name: c.name || c, slug: c.slug || c.name || c, img: c.img || DEFAULT_CAT_IMAGE }
          )
        );
      } catch (err) {
        if (alive) {
          setCategories([
            { name: "Sarees", slug: "sarees", img: DEFAULT_CAT_IMAGE },
            { name: "Western", slug: "western", img: DEFAULT_CAT_IMAGE },
            { name: "Tops", slug: "tops", img: DEFAULT_CAT_IMAGE },
          ]);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* --------------------------
     Fetch products with race-safety (AbortController + fetchId)
  -------------------------- */
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const thisFetchId = ++fetchIdRef.current;

    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/products${queryString}`, { signal: controller.signal });

        // Helpful debug info while developing — remove in production
        console.debug("Products fetch", {
          queryString,
          url: `/api/products${queryString}`,
          returnedCount: (data?.products || (Array.isArray(data) ? data : [])).length,
          page: data?.page,
          pages: data?.pages,
        });

        if (!alive || fetchIdRef.current !== thisFetchId) return;

        setItems(data.products || (Array.isArray(data) ? data : []));
        // If backend returns page/pages use them; else keep current `page`
        if (typeof data.page === "number") setPage(data.page || 1);
        setTotalPages(data.pages || 1);
      } catch (err) {
        if (!alive) return;
        if (err.name === "CanceledError" || err.name === "AbortError") {
          // ignore aborted fetch
        } else {
          console.error(err);
          setItems([]);
          setTotalPages(1);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [queryString]);

  /* --------------------------
     Handlers (stable)
  -------------------------- */
  const handleCategoryClick = useCallback((cat) => {
    // if CategoryTabs returns an object, accept either slug or object
    const slug = cat && typeof cat === "object" ? cat.slug || "" : cat || "";
    setCategory(slug);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((val) => {
    setSort(val);
    setPage(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    setQDebounced("");
    setPage(1);
  }, []);

  /* --------------------------
     Render
  -------------------------- */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <CategoryTabs
        categories={categories}
        activeCategory={category || null}
        onSelect={handleCategoryClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold dark:text-white capitalize">
              {category || "All Products"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Browse our curated collection.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products…"
                className="w-64 max-w-full border rounded-lg pl-10 pr-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
              {searchTerm && (
                <button
                  onClick={handleSearchClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none dark:text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
              </svg>
            </div>

            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            >
              <option value="-createdAt">Newest</option>
              <option value="-price">Price: Low to High</option>
              <option value="price">Price: High to Low</option>
              <option value="title">Title A–Z</option>
              <option value="-title">Title Z–A</option>
            </select>
          </div>
        </div>

        <ProductGrid loading={loading} items={items} />

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(Math.max(1, Math.min(totalPages, p)))}
        />
      </div>
    </div>
  );
}
