// src/pages/AdminHomepageEditor.jsx
import React, { useEffect, useState, useCallback, lazy, Suspense } from "react";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import AdminLayout from "../components/admin/AdminLayout";

// lazy-load editors to reduce initial bundle
const HeroSlidesEditor = lazy(() =>
  import("../components/admin/HeroSlidesEditor")
);
const CategoriesEditor = lazy(() =>
  import("../components/admin/CategoriesEditor")
);
const PromoEditor = lazy(() => import("../components/admin/PromoEditor"));

const EMPTY_SLIDE = { img: "", alt: "", title: "", subtitle: "", href: "" };
const EMPTY_CATEGORY = { name: "", href: "", img: "" };
const EMPTY_PROMO = {
  title: "",
  subtitle: "",
  buttonText: "",
  href: "",
  img: "",
};

const CACHE_KEY = "admin_homepage_cache_v1";
const FETCH_TIMEOUT = 7000; // ms - abort if backend too slow

function useCachedHomepage(initialState) {
  const [data, setData] = useState(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return initialState;
  });

  const saveCache = (payload) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore sessionStorage errors */
    }
  };

  return [data, setData, saveCache];
}

export default function AdminHomepageEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const initial = {
    heroSlides: [],
    categories: [],
    promoBanner: { ...EMPTY_PROMO },
  };

  const [data, setData, saveCache] = useCachedHomepage(initial);

  // stable setters passed to children to avoid re-renders
  const setHeroSlides = useCallback(
    (slides) => setData((p) => ({ ...p, heroSlides: slides })),
    [setData]
  );
  const setCategories = useCallback(
    (categories) => setData((p) => ({ ...p, categories })),
    [setData]
  );
  const setPromoBanner = useCallback(
    (promo) => setData((p) => ({ ...p, promoBanner: promo })),
    [setData]
  );

  useEffect(() => {
    let abort = false;
    let controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/content/homepage", {
          signal: controller.signal,
          timeout: FETCH_TIMEOUT,
        });
        if (abort) return;

        const homepageData = res.data || {};
        const normalized = {
          heroSlides: Array.isArray(homepageData.heroSlides)
            ? homepageData.heroSlides
            : [],
          categories: Array.isArray(homepageData.categories)
            ? homepageData.categories
            : [],
          promoBanner: homepageData.promoBanner || { ...EMPTY_PROMO },
        };

        setData(normalized);
        saveCache(normalized); // cache for next load
      } catch (err) {
        // If fetch failed or aborted, keep cached data (if any) and show toast once
        if (!abort) {
          console.warn("Homepage fetch failed or timed out:", err);
          showToast(
            "Could not load fresh homepage data — showing cached/default.",
            "error"
          );
          // If there's nothing in cache, set small defaults so UI isn't empty
          setData((prev) => {
            if (
              (prev.heroSlides && prev.heroSlides.length) ||
              (prev.categories && prev.categories.length)
            ) {
              return prev; // keep cache
            }
            // fallback minimal defaults (same as before)
            return {
              heroSlides: [
                {
                  ...EMPTY_SLIDE,
                  img: "https://img.freepik.com/premium-photo/stack-folded-silk-sarees-vibrant-hues-created-with-generative-ai_419341-23285.jpg",
                  title: "Elegance Woven",
                  subtitle: "Discover our handloom sarees.",
                  href: "/products?category=Saree",
                },
              ],
              categories: [
                {
                  ...EMPTY_CATEGORY,
                  name: "Banarasi Sarees",
                  href: "/products?category=Banarasi",
                  img: "https://images.unsplash.com/photo-1621612423739-b6b58675b47a?w=500&auto=format&fit=crop&q=60",
                },
                {
                  ...EMPTY_CATEGORY,
                  name: "Designer Lehengas",
                  href: "/products?category=Lehenga",
                  img: "https://images.unsplash.com/photo-1598141226207-e8036696a2b8?w=500&auto=format&fit=crop&q=60",
                },
              ],
              promoBanner: {
                ...EMPTY_PROMO,
                title: "Mid-Season Sale",
                subtitle: "Up to 30% off on selected items. Don't miss out!",
                buttonText: "Shop Sale",
                href: "/products?category=Sale",
                img: "",
              },
            };
          });
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    })();

    return () => {
      abort = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  function stripDataUris(obj) {
    const copy = JSON.parse(JSON.stringify(obj));
    function walk(o) {
      if (!o || typeof o !== "object") return;
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === "string" && v.startsWith("data:")) {
          o[k] = "";
        } else if (Array.isArray(v)) {
          v.forEach((it) => (typeof it === "object" ? walk(it) : null));
        } else if (typeof v === "object") {
          walk(v);
        }
      }
    }
    walk(copy);
    return copy;
  }

  async function handleSave() {
    try {
      showToast("Saving homepage…", "info");
      setSaving(true);

      const payload = stripDataUris(data);

      try {
        const sizeKB = new Blob([JSON.stringify(payload)]).size / 1024;
        console.info(`Saving payload size: ${Math.round(sizeKB)} KB`);
        if (sizeKB > 700) {
          showToast("Payload large (>700KB). This may be slow.", "warning");
        }
      } catch (e) {}

      const res = await api.put("/api/content/homepage", payload, {
        timeout: 20000,
      });

      showToast("Saved homepage successfully!", "success");

      if (res && res.data) setData(res.data);
      try {
        sessionStorage.setItem(
          "admin_homepage_cache_v1",
          JSON.stringify(res.data || payload)
        );
      } catch (e) {}
    } catch (err) {
      console.error("Save error:", err);

      if (!err.response) {
        if (err.code === "ECONNABORTED")
          showToast("Save timed out. Try again.", "error");
        else showToast("Network error — check server or connection.", "error");
      } else {
        const status = err.response.status;
        const body = err.response.data;
        const msg =
          (body && (body.error || body.message)) || `Save failed (${status})`;
        showToast(msg, "error");
        console.error("Server response:", body);
      }
    } finally {
      setSaving(false);
    }
  }

  // QUICK UI: show skeleton while loading and fallback to Suspense placeholders for editors
  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Homepage Editor
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage content for your main homepage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2.5 rounded-md font-medium transition ${
                saving
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              }`}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* If loading and no cached data at all, show a light skeleton.
              Otherwise render editors immediately (they'll lazy-load). */}
          {loading &&
          (!data || (!data.heroSlides?.length && !data.categories?.length)) ? (
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 dark:bg-zinc-700 w-48 rounded" />
              <div className="h-60 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
              <div className="h-60 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
              <div className="h-60 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
            </div>
          ) : (
            // Editors will be lazy loaded. Suspense fallback is small placeholder to keep UI snappy.
            <Suspense
              fallback={
                <div className="space-y-4">
                  <div className="h-16 bg-gray-100 dark:bg-zinc-800 rounded" />
                  <div className="h-36 bg-gray-50 dark:bg-zinc-900 rounded" />
                </div>
              }
            >
              <HeroSlidesEditor
                slides={data.heroSlides}
                setSlides={setHeroSlides}
                emptySlide={() => ({ ...EMPTY_SLIDE, id: Math.random() })}
              />

              <CategoriesEditor
                categories={data.categories}
                setCategories={setCategories}
                emptyCategory={() => ({ ...EMPTY_CATEGORY, id: Math.random() })}
              />

              <PromoEditor
                promo={data.promoBanner}
                setPromo={setPromoBanner}
                emptyPromo={() => ({ ...EMPTY_PROMO })}
              />
            </Suspense>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}