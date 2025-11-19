// src/components/home/HeroSlider.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LazyImage
 * - Shows a low-res placeholder (optional) until the real image loads.
 * - Uses IntersectionObserver (and falls back to native loading="lazy" where supported).
 * - Returns a motion.img so you keep framer-motion transitions.
 */
function LazyImage({
  src,
  alt = "",
  className = "",
  placeholder,
  width,
  height,
  style = {},
  rootMargin = "200px",
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const imgEl = ref.current;
    if (!imgEl) return;

    // If browser supports native lazy loading we can mark visible immediately;
    // still we keep IntersectionObserver as progressive enhancement for browsers without it.
    if ("loading" in HTMLImageElement.prototype) {
      setVisible(true);
      return;
    }

    let obs;
    try {
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisible(true);
              obs.disconnect();
            }
          });
        },
        { rootMargin }
      );
      obs.observe(imgEl);
    } catch (err) {
      // If IntersectionObserver not supported, show immediately
      setVisible(true);
    }
    return () => {
      if (obs && obs.disconnect) obs.disconnect();
    };
  }, [rootMargin]);

  // Inline style to reserve space and avoid CLS if width/height provided
  const wrapperStyle = { width: width ? width : "100%", height: height ? height : undefined, ...style };

  return (
    <div ref={ref} className={`lazy-image-wrapper ${className}`} style={{ position: "relative", overflow: "hidden", ...wrapperStyle }}>
      {/* placeholder (blurred) */}
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt={alt}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(6px)",
            transform: "scale(1.02)",
          }}
        />
      )}

      <AnimatePresence mode="popLayout">
        {visible && (
          <motion.img
            key={src}
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: loaded ? 1 : 0.95, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect fill='%23f3f4f6' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%23999'%3EImage%20Not%20Found%3C/text%3E%3C/svg%3E";
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            {...rest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearTimeout(t);
  }, [index, slides]);

  if (!slides || slides.length === 0) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Hero Section Not Configured
          </h2>
          <p className="text-gray-500 mt-2">Please add slides in the admin homepage editor.</p>
        </div>
      </div>
    );
  }

  const slide = slides[index];

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-stretch bg-[#fdf7f7] dark:bg-zinc-900 text-gray-900 dark:text-white overflow-hidden">
      <div className="relative z-10 w-full lg:w-1/2 flex items-center">
        <div className="max-w-2xl px-8 md:px-12 lg:px-16 py-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="bg-transparent"
            >
              {slide.eyebrow && (
                <div className="text-xs tracking-wider text-gray-600 dark:text-gray-300 mb-3">
                  {slide.eyebrow}
                </div>
              )}

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-black dark:text-white leading-tight">
                {slide.title}
              </h1>

              <p className="mt-6 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-lg">
                {slide.subtitle}
              </p>

              <div className="mt-10 flex items-center gap-6">
                <Link
                  to={slide.href}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-md border border-black/10 bg-black text-white dark:bg-white dark:text-black font-semibold text-sm md:text-base hover:scale-[1.02] transition-transform duration-200 shadow-sm"
                >
                  SHOP NOW
                </Link>

                <Link
                  to={slide.href}
                  className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium hover:underline"
                >
                  EXPLORE LOOKBOOK
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop image */}
      <div className="hidden lg:block w-1/2 relative">
        <AnimatePresence mode="wait">
          <LazyImage
            key={index}
            src={slide.img}
            alt={slide.alt}
            width="100%"
            height="100%"
            className="absolute inset-0"
            // optional: small placeholder or base64 tiny image to avoid flash
            placeholder={slide.placeholder || undefined}
          />
        </AnimatePresence>
      </div>

      {/* Mobile image overlay */}
      <div className="lg:hidden absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <LazyImage
            key={`mobile-${index}`}
            src={slide.img}
            alt={slide.alt}
            width="100%"
            height="100%"
            className="absolute inset-0"
            style={{ filter: "brightness(.55)" }}
            placeholder={slide.placeholder || undefined}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-black/0 lg:hidden" />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all ${i === index ? "bg-white w-6 h-3" : "bg-white/60 w-3 h-3"}`}
          />
        ))}
      </div>
    </section>
  );
}
