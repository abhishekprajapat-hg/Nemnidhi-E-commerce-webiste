import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Section from "./Section";

const FALLBACK_IMAGES = ["/images/img-1.jpg", "/images/img-2.jpg", "/images/img-3.jpg", "/images/img-4.jpg"];

function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function normalizeCategory(category, index) {
  const title = String(category?.title || category?.name || category?.slug || "").trim();
  if (!title) return null;

  const slug = String(category?.slug || toSlug(title)).trim();
  if (!slug) return null;

  return {
    key: String(category?._id || `${slug}-${index}`),
    title,
    subtitle: String(category?.subtitle || category?.description || "Curated edit for your wardrobe.").trim(),
    img: category?.img || category?.image || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    href: String(category?.href || `/products?category=${encodeURIComponent(slug)}`),
  };
}

export default function CategoryShowcase({ categories = [] }) {
  const visibleCategories = useMemo(
    () => categories.map(normalizeCategory).filter(Boolean).slice(0, 6),
    [categories]
  );

  if (visibleCategories.length === 0) return null;

  return (
    <Section className="pt-7 sm:pt-10">
      <div className="nm-shell">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
              Shop by Category
            </p>
            <h2 className="nm-display mt-2 text-[clamp(1.9rem,8vw,3.2rem)] font-semibold leading-[1.02]">
              Find your next favorite fit
            </h2>
          </div>
          <Link to="/products" className="hidden text-sm font-semibold text-[var(--nm-accent-strong)] sm:block">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {visibleCategories.map((category) => (
            <Link
              key={category.key}
              to={category.href}
              className="group relative overflow-hidden rounded-[1.45rem] border border-[var(--nm-border)] bg-[var(--nm-card)]"
            >
              <img
                src={category.img}
                alt={category.title}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.png";
                }}
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                <p className="line-clamp-1 text-base font-semibold sm:text-lg">{category.title}</p>
                <p className="mt-1 line-clamp-1 text-[11px] uppercase tracking-[0.14em] text-white/80 sm:text-xs">
                  {category.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}
