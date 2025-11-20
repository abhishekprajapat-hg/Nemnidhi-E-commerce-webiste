import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function HeroSlider({ slides = [], initialIndex = 0 }) {
  const [index, setIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const slidesRef = useRef(slides);
  const timerRef = useRef(null);
  const runningRef = useRef(false);

  const SLIDE_MS = 5200;
  const SWIPE_THRESHOLD = 60;

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setPrefersReduced(false);
      return;
    }
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(Boolean(m.matches));
    update();
    if (m.addEventListener) m.addEventListener("change", update);
    else if (m.addListener) m.addListener(update);
    return () => {
      if (m.removeEventListener) m.removeEventListener("change", update);
      else if (m.removeListener) m.removeListener(update);
    };
  }, []);

  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setIsVisible(!document.hidden && e.isIntersecting);
      },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const canAutoplay = () =>
    !isPaused &&
    !prefersReduced &&
    Boolean(isVisible) &&
    slidesRef.current &&
    slidesRef.current.length > 1 &&
    !isDragging;

  const startAutoplay = () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const tick = () => {
      timerRef.current = setTimeout(() => {
        if (canAutoplay()) {
          setIndex((i) => (i + 1) % slidesRef.current.length);
        }
        if (runningRef.current) tick();
      }, SLIDE_MS);
    };

    tick();
  };

  const stopAutoplay = () => {
    runningRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    let kickoffId = null;
    let retryId = null;

    kickoffId = setTimeout(() => {
      if (canAutoplay()) startAutoplay();
      else {
        retryId = setTimeout(() => {
          if (canAutoplay()) startAutoplay();
        }, 300);
      }
    }, 120);

    return () => {
      if (kickoffId) clearTimeout(kickoffId);
      if (retryId) clearTimeout(retryId);
      stopAutoplay();
    };
  }, [slides.length, prefersReduced, isVisible]);

  useEffect(() => {
    if (canAutoplay()) startAutoplay();
    else stopAutoplay();
  }, [isPaused, prefersReduced, isVisible, isDragging, slides.length]);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const next = slides[(index + 1) % slides.length];
    if (next && next.img) {
      const img = new Image();
      img.src = next.img;
    }
  }, [index, slides]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") manualNext();
      else if (e.key === "ArrowLeft") manualPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!slides || slides.length === 0) {
      setIndex(0);
      return;
    }
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index, slides]);

  function manualNext() {
    stopAutoplay();
    setIndex((i) => (i + 1) % slides.length);
    setIsPaused(true);
    window.setTimeout(() => setIsPaused(false), 900);
  }

  function manualPrev() {
    stopAutoplay();
    setIndex((i) => (i - 1 + slides.length) % slides.length);
    setIsPaused(true);
    window.setTimeout(() => setIsPaused(false), 900);
  }

  if (!slides || slides.length === 0) {
    return (
      <div className="relative min-h-[50vh] flex items-center justify-center bg-black/5 dark:bg-zinc-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Hero not configured</h2>
          <p className="mt-2 text-sm text-gray-600">Add slides — try images with a focus area for best results.</p>
        </div>
      </div>
    );
  }

  const slide = slides[index];

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden min-h-[70vh] lg:min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#fff7fb] to-[#fff9fb] dark:from-zinc-900 dark:to-zinc-800"
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-label="Hatke hero slider"
    >
      <div
        className="lg:hidden relative w-full h-[56vh]"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={`m-${index}`}
            src={slide.img}
            alt={slide.alt || slide.title}
            initial={{ opacity: 0, y: 8, scale: 1.02 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.48 }}
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={() => {
              setIsDragging(true);
              setIsPaused(true);
            }}
            onDragEnd={(_, info) => {
              setIsDragging(false);
              setIsPaused(false);
              const offset = info.offset.x;
              if (offset < -SWIPE_THRESHOLD) manualNext();
              else if (offset > SWIPE_THRESHOLD) manualPrev();
            }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
        <div className="px-6 md:px-12 lg:px-20 py-8 lg:py-28 flex items-start lg:items-center">
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.h2
                key={`title-${index}`}
                initial={{ y: 36, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -18, opacity: 0 }}
                transition={{ duration: 0.52, ease: "easeOut" }}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight"
              >
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-400">
                  {slide.title}
                </span>
              </motion.h2>
            </AnimatePresence>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="mt-5 text-sm md:text-base text-gray-700 dark:text-gray-300 max-w-prose">
              {slide.subtitle}
            </motion.p>

            <motion.div className="mt-6 flex gap-4 items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Link to={slide.href} className="inline-flex items-center justify-center rounded-full px-5 py-2.5 font-semibold text-sm bg-[#ff2d95] text-white shadow-2xl hover:scale-105 transform-gpu">
                {slide.cta || "Shop the vibe"}
              </Link>

              <Link to={slide.href} className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-sm text-black/80 dark:text-white/80 ring-1 ring-white/10">
                Lookbook
              </Link>
            </motion.div>
          </div>
        </div>

        <div
          className="hidden lg:flex relative w-full h-[100vh] items-center justify-center"
          onPointerEnter={() => setIsPaused(true)}
          onPointerLeave={() => setIsPaused(false)}
        >
          <div className="relative w-[78%] max-w-4xl h-[78%] rounded-3xl shadow-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={`d-${index}`}
                src={slide.img}
                alt={slide.alt || slide.title}
                initial={{ opacity: 0, scale: 1.04, x: 18 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98, x: -18 }}
                transition={{ opacity: { duration: 0.6 }, duration: 0.6, ease: "easeOut" }}
                className="w-full h-full object-cover block"
                loading={index === 0 ? "eager" : "lazy"}
                style={{ willChange: "transform, opacity", touchAction: "pan-y" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragStart={() => {
                  setIsDragging(true);
                  setIsPaused(true);
                }}
                onDragEnd={(_, info) => {
                  setIsDragging(false);
                  setIsPaused(false);
                  const offset = info.offset.x;
                  if (offset < -SWIPE_THRESHOLD) manualNext();
                  else if (offset > SWIPE_THRESHOLD) manualPrev();
                }}
              />
            </AnimatePresence>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-50 via-white to-rose-50 opacity-30 mix-blend-overlay animate-[pulse_10s_infinite]" />
            </div>

            <div className="absolute left-8 top-10 bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur text-sm shadow-xl">
              {slide.badge || "Limited drop"}
            </div>

            <button
              onClick={manualPrev}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full backdrop-blur hover:scale-105 transition-transform z-30"
            >
              ‹
            </button>
            <button
              onClick={manualNext}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full backdrop-blur hover:scale-105 transition-transform z-30"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={`dot-${i}`}
            onClick={() => {
              stopAutoplay();
              setIndex(i);
              setIsPaused(true);
              window.setTimeout(() => setIsPaused(false), 900);
            }}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all ${i === index ? "bg-white w-10 h-2 shadow-lg" : "bg-white/60 w-3 h-3"}`}
          />
        ))}
      </div>

      {!prefersReduced && (
        <motion.div
          key={`progress-${index}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
          className="absolute left-0 right-0 bottom-0 h-1 origin-left bg-gradient-to-r from-pink-500 to-rose-400 z-40"
          style={{ transformOrigin: "left" }}
        />
      )}
    </section>
  );
}
