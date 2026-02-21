import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";

// Components
import CategoryTabs from "../components/products/CategoryTabs";
import ProductGrid from "../components/products/ProductGrid";
import PaginationControls from "../components/products/PaginationControls";

const DEFAULT_CAT_IMAGE = "/placeholder.png";
const MAX_FACET_SCAN_PAGES = 8;

function parseListParam(rawValue) {
  if (!rawValue) return [];
  return String(rawValue)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function arrayEquals(a = [], b = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function toggleListValue(list = [], value = "") {
  if (!value) return list;
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function sortStrings(values = []) {
  return [...values].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
  );
}

function collectFacetValues(products = [], brandSet, colorSet, sizeSet) {
  const addSafe = (setRef, val) => {
    const text = String(val || "").trim();
    if (text) setRef.add(text);
  };

  products.forEach((p) => {
    addSafe(brandSet, p?.brand);

    if (Array.isArray(p?.aggColors)) {
      p.aggColors.forEach((c) => addSafe(colorSet, c));
    }
    if (Array.isArray(p?.aggSizes)) {
      p.aggSizes.forEach((s) => addSafe(sizeSet, s));
    }

    if (Array.isArray(p?.variants)) {
      p.variants.forEach((variant) => {
        addSafe(colorSet, variant?.color);
        if (Array.isArray(variant?.sizes)) {
          variant.sizes.forEach((sizeObj) => addSafe(sizeSet, sizeObj?.size));
        }
      });
    }
  });
}

function FilterGroup({ title, options = [], selected = [], onToggle }) {
  return (
    <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">
        {title}
      </h3>
      {options.length === 0 ? (
        <p className="text-xs text-[var(--nm-muted)]">No options available</p>
      ) : (
        <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
          {options.map((value) => {
            const isChecked = selected.includes(value);
            return (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--nm-text)] transition hover:bg-[var(--nm-accent-soft)]"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(value)}
                  className="accent-[var(--nm-accent)]"
                />
                <span className="truncate" title={value}>
                  {value}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const paramsString = params.toString();

  // Helper to read URL params with fallback
  const getParam = (key, fallback = "") => params.get(key) || fallback;
  const getNumberParam = (key, fallback = 1) => {
    const v = params.get(key);
    const n = Number(v);
    return Number.isFinite(n) && n >= 1 ? n : fallback;
  };
  const getBooleanParam = (key) => {
    const v = String(params.get(key) || "").toLowerCase();
    return v === "1" || v === "true";
  };
  const getListFromParam = (key) => parseListParam(params.get(key));

  // Local controlled state (derived from URL on mount)
  const [searchTerm, setSearchTerm] = useState(() => getParam("q", ""));
  const [qDebounced, setQDebounced] = useState(() => getParam("q", ""));
  const [sort, setSort] = useState(() => getParam("sort", "-createdAt"));
  const [category, setCategory] = useState(() => getParam("category", ""));
  const [page, setPage] = useState(() => getNumberParam("page", 1));
  const [minPrice, setMinPrice] = useState(() => getParam("minPrice", ""));
  const [maxPrice, setMaxPrice] = useState(() => getParam("maxPrice", ""));
  const [minRating, setMinRating] = useState(() => getParam("minRating", ""));
  const [inStockOnly, setInStockOnly] = useState(() => getBooleanParam("inStock"));
  const [selectedBrands, setSelectedBrands] = useState(() => getListFromParam("brands"));
  const [selectedColors, setSelectedColors] = useState(() => getListFromParam("colors"));
  const [selectedSizes, setSelectedSizes] = useState(() => getListFromParam("sizes"));
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(() => {
    return (
      Boolean(getParam("minPrice", "")) ||
      Boolean(getParam("maxPrice", "")) ||
      Boolean(getParam("minRating", "")) ||
      getBooleanParam("inStock") ||
      getListFromParam("brands").length > 0 ||
      getListFromParam("colors").length > 0 ||
      getListFromParam("sizes").length > 0
    );
  });

  // Data
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [facetOptions, setFacetOptions] = useState({
    brands: [],
    colors: [],
    sizes: [],
  });

  // fetch guard
  const fetchIdRef = useRef(0);
  const facetLoadStateRef = useRef("idle");

  /* --------------------------
     Keep local state in sync if URL params changed externally
  -------------------------- */
  useEffect(() => {
    const u = getParam("q", "");
    const s = getParam("sort", "-createdAt");
    const c = getParam("category", "");
    const p = getNumberParam("page", 1);
    const minP = getParam("minPrice", "");
    const maxP = getParam("maxPrice", "");
    const minR = getParam("minRating", "");
    const stock = getBooleanParam("inStock");
    const brands = getListFromParam("brands");
    const colors = getListFromParam("colors");
    const sizes = getListFromParam("sizes");

    // Only update if different to avoid loops
    if (u !== searchTerm) setSearchTerm(u);
    if (u !== qDebounced) setQDebounced(u);
    if (s !== sort) setSort(s);
    if (c !== category) setCategory(c);
    if (p !== page) setPage(p);
    if (minP !== minPrice) setMinPrice(minP);
    if (maxP !== maxPrice) setMaxPrice(maxP);
    if (minR !== minRating) setMinRating(minR);
    if (stock !== inStockOnly) setInStockOnly(stock);
    if (!arrayEquals(brands, selectedBrands)) setSelectedBrands(brands);
    if (!arrayEquals(colors, selectedColors)) setSelectedColors(colors);
    if (!arrayEquals(sizes, selectedSizes)) setSelectedSizes(sizes);
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
  }, [searchTerm]);

  // Immediate sync when user clears search using clear button
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
    if (category) next.set("category", category); // PRESERVE EXACT CASE
    if (minPrice) next.set("minPrice", minPrice);
    if (maxPrice) next.set("maxPrice", maxPrice);
    if (minRating) next.set("minRating", minRating);
    if (inStockOnly) next.set("inStock", "1");
    if (selectedBrands.length) next.set("brands", selectedBrands.join(","));
    if (selectedColors.length) next.set("colors", selectedColors.join(","));
    if (selectedSizes.length) next.set("sizes", selectedSizes.join(","));
    if (page > 1) next.set("page", String(page));
    const nextString = next.toString();
    if (nextString !== paramsString) {
      setParams(next, { replace: true });
    }
  }, [
    qDebounced,
    sort,
    category,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    selectedBrands,
    selectedColors,
    selectedSizes,
    page,
    paramsString,
    setParams,
  ]);

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

    if (category) p.set("category", category); // PRESERVE EXACT CASE
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (minRating) p.set("minRating", minRating);
    if (inStockOnly) p.set("inStock", "1");
    if (selectedBrands.length) p.set("brands", selectedBrands.join(","));
    if (selectedColors.length) p.set("colors", selectedColors.join(","));
    if (selectedSizes.length) p.set("sizes", selectedSizes.join(","));
    if (page > 1) p.set("page", String(page));

    return p.toString() ? `?${p.toString()}` : "";
  }, [
    qDebounced,
    sort,
    category,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    selectedBrands,
    selectedColors,
    selectedSizes,
    page,
  ]);

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
                  slug: c.slug || c.name || "",
                  img: c.img || c.image || DEFAULT_CAT_IMAGE,
                }
          );
          setCategories(formatted);
          return;
        }
      } catch {
        // swallow and fallback
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
      } catch {
        if (alive) {
          setCategories([
            { name: "Sarees", slug: "Sarees", img: DEFAULT_CAT_IMAGE },
            { name: "Western", slug: "Western", img: DEFAULT_CAT_IMAGE },
            { name: "Tops", slug: "Tops", img: DEFAULT_CAT_IMAGE },
            { name: "Sweaters", slug: "Sweaters", img: DEFAULT_CAT_IMAGE },
            { name: "Jeans", slug: "Jeans", img: DEFAULT_CAT_IMAGE },
          ]);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* --------------------------
     Preload filter facets (brand/color/size)
  -------------------------- */
  useEffect(() => {
    if (!showAdvancedFilters || facetLoadStateRef.current !== "idle") return;

    let alive = true;
    const controller = new AbortController();
    facetLoadStateRef.current = "loading";

    (async () => {
      try {
        const brandSet = new Set();
        const colorSet = new Set();
        const sizeSet = new Set();

        let currentPage = 1;
        let lastPage = 1;

        while (alive && currentPage <= lastPage && currentPage <= MAX_FACET_SCAN_PAGES) {
          const scanParams = new URLSearchParams({
            page: String(currentPage),
            limit: "100",
            sort: "title",
          });

          const { data } = await api.get(`/api/products?${scanParams.toString()}`, {
            signal: controller.signal,
          });

          const list = data.products || (Array.isArray(data) ? data : []);
          collectFacetValues(list, brandSet, colorSet, sizeSet);

          lastPage = Math.max(1, Number(data.pages) || 1);
          currentPage += 1;
        }

        if (!alive) return;

        setFacetOptions({
          brands: sortStrings(Array.from(brandSet)),
          colors: sortStrings(Array.from(colorSet)),
          sizes: sortStrings(Array.from(sizeSet)),
        });
        facetLoadStateRef.current = "loaded";
      } catch (err) {
        if (facetLoadStateRef.current === "loading") {
          facetLoadStateRef.current = "idle";
        }
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Failed to preload product filter options:", err);
        }
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [showAdvancedFilters]);

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
        if (!alive || fetchIdRef.current !== thisFetchId) return;

        const nextItems = data.products || (Array.isArray(data) ? data : []);
        setItems(nextItems);

        // Keep options fresh with newly fetched results.
        setFacetOptions((prev) => {
          const brandSet = new Set(prev.brands);
          const colorSet = new Set(prev.colors);
          const sizeSet = new Set(prev.sizes);
          collectFacetValues(nextItems, brandSet, colorSet, sizeSet);
          return {
            brands: sortStrings(Array.from(brandSet)),
            colors: sortStrings(Array.from(colorSet)),
            sizes: sortStrings(Array.from(sizeSet)),
          };
        });

        // If backend returns page/pages use them; else keep current page
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
  const handleCategoryClick = useCallback((slug = "") => {
    setCategory(String(slug || ""));
    setPage(1);
  }, []);

  const handleSortChange = useCallback((val) => {
    setSort(val);
    setPage(1);
  }, []);

  const handleMinPriceChange = useCallback((value) => {
    setMinPrice(value);
    setPage(1);
  }, []);

  const handleMaxPriceChange = useCallback((value) => {
    setMaxPrice(value);
    setPage(1);
  }, []);

  const handleMinRatingChange = useCallback((value) => {
    setMinRating(value);
    setPage(1);
  }, []);

  const handleInStockChange = useCallback((checked) => {
    setInStockOnly(checked);
    setPage(1);
  }, []);

  const handleToggleBrand = useCallback((brand) => {
    setSelectedBrands((prev) => toggleListValue(prev, brand));
    setPage(1);
  }, []);

  const handleToggleColor = useCallback((color) => {
    setSelectedColors((prev) => toggleListValue(prev, color));
    setPage(1);
  }, []);

  const handleToggleSize = useCallback((size) => {
    setSelectedSizes((prev) => toggleListValue(prev, size));
    setPage(1);
  }, []);

  const handleClearAdvancedFilters = useCallback(() => {
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setInStockOnly(false);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPage(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    setQDebounced("");
    setPage(1);
  }, []);

  const hasAdvancedFilters = useMemo(() => {
    return Boolean(
      minPrice ||
        maxPrice ||
        minRating ||
        inStockOnly ||
        selectedBrands.length ||
        selectedColors.length ||
        selectedSizes.length
    );
  }, [
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    selectedBrands.length,
    selectedColors.length,
    selectedSizes.length,
  ]);

  const advancedFilterCount = useMemo(() => {
    return (
      (minPrice ? 1 : 0) +
      (maxPrice ? 1 : 0) +
      (minRating ? 1 : 0) +
      (inStockOnly ? 1 : 0) +
      selectedBrands.length +
      selectedColors.length +
      selectedSizes.length
    );
  }, [
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    selectedBrands.length,
    selectedColors.length,
    selectedSizes.length,
  ]);

  const combinedFacetOptions = useMemo(() => {
    const brandSet = new Set(facetOptions.brands);
    const colorSet = new Set(facetOptions.colors);
    const sizeSet = new Set(facetOptions.sizes);

    collectFacetValues(items, brandSet, colorSet, sizeSet);
    selectedBrands.forEach((b) => brandSet.add(b));
    selectedColors.forEach((c) => colorSet.add(c));
    selectedSizes.forEach((s) => sizeSet.add(s));

    return {
      brands: sortStrings(Array.from(brandSet)),
      colors: sortStrings(Array.from(colorSet)),
      sizes: sortStrings(Array.from(sizeSet)),
    };
  }, [facetOptions, items, selectedBrands, selectedColors, selectedSizes]);

  const activeAdvancedChips = useMemo(() => {
    const chips = [];

    if (minPrice) chips.push({ type: "minPrice", value: minPrice, label: `Min Rs ${minPrice}` });
    if (maxPrice) chips.push({ type: "maxPrice", value: maxPrice, label: `Max Rs ${maxPrice}` });
    if (minRating) chips.push({ type: "minRating", value: minRating, label: `${minRating}+ stars` });
    if (inStockOnly) chips.push({ type: "inStock", value: "1", label: "In stock" });
    selectedBrands.forEach((brand) =>
      chips.push({ type: "brand", value: brand, label: `Brand: ${brand}` })
    );
    selectedColors.forEach((color) =>
      chips.push({ type: "color", value: color, label: `Color: ${color}` })
    );
    selectedSizes.forEach((size) =>
      chips.push({ type: "size", value: size, label: `Size: ${size}` })
    );

    return chips;
  }, [minPrice, maxPrice, minRating, inStockOnly, selectedBrands, selectedColors, selectedSizes]);

  const handleRemoveChip = useCallback((chip) => {
    switch (chip.type) {
      case "minPrice":
        setMinPrice("");
        break;
      case "maxPrice":
        setMaxPrice("");
        break;
      case "minRating":
        setMinRating("");
        break;
      case "inStock":
        setInStockOnly(false);
        break;
      case "brand":
        setSelectedBrands((prev) => prev.filter((x) => x !== chip.value));
        break;
      case "color":
        setSelectedColors((prev) => prev.filter((x) => x !== chip.value));
        break;
      case "size":
        setSelectedSizes((prev) => prev.filter((x) => x !== chip.value));
        break;
      default:
        break;
    }
    setPage(1);
  }, []);

  /* --------------------------
     Render
  -------------------------- */
  return (
    <div className="nm-shell py-8 sm:py-10">
      <CategoryTabs
        categories={categories}
        activeCategory={category || null}
        onSelect={handleCategoryClick}
      />

      <div className="mb-6 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
              Curated Collection
            </p>
            <h1 className="nm-display mt-2 text-4xl font-semibold capitalize sm:text-5xl">
              {category || "All Products"}
            </h1>
            <p className="mt-1 text-sm text-[var(--nm-muted)]">
              Refined pieces across festive and everyday silhouettes.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:max-w-[42rem] lg:grid-cols-[1fr_auto_auto]">
            <label className="relative">
              <span className="sr-only">Search products</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] py-2.5 pl-10 pr-9 text-sm text-[var(--nm-text)] placeholder:text-[var(--nm-muted)] focus:border-[var(--nm-accent)] focus:outline-none"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--nm-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </label>

            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2.5 text-sm text-[var(--nm-text)] focus:border-[var(--nm-accent)] focus:outline-none"
            >
              <option value="-createdAt">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="title">Title A-Z</option>
              <option value="-title">Title Z-A</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-text)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
            >
              Filters{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="mb-6 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--nm-muted)]">
                Min price (Rs)
              </span>
              <input
                value={minPrice}
                type="number"
                min="0"
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--nm-muted)]">
                Max price (Rs)
              </span>
              <input
                value={maxPrice}
                type="number"
                min="0"
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--nm-muted)]">
                Minimum rating
              </span>
              <select
                value={minRating}
                onChange={(e) => handleMinRatingChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              >
                <option value="">Any rating</option>
                <option value="4">4 stars and up</option>
                <option value="3">3 stars and up</option>
                <option value="2">2 stars and up</option>
                <option value="1">1 star and up</option>
              </select>
            </label>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => handleInStockChange(e.target.checked)}
                  className="accent-[var(--nm-accent)]"
                />
                In stock only
              </label>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <FilterGroup
              title="Brands"
              options={combinedFacetOptions.brands}
              selected={selectedBrands}
              onToggle={handleToggleBrand}
            />
            <FilterGroup
              title="Colors"
              options={combinedFacetOptions.colors}
              selected={selectedColors}
              onToggle={handleToggleColor}
            />
            <FilterGroup
              title="Sizes"
              options={combinedFacetOptions.sizes}
              selected={selectedSizes}
              onToggle={handleToggleSize}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleClearAdvancedFilters}
              className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {hasAdvancedFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeAdvancedChips.map((chip) => (
            <button
              key={`${chip.type}:${chip.value}`}
              type="button"
              onClick={() => handleRemoveChip(chip)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--nm-text)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
              title="Remove filter"
            >
              <span>{chip.label}</span>
              <span aria-hidden>x</span>
            </button>
          ))}
        </div>
      )}

      <ProductGrid loading={loading} items={items} />

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(Math.max(1, Math.min(totalPages, p)))}
      />
    </div>
  );
}
