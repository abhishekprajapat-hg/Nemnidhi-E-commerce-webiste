import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function ProductCard({ p, onAddToCart }) {
  const variantImages = Array.isArray(p?.variants)
    ? p.variants.flatMap((v) => (Array.isArray(v.images) ? v.images : []))
    : [];
  const slides = (variantImages && variantImages.length && variantImages) ||
    (p?.images && p.images.length && p.images) ||
    (p?.image && [p.image]) || ["/placeholder.png"];

  const pricesFromVariants = Array.isArray(p?.variants)
    ? p.variants.flatMap((v) =>
        Array.isArray(v.sizes) ? v.sizes.map((s) => Number(s.price || 0)) : []
      )
    : [];
  const displayPrice = pricesFromVariants.length
    ? Math.min(...pricesFromVariants)
    : Number(p?.price || 0);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [index, paused, slides.length]);

  return (
    <div
      className="w-72 shrink-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="group relative border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-800">
        <Link
          to={`/product/${p?._id}`}
          className="block aspect-[4/5] bg-gray-100 dark:bg-zinc-700 relative"
          aria-label={p?.title || p?.name || "Product"}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={index + (slides[index] || "")}
              src={slides[index]}
              alt={p?.title || p?.name || `Product image ${index + 1}`}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder.png";
              }}
            />
          </AnimatePresence>

          {slides.length > 1 && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-20 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    setIndex(i);
                  }}
                  aria-label={`Go to image ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === index ? "bg-white w-4" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </Link>

        <div className="p-4 relative min-h-[90px]">
          <div className="transition-opacity duration-300 group-hover:opacity-0">
            <h3
              className="text-base font-semibold text-gray-800 dark:text-white truncate"
              title={p?.title || p?.name}
            >
              {p?.title || p?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ₹{Number(displayPrice || 0).toFixed(2)}
            </p>
          </div>

          <div className="absolute inset-0 p-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (typeof onAddToCart === "function") onAddToCart(p);
              }}
              className="w-full px-4 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="w-72 shrink-0">
      <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-800 shadow-sm animate-pulse">
        <div className="aspect-[4/5] bg-gray-200 dark:bg-zinc-700" />
        <div className="p-4">
          <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2 mt-2" />
        </div>
      </div>
    </div>
  );
}
