import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "/src/api/axios";

/* ================= ASSETS ================= */
const HERO_IMAGE =
  "/mnt/data/becaf068-e501-4690-ad1c-3603d8635e6a.png";
const DEFAULT_CAT_IMAGE =
  "/mnt/data/d5ff4896-1e72-4950-a3f0-2be7cede2a70.png";

/* ================= CONFIG ================= */
const SLIDE_MS = 5200;
const SWIPE_OFFSET = 70;
const SWIPE_VELOCITY = 600;

/* ================= COMPONENT ================= */
export function HeroSlider({
  slides = [
    {
      title: "Elegant Wine Purple Silk Saree",
      subtitle: "Lightweight Party Wear Saree for Modern Women",
      img: HERO_IMAGE,
      href: "/shop",
      cta: "View All",
    },
  ],
  initialIndex = 0,
  categories = [],
  onCategoryClick = null,
}) {
  const navigate = useNavigate();

  /* ---------------- state ---------------- */
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cats, setCats] = useState([]);

  const containerRef = useRef(null);
  const timerRef = useRef(null);

  const totalSlides = slides.length || 1;

  /* ---------------- derived ---------------- */
  const currentSlide = useMemo(
    () =>
      slides[index] || {
        title: "",
        subtitle: "",
        img: HERO_IMAGE,
        href: "/",
      },
    [slides, index]
  );

  /* ---------------- reduced motion ---------------- */
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  /* ---------------- visibility ---------------- */
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () =>
      document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* ---------------- autoplay ---------------- */
  const canAutoplay =
    !paused &&
    !dragging &&
    visible &&
    !reducedMotion &&
    totalSlides > 1;

  useEffect(() => {
    if (!canAutoplay) return;
    timerRef.current = setTimeout(
      () => setIndex((i) => (i + 1) % totalSlides),
      SLIDE_MS
    );
    return () => clearTimeout(timerRef.current);
  }, [index, canAutoplay, totalSlides]);

  /* ---------------- navigation ---------------- */
  const pauseTemporarily = () => {
    setPaused(true);
    setTimeout(() => setPaused(false), 600);
  };

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % totalSlides);
    pauseTemporarily();
  }, [totalSlides]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + totalSlides) % totalSlides);
    pauseTemporarily();
  }, [totalSlides]);

  /* ================= CATEGORIES (UNCHANGED LOGIC) ================= */
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await api.get("/api/content/homepage");
        if (!mounted) return;

        if (Array.isArray(res.data?.categories)) {
          setCats(
            res.data.categories.map((c) =>
              typeof c === "string"
                ? { title: c, slug: c, img: DEFAULT_CAT_IMAGE }
                : {
                    title: c.name || c.title || "",
                    slug: c.slug || "",
                    img: c.img || c.image || DEFAULT_CAT_IMAGE,
                    href: c.href || null,
                  }
            )
          );
          return;
        }
      } catch {}

      if (categories.length) {
        setCats(
          categories.map((c) =>
            typeof c === "string"
              ? { title: c, slug: c, img: DEFAULT_CAT_IMAGE }
              : {
                  title: c.title || c.name || "",
                  slug: c.slug || "",
                  img: c.img || DEFAULT_CAT_IMAGE,
                  href: c.href || null,
                }
          )
        );
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [categories]);

  /* ================= CATEGORY CLICK ================= */
  const handleCategoryClick = (cat) => {
    if (!cat) return;

    if (typeof onCategoryClick === "function") {
      onCategoryClick(cat);
      return;
    }

    if (cat.href) {
      window.location.href = cat.href;
      return;
    }

    if (!cat.slug) return;

    navigate(
      `/products?sort=-createdAt&category=${encodeURIComponent(
        cat.slug
      )}`
    );
  };

  /* ================= RENDER ================= */
  return (
    <section
      ref={containerRef}
      className="w-full border-b bg-[#fafafa] dark:bg-zinc-900 border-gray-200 dark:border-zinc-700"
    >
      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-14 items-center">
          {/* LEFT CONTENT */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                  {currentSlide.title}
                </h1>

                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  {currentSlide.subtitle}
                </p>

                <div className="mt-6 flex gap-4">
                  <Link
                    to={currentSlide.href}
                    className="px-6 py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition"
                  >
                    {currentSlide.cta || "Shop Now"}
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* CATEGORY PILLS */}
            <div className="mt-10 flex flex-wrap gap-3">
              {cats.map((c) => (
                <button
                  key={c.slug || c.title}
                  onClick={() => handleCategoryClick(c)}
                  className="px-4 py-2 rounded-full border bg-white dark:bg-zinc-800 text-sm text-gray-700 dark:text-white border-gray-300 dark:border-zinc-700 hover:border-black dark:hover:border-white transition"
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative rounded-3xl overflow-hidden">
            <motion.img
              key={index}
              src={currentSlide.img}
              alt={currentSlide.title}
              className="w-full h-[520px] lg:h-[680px] object-cover"
              initial={{ scale: 1.04, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />

            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full shadow bg-white text-gray-800 dark:bg-zinc-700 dark:text-white"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full shadow bg-white text-gray-800 dark:bg-zinc-700 dark:text-white"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
