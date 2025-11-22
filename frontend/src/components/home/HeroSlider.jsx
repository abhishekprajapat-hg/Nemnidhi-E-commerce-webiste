// src/components/HeroSlider.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "/src/api/axios";

// --- asset paths (environment will transform /mnt/data paths to URLs) ---
const HERO_IMAGE = "/mnt/data/becaf068-e501-4690-ad1c-3603d8635e6a.png";
const DEFAULT_CAT_IMAGE = "/mnt/data/d5ff4896-1e72-4950-a3f0-2be7cede2a70.png";

// --- configuration ---
const SLIDE_MS = 5200;
const SWIPE_OFFSET = 70;
const SWIPE_VELOCITY = 600;

export function HeroSlider({
  slides = [
    {
      title: "Products you Love.",
      subtitle: "Quality we Trust. Handpicked collections for your special moments.",
      img: HERO_IMAGE,
      href: "/shop",
      cta: "Shop Now",
      badge: "Gold Drop",
      alt: "Gold couple",
    },
  ],
  initialIndex = 0,
  categories = [], // optional: will prefer admin-managed categories when available
  onCategoryClick = null,
  previewViewport = null,
}) {
  const navigate = useNavigate();

  // ---- state & refs ----
  const [index, setIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const slidesRef = useRef(slides);
  const containerRef = useRef(null);
  const autoplayRef = useRef(null);
  const runningRef = useRef(false);

  // local categories (normalized)
  const [localCategories, setLocalCategories] = useState(categories || []);

  // keep slidesRef updated (avoid stale closure in autoplay)
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // --- normalize & fetch admin categories (once) ---
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get("/api/content/homepage");
        if (!mounted) return;
        const homepage = res.data || {};
        if (Array.isArray(homepage.categories) && homepage.categories.length) {
          setLocalCategories(
            homepage.categories.map((c) =>
              typeof c === "string"
                ? { title: c, slug: c, img: DEFAULT_CAT_IMAGE }
                : {
                    title: c.name || c.title || c.label || "",
                    slug:
                      c.slug ||
                      (c.name || c.title || "")
                        .toString()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, ""),
                    img: c.img || c.image || DEFAULT_CAT_IMAGE,
                    href: c.href || null,
                  }
            )
          );
          return;
        }
      } catch (err) {
        // silent fallback to provided categories below
      }

      // fallback to provided categories prop (if any)
      if (Array.isArray(categories) && categories.length) {
        setLocalCategories(
          categories.map((c) =>
            typeof c === "string"
              ? { title: c, slug: c, img: DEFAULT_CAT_IMAGE }
              : {
                  title: c.title || c.name || c.label || "",
                  slug: c.slug || c.title || c.name || "",
                  img: c.img || DEFAULT_CAT_IMAGE,
                  href: c.href || null,
                }
          )
        );
        return;
      }

      // final fallback
      setLocalCategories([
        { title: "Sarees", slug: "sarees", img: DEFAULT_CAT_IMAGE },
        { title: "Tops", slug: "tops", img: DEFAULT_CAT_IMAGE },
        { title: "Sweaters", slug: "sweaters", img: DEFAULT_CAT_IMAGE },
        { title: "Western", slug: "western", img: DEFAULT_CAT_IMAGE },
      ]);
    }

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reduced motion
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReduced(Boolean(mq.matches));
    onChange();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // visibility (pause when not visible)
  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // intersection observer (pause when hero offscreen)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(!document.hidden && entry.isIntersecting),
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fix index out-of-range when slides change
  useEffect(() => {
    if (!slides || slides.length === 0) {
      setIndex(0);
      return;
    }
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index, slides]);

  // preload next image
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const next = slides[(index + 1) % slides.length];
    if (next && next.img) {
      const img = new Image();
      img.src = next.img;
    }
  }, [index, slides]);

  // ---------------- autoplay (controlled) ----------------
  const canAutoplay = useCallback(() => {
    return !isPaused && !prefersReduced && Boolean(isVisible) && !isDragging && slidesRef.current && slidesRef.current.length > 1;
  }, [isPaused, prefersReduced, isVisible, isDragging]);

  const startAutoplay = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    const tick = () => {
      autoplayRef.current = setTimeout(() => {
        if (canAutoplay()) {
          setIndex((i) => (i + 1) % slidesRef.current.length);
        }
        if (runningRef.current) tick();
      }, SLIDE_MS);
    };
    tick();
  }, [canAutoplay]);

  const stopAutoplay = useCallback(() => {
    runningRef.current = false;
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    // small delayed kickoff
    const kickoff = setTimeout(() => {
      if (canAutoplay()) startAutoplay();
    }, 120);
    return () => {
      clearTimeout(kickoff);
      stopAutoplay();
    };
  }, [canAutoplay, startAutoplay, stopAutoplay]);

  useEffect(() => {
    if (canAutoplay()) startAutoplay();
    else stopAutoplay();
  }, [canAutoplay, startAutoplay, stopAutoplay]);

  // ---------------- navigation helpers ----------------
  const handleNext = useCallback(() => {
    stopAutoplay();
    setIndex((i) => (i + 1) % slides.length);
    setIsPaused(true);
    window.setTimeout(() => setIsPaused(false), 650);
  }, [slides.length, stopAutoplay]);

  const handlePrev = useCallback(() => {
    stopAutoplay();
    setIndex((i) => (i - 1 + slides.length) % slides.length);
    setIsPaused(true);
    window.setTimeout(() => setIsPaused(false), 650);
  }, [slides.length, stopAutoplay]);

  // user-level exposed handlers (used on UI)
  function manualNext() {
    handleNext();
  }
  function manualPrev() {
    handlePrev();
  }

  // category click
  const handleCategoryClick = useCallback(
    (cat) => {
      if (typeof onCategoryClick === "function") return onCategoryClick(cat);
      if (cat && (cat.slug || cat.href)) {
        if (cat.href) return (window.location.href = cat.href);
        return navigate(`/products?sort=-createdAt&category=${encodeURIComponent(cat.slug)}`);
      }
    },
    [navigate, onCategoryClick]
  );

  // derived/memoized things
  const slide = useMemo(() => slides[index] || { title: "", subtitle: "", img: HERO_IMAGE, href: "/" }, [slides, index]);
  const isMobilePreview = previewViewport === "mobile";
  const cats = useMemo(() => localCategories || [], [localCategories]);

  // cleanup on unmount
  useEffect(() => () => stopAutoplay(), [stopAutoplay]);

  // ---------- render ----------
  return (
    <section
      ref={containerRef}
      className="relative w-full bg-gradient-to-b from-[#3b271a] to-[#5a3a2a] text-white overflow-hidden"
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-label="Gold hero slider"
    >
      <div className={`max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-20 ${isMobilePreview ? "overflow-hidden" : ""}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* LEFT: Upgraded Image Carousel */}
          <div className="relative h-[420px] lg:h-[640px] rounded-2xl overflow-hidden">
            <motion.div
              className="absolute inset-0 flex items-stretch"
              onPointerEnter={() => setIsPaused(true)}
              onPointerLeave={() => setIsPaused(false)}
              role="region"
              aria-roledescription="carousel"
              aria-label="Hero image carousel"
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragStart={() => {
                  setIsDragging(true);
                  setIsPaused(true);
                }}
                onDragEnd={(_, info) => {
                  setIsDragging(false);
                  setIsPaused(false);
                  const offset = info.offset.x;
                  const velocity = info.velocity.x;
                  if (offset < -SWIPE_OFFSET || velocity < -SWIPE_VELOCITY) manualNext();
                  else if (offset > SWIPE_OFFSET || velocity > SWIPE_VELOCITY) manualPrev();
                }}
                className="absolute inset-0 flex touch-pan-x will-change-transform"
              >
                <div className="w-full flex-shrink-0 relative">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`hero-${index}`}
                      src={slide.img}
                      alt={slide.alt || slide.title}
                      initial={{ opacity: 0.0, scale: 1.03, x: 20 }}
                      animate={{ opacity: 1.0, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -18, scale: 0.98 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="w-full h-full object-cover block"
                      loading={index === 0 ? "eager" : "lazy"}
                      style={{ willChange: "transform, opacity" }}
                      whileHover={{ scale: 1.03 }}
                    />
                  </AnimatePresence>

                  {/* overlays for readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30 pointer-events-none" />
                </div>
              </motion.div>
            </motion.div>

            {/* caption */}
            <div className="absolute left-6 bottom-8 lg:left-12 lg:bottom-16 max-w-lg z-20 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`caption-${index}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="pointer-events-auto"
                >
                  <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight text-yellow-100">{slide.title}</h1>
                  <p className="mt-3 text-sm lg:text-base text-yellow-200/90 max-w-md">{slide.subtitle}</p>

                  <div className="mt-6 flex gap-4 items-center">
                    <Link to={slide.href} className="inline-block bg-[#5b2f1a] border border-yellow-300/60 text-yellow-100 px-6 py-3 rounded-lg shadow-lg hover:scale-[1.02] transform-gpu transition pointer-events-auto">
                      {slide.cta || "Shop Now"}
                    </Link>

                    <Link to={slide.href} className="inline-block px-4 py-2 rounded-md bg-white/10 ring-1 ring-white/10 text-sm pointer-events-auto">
                      Explore
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* badge */}
            <div className="absolute left-8 top-10 z-20 pointer-events-none">
              <div className="bg-black/40 text-white px-4 py-2 rounded-full backdrop-blur text-sm shadow-xl">{slide.badge || "Limited drop"}</div>
            </div>

            {/* controls */}
            <button onClick={manualPrev} aria-label="Previous slide" className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 text-white shadow-sm">‹</button>
            <button onClick={manualNext} aria-label="Next slide" className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 text-white shadow-sm">›</button>

            {/* dots + progress */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
              {slides.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  onClick={() => {
                    stopAutoplay();
                    setIndex(i);
                    setIsPaused(true);
                    window.setTimeout(() => setIsPaused(false), 650);
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`rounded-full transition-all ${i === index ? "bg-yellow-100 w-10 h-2 shadow-lg" : "bg-yellow-100/40 w-3 h-3"}`}
                />
              ))}
            </div>

            {!prefersReduced && (
              <motion.div key={`progress-${index}`} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SLIDE_MS / 1000, ease: "linear" }} className="absolute left-0 right-0 bottom-0 h-1 origin-left bg-gradient-to-r from-yellow-400 to-yellow-200 z-40" style={{ transformOrigin: "left" }} />
            )}
          </div>

          {/* RIGHT: categories cards */}
          <div className="relative w-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 lg:gap-x-10 lg:gap-y-8">
              {cats.map((c) => (
                <button key={c.title || c.slug} onClick={() => handleCategoryClick(c)} aria-label={`Open ${c.title}`} className="flex flex-col items-center group transition-transform duration-400 hover:scale-105">
                  <div className="w-36 h-44 lg:w-40 lg:h-52 bg-gradient-to-b from-[#4a2f20] to-[#3b2416] rounded-tl-2xl rounded-tr-2xl border border-yellow-400/20 shadow-md overflow-hidden relative transition-transform duration-500 ease-out group-hover:scale-105">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-transparent pointer-events-none" />
                    <img src={c.img || DEFAULT_CAT_IMAGE} alt={c.title} className="w-full h-full object-cover object-center opacity-95" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_CAT_IMAGE; }} />
                    <div className="absolute bottom-0 left-0 right-0 py-2 text-center bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-sm lg:text-base font-semibold text-yellow-100">{c.title}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{/* decorative area */}</div>
          </div>
        </div>
      </div>
    </section>
  );
}