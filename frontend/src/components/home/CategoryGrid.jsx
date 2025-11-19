import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Section from "./Section";

/**
 * ProgressiveImage: preloads image, shows placeholder until loaded,
 * and falls back to an inline SVG if load fails or times out.
 */
function ProgressiveImage({ src, alt, className, sizes, srcSet, timeout = 6000 }) {
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
      if (!mounted && status === "pending") return;
      // If still pending after timeout, mark failed so UX shows fallback
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, srcSet, sizes]);

  const fallbackSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dy='.3em' font-size='20' text-anchor='middle' fill='%23999'%3EImage%20Unavailable%3C/text%3E%3C/svg%3E";

  // show real <img> only when loaded; otherwise show placeholder or fallback
  if (status === "loaded") {
    return (
      <img
        src={currentSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = fallbackSvg;
        }}
      />
    );
  }

  if (status === "failed") {
    return <img src={fallbackSvg} alt={alt} className={className} />;
  }

  // pending: show subtle placeholder (can be blurDataURL if provided instead)
  return (
    <div
      aria-hidden
      className={`${className} bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse`}
      style={{ display: "block" }}
    />
  );
}

export default function CategoryGrid({ categories = [] }) {
  // If no categories, render nothing (or render skeleton if you prefer)
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <Section className="bg-[#fdf7f7] dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const key = cat?._id || cat?.name || Math.random().toString(36).slice(2, 7);
            // Normalize image path if someone accidentally passed local src path like 'src/assets/...'
            let imgUrl = cat?.img || "";
            if (imgUrl.startsWith("src/") || imgUrl.startsWith("./src/")) {
              // assume developer forgot to move to public; convert to public assets path
              // — change this if your build serves assets differently
              imgUrl = imgUrl.replace(/^\.?\/?src\/assets/, "/assets");
            }

            return (
              <Link
                key={key}
                to={cat?.href || "#"}
                className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg"
                aria-label={cat?.name || "category"}
              >
                <ProgressiveImage
                  src={imgUrl}
                  alt={cat?.name || "category"}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-6 left-6">
                  <h3 className="text-2xl font-semibold text-white">
                    {cat?.name || "Category"}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
