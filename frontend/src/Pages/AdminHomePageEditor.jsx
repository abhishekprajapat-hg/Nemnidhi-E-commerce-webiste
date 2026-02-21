// src/pages/AdminHomepageEditor.jsx
import React, { useEffect, useState, useCallback, lazy, Suspense } from "react";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import AdminLayout from "../components/admin/AdminLayout";

// Lazy-load editors to reduce initial bundle
const HeroSlidesEditor = lazy(() => import("../components/admin/HeroSlidesEditor"));
const CategoriesEditor = lazy(() => import("../components/admin/CategoriesEditor"));
const PromoEditor = lazy(() => import("../components/admin/PromoEditor"));

const EMPTY_SLIDE = { img: "", alt: "", title: "", subtitle: "", href: "" };
const EMPTY_CATEGORY = { name: "", slug: "", href: "", img: "" };
const EMPTY_PROMO = {
  title: "",
  subtitle: "",
  buttonText: "",
  href: "",
  img: "",
};

const EMPTY_HOMEPAGE = {
  heroSlides: [],
  categories: [],
  promo: { ...EMPTY_PROMO },
};

const CACHE_KEY = "admin_homepage_cache_v1";
const FETCH_TIMEOUT = 7000; // ms - abort if backend too slow

const makeSlug = (str = "") =>
  str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const makeCategoryHref = (slug = "") =>
  slug ? `/products?category=${encodeURIComponent(slug)}` : "";

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function normalizeSlide(slide = {}) {
  return {
    ...EMPTY_SLIDE,
    id: slide.id || makeId(),
    img: String(slide.img || slide.image || "").trim(),
    alt: String(slide.alt || "").trim(),
    title: String(slide.title || "").trim(),
    subtitle: String(slide.subtitle || "").trim(),
    href: String(slide.href || "").trim(),
  };
}

function normalizeCategory(category) {
  if (!category) return null;

  if (typeof category === "string") {
    const name = category.trim();
    if (!name) return null;
    const slug = makeSlug(name);
    return {
      ...EMPTY_CATEGORY,
      id: makeId(),
      name,
      slug,
      href: makeCategoryHref(slug),
    };
  }

  const name = String(category.name || category.title || "").trim();
  const slug = makeSlug(category.slug || name);
  if (!name || !slug) return null;

  return {
    ...EMPTY_CATEGORY,
    ...category,
    id: category.id || makeId(),
    name,
    slug,
    href: String(category.href || makeCategoryHref(slug)).trim(),
    img: String(category.img || category.image || "").trim(),
  };
}

function normalizePromo(promo = {}) {
  return {
    ...EMPTY_PROMO,
    ...promo,
    title: String(promo.title || "").trim(),
    subtitle: String(promo.subtitle || "").trim(),
    buttonText: String(promo.buttonText || "").trim(),
    href: String(promo.href || "").trim(),
    img: String(promo.img || promo.image || "").trim(),
  };
}

function normalizeHomepage(homepageData = {}) {
  return {
    heroSlides: Array.isArray(homepageData.heroSlides)
      ? homepageData.heroSlides.map(normalizeSlide)
      : [],
    categories: Array.isArray(homepageData.categories)
      ? homepageData.categories.map(normalizeCategory).filter(Boolean)
      : [],
    promo: normalizePromo(homepageData.promo || homepageData.promoBanner || {}),
  };
}

function hasContent(data = {}) {
  return Boolean(
    (Array.isArray(data.heroSlides) && data.heroSlides.length > 0) ||
      (Array.isArray(data.categories) && data.categories.length > 0) ||
      (data.promo &&
        (data.promo.title ||
          data.promo.subtitle ||
          data.promo.buttonText ||
          data.promo.href ||
          data.promo.img))
  );
}

function getFallbackHomepage() {
  return {
    heroSlides: [
      {
        ...EMPTY_SLIDE,
        id: makeId(),
        img: "https://img.freepik.com/premium-photo/stack-folded-silk-sarees-vibrant-hues-created-with-generative-ai_419341-23285.jpg",
        title: "Elegance Woven",
        subtitle: "Discover our handloom sarees.",
        href: "/products?category=sarees",
      },
    ],
    categories: [
      {
        ...EMPTY_CATEGORY,
        id: makeId(),
        name: "Banarasi Sarees",
        slug: "banarasi-sarees",
        href: "/products?category=banarasi-sarees",
        img: "https://images.unsplash.com/photo-1621612423739-b6b58675b47a?w=500&auto=format&fit=crop&q=60",
      },
      {
        ...EMPTY_CATEGORY,
        id: makeId(),
        name: "Designer Lehengas",
        slug: "designer-lehengas",
        href: "/products?category=designer-lehengas",
        img: "https://images.unsplash.com/photo-1598141226207-e8036696a2b8?w=500&auto=format&fit=crop&q=60",
      },
    ],
    promo: {
      ...EMPTY_PROMO,
      title: "Mid-Season Sale",
      subtitle: "Up to 30% off on selected items. Don't miss out!",
      buttonText: "Shop Sale",
      href: "/products?category=sale",
      img: "",
    },
  };
}

function stripDataUris(obj) {
  const copy = JSON.parse(JSON.stringify(obj));

  function walk(target) {
    if (!target || typeof target !== "object") return;

    for (const key of Object.keys(target)) {
      const value = target[key];

      if (typeof value === "string" && value.startsWith("data:")) {
        target[key] = "";
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item && typeof item === "object") walk(item);
        });
      } else if (value && typeof value === "object") {
        walk(value);
      }
    }
  }

  walk(copy);
  return copy;
}

