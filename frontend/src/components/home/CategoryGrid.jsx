import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Section from "./Section";

/**
 * ProgressiveImage: preloads image, shows placeholder until loaded,
 * falls back to inline SVG if load fails or times out.
 * Enhanced with fade-in + transform on load.
 */
function ProgressiveImage({ src, alt, className = "", sizes, srcSet, timeout = 6000 }) {
  const [status, setStatus] = useState("pending"); // pending | loaded | failed
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    if (!src) {
      setStatus("failed");
      return;
    }

    let mounted = true;
    const img = new Image();
    if (srcSet) img.srcset = srcSet;
    if (sizes) img.sizes = sizes;
    img.src = src;
    img.decoding = "async";

    const t = setTimeout(() => {
      if (!mounted) return;
      setStatus((s) => (s === "pending" ? "failed" : s));
    }, timeout);

    img.onload = () => {
      if (!mounted) return;
      clearTimeout(t);
      setCurrentSrc(src);
      setStatus("loaded");
    };
    img.onerror = () => {
      if (!mounted) return;
      clearTimeout(t);
      setStatus("failed");
    };

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [src, srcSet, sizes, timeout]);

  const fallbackSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dy='.3em' font-size='20' text-anchor='middle' fill='%23999'%3EImage%20Unavailable%3C/text%3E%3C/svg%3E";

  if (status === "loaded") {
    return (
      <img
        src={currentSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} w-full h-full object-cover object-center`}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = fallbackSvg;
        }}
      />
    );
  }

  if (status === "failed") {
    return <img src={fallbackSvg} alt={alt} className={`${className} w-full h-full object-cover object-center`} />;
  }

  // pending: skeleton placeholder (subtle shimmer)
  return (
    <div
      aria-hidden
      className={`${className} w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse`}
      style={{ display: "block" }}
    />
  );
}

/**
 * CategoryGrid: animated, accessible category grid.
 *
 * Requirements: tailwind + framer-motion installed.
 */
export default function CategoryGrid({ categories = [], columns = { base: 1, md: 3 } }) {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(Boolean(m.matches));
    update();
    if (m.addEventListener) m.addEventListener("change", update);
    else if (m.addListener) m.addListener(update);
    return () => {
      if (m.removeEventListener) m.removeEventListener("change", update);
      else if (m.removeListener) m.removeListener("change", update);
    };
  }, []);

  if (!Array.isArray(categories) || categories.length === 0) {
    // lightweight skeleton grid so layout doesn't jump
    return (
      <Section className="bg-[#fdf7f7] dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        </div>
      </Section>
    );
  }

  // framer-motion variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const card = {
    hidden: { opacity: 0, y: 14, scale: 0.99 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
    hover: { scale: 1.02, transition: { duration: 0.25 } },
  };

  const imgVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.08, transition: { duration: 0.45, ease: "easeOut" } },
    loaded: { scale: 1, transition: { duration: 0.35 } },
  };

  return (
    <Section className="bg-[#fdf7f7] dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">Shop by Category</h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {categories.map((cat, idx) => {
            const key = cat?._id || cat?.name || `cat-${idx}`;
            let imgUrl = cat?.img || "";
            if (typeof imgUrl === "string" && (imgUrl.startsWith("src/") || imgUrl.startsWith("./src/"))) {
              imgUrl = imgUrl.replace(/^\.?\/?src\/assets/, "/assets");
            }

            return (
              <motion.article
                layout
                key={key}
                variants={card}
                whileHover={!prefersReduced ? "hover" : undefined}
                className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg focus-within:ring-4 focus-within:ring-pink-200 dark:focus-within:ring-rose-800"
              >
                <Link
                  to={cat?.href || "#"}
                  aria-label={cat?.name || "Category"}
                  className="absolute inset-0 focus:outline-none"
                >
                  {/* animated image wrapper */}
                  <motion.div
                    initial="initial"
                    animate="loaded"
                    whileHover={!prefersReduced ? "hover" : undefined}
                    variants={imgVariants}
                    className="w-full h-full will-change-transform"
                    style={{ transformOrigin: "center" }}
                  >
                    <div className="w-full h-full relative">
                      <ProgressiveImage
                        src={imgUrl}
                        alt={cat?.name || "category image"}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out"
                      />
                      {/* layered overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-400" />
                      {/* subtle decorative ring on hover */}
                      <div className="absolute -left-8 -top-8 w-36 h-36 rounded-full bg-pink-200 opacity-0 group-hover:opacity-30 mix-blend-soft-light transition-all duration-500 pointer-events-none" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                    <motion.h3
                      className="text-2xl font-semibold text-white drop-shadow-md"
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.08 + idx * 0.02 }}
                    >
                      {cat?.name || "Category"}
                    </motion.h3>

                    <motion.p
                      className="mt-1 text-sm text-white/85 max-w-[85%]"
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.12 + idx * 0.02 }}
                    >
                      {cat?.subtitle || ""}
                    </motion.p>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}