function useCachedHomepage(initialState) {
  const [data, setData] = useState(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) return normalizeHomepage(JSON.parse(raw));
    } catch (e) {
      // Ignore bad cache values
    }

    return initialState;
  });

  const saveCache = useCallback((payload) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Ignore sessionStorage errors
    }
  }, []);

  return [data, setData, saveCache];
}

export default function AdminHomepageEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [data, setData, saveCache] = useCachedHomepage(EMPTY_HOMEPAGE);

  const patchData = useCallback(
    (updater) => {
      setData((previous) => {
        const next =
          typeof updater === "function" ? updater(previous) : updater;
        saveCache(next);
        return next;
      });
    },
    [saveCache]
  );

  // Stable setters passed to children to avoid re-renders
  const setHeroSlides = useCallback(
    (slides) =>
      patchData((previous) => ({
        ...previous,
        heroSlides: Array.isArray(slides)
          ? slides.map((slide) => normalizeSlide(slide))
          : [],
      })),
    [patchData]
  );

  const setCategories = useCallback(
    (categories) =>
      patchData((previous) => ({
        ...previous,
        categories: Array.isArray(categories)
          ? categories.map((category) => normalizeCategory(category)).filter(Boolean)
          : [],
      })),
    [patchData]
  );

  const setPromo = useCallback(
    (promo) =>
      patchData((previous) => ({
        ...previous,
        promo: normalizePromo(promo),
      })),
    [patchData]
  );

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/content/homepage", {
          signal: controller.signal,
          timeout: FETCH_TIMEOUT,
        });

        if (ignore) return;

        const normalized = normalizeHomepage(res.data || {});
        patchData(normalized);
      } catch (err) {
        if (!ignore) {
          console.warn("Homepage fetch failed or timed out:", err);
          showToast("Could not load fresh homepage data - showing cached/default.");

          patchData((previous) => {
            if (hasContent(previous)) {
              return previous; // Keep cache
            }
            return getFallbackHomepage();
          });
        }
      } finally {
        clearTimeout(timeoutId);
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [patchData]);

  async function handleSave() {
    try {
      showToast("Saving homepage...");
      setSaving(true);

      const normalizedCategories = (data.categories || [])
        .map((category) => normalizeCategory(category))
        .filter(Boolean);

      const normalizedPromo = normalizePromo(data.promo);

      const payload = stripDataUris({
        heroSlides: (data.heroSlides || []).map((slide) => normalizeSlide(slide)),
        categories: normalizedCategories,
        promo: normalizedPromo,
        // Keep compatibility for any legacy readers.
        promoBanner: normalizedPromo,
      });

      try {
        const sizeKB = new Blob([JSON.stringify(payload)]).size / 1024;
        console.info(`Saving payload size: ${Math.round(sizeKB)} KB`);
        if (sizeKB > 700) {
          showToast("Payload large (>700KB). This may be slow.");
        }
      } catch (e) {
        // Ignore size calc issues
      }

      const res = await api.put("/api/content/homepage", payload, {
        timeout: 20000,
      });

      showToast("Saved homepage successfully!");

      const savedData = normalizeHomepage(res?.data || payload);
      patchData(savedData);

      try {
        localStorage.setItem("homepage_content", JSON.stringify(savedData));
        localStorage.setItem("homepage_content_time", String(Date.now()));
        window.dispatchEvent(new Event("homepage:updated"));
      } catch (e) {
        // Ignore localStorage errors
      }
    } catch (err) {
      console.error("Save error:", err);

      if (!err.response) {
        if (err.code === "ECONNABORTED") {
          showToast("Save timed out. Try again.");
        } else {
          showToast("Network error - check server or connection.");
        }
      } else {
        const status = err.response.status;
        const body = err.response.data;
        const msg =
          (body && (body.error || body.message)) || `Save failed (${status})`;
        showToast(msg);
        console.error("Server response:", body);
      }
    } finally {
      setSaving(false);
    }
  }

  // Show skeleton while loading and fallback to Suspense placeholders for editors.
  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="nm-display text-4xl font-semibold leading-none sm:text-5xl">
              Homepage Editor
            </h2>
            <p className="mt-2 text-sm text-[var(--nm-muted)]">
              Manage content for your main homepage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* If loading and no cached data at all, show a light skeleton.
              Otherwise render editors immediately (they will lazy-load). */}
          {loading && !hasContent(data) ? (
            <div className="animate-pulse space-y-6">
              <div className="h-10 w-48 rounded bg-[var(--nm-bg-elevated)]" />
              <div className="h-60 rounded-3xl bg-[var(--nm-bg-elevated)]" />
              <div className="h-60 rounded-3xl bg-[var(--nm-bg-elevated)]" />
              <div className="h-60 rounded-3xl bg-[var(--nm-bg-elevated)]" />
            </div>
          ) : (
            // Editors will be lazy loaded. Suspense fallback is a small placeholder.
            <Suspense
              fallback={
                <div className="space-y-4">
                  <div className="h-16 rounded-2xl bg-[var(--nm-bg-elevated)]" />
                  <div className="h-36 rounded-2xl bg-[var(--nm-bg-elevated)]" />
                </div>
              }
            >
              <HeroSlidesEditor
                slides={data.heroSlides}
                setSlides={setHeroSlides}
                emptySlide={() => ({ ...EMPTY_SLIDE, id: makeId() })}
              />

              <CategoriesEditor
                categories={data.categories}
                setCategories={setCategories}
                emptyCategory={() => ({ ...EMPTY_CATEGORY, id: makeId() })}
              />

              <PromoEditor
                promo={data.promo}
                setPromo={setPromo}
                emptyPromo={() => ({ ...EMPTY_PROMO })}
              />
            </Suspense>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
