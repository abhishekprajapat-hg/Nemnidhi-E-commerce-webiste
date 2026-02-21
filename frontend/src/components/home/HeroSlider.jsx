import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const SLIDE_INTERVAL_MS = 5500;

const DEFAULT_SLIDE = {
  title: "Modern Indian silhouettes for every celebration",
  subtitle: "Curated textiles, artisan finishes, and statement drapes built for timeless wardrobes.",
  img: "/images/img-1.jpg",
  href: "/products",
  cta: "Explore Collection",
};

const VALUE_BADGES = ["Handloom Verified", "Fast Dispatch", "Secure Checkout"];

function normalizeCategory(category) {
  if (!category) return null;
  if (typeof category === "string") {
    const title = category.trim();
    if (!title) return null;
    return { title, slug: title };
  }

  const title = String(category.title || category.name || "").trim();
  const slug = String(category.slug || title).trim();
  if (!title || !slug) return null;
  return { title, slug };
}

export function HeroSlider({
  slides = [DEFAULT_SLIDE],
  initialIndex = 0,
  categories = [],
  onCategoryClick = null,
}) {
  const MotionDiv = motion.div;
  const navigate = useNavigate();

  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);

  const normalizedSlides = useMemo(() => {
    if (!Array.isArray(slides) || slides.length === 0) return [DEFAULT_SLIDE];
    return slides.map((slide) => ({
      title: slide?.title || DEFAULT_SLIDE.title,
      subtitle: slide?.subtitle || DEFAULT_SLIDE.subtitle,
      img: slide?.img || DEFAULT_SLIDE.img,
      href: slide?.href || DEFAULT_SLIDE.href,
      cta: slide?.cta || DEFAULT_SLIDE.cta,
    }));
  }, [slides]);

  const totalSlides = normalizedSlides.length;
  const currentSlide = normalizedSlides[index] || DEFAULT_SLIDE;

  const heroCategories = useMemo(
    () => categories.map(normalizeCategory).filter(Boolean).slice(0, 8),
    [categories]
  );

  useEffect(() => {
    if (index >= totalSlides) setIndex(0);
  }, [index, totalSlides]);

  useEffect(() => {
    if (paused || totalSlides <= 1) return undefined;
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % totalSlides);
    }, SLIDE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [paused, totalSlides, index]);

  const handleCategorySelect = (category) => {
    if (!category?.slug) return;
    if (typeof onCategoryClick === "function") {
      onCategoryClick(category);
      return;
    }
    navigate(`/products?category=${encodeURIComponent(category.slug)}`);
  };

  return (
    <section className="nm-shell pt-4 sm:pt-6 lg:pt-8">
      <div
        className="nm-panel relative overflow-hidden px-4 pb-6 pt-5 sm:px-7 sm:pb-8 sm:pt-7 lg:px-10 lg:pb-10 lg:pt-9"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="order-2 min-w-0 lg:order-1">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-3.5 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)] sm:text-[0.68rem]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[var(--nm-accent)]" />
                New Season Edit
              </p>

              {totalSlides > 1 && (
                <span className="rounded-full border border-[var(--nm-border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
                  {String(index + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              <MotionDiv
                key={`${index}-copy`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="min-w-0 space-y-4"
              >
                <h1 className="nm-display max-w-full text-[clamp(2rem,9vw,3.5rem)] font-semibold leading-[1.02] [overflow-wrap:anywhere] break-words">
                  {currentSlide.title}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-[var(--nm-muted)] sm:text-base">
                  {currentSlide.subtitle}
                </p>

                <div className="grid grid-cols-1 gap-2.5 pt-1 sm:flex sm:flex-wrap">
                  <Link to={currentSlide.href} className="nm-btn-primary w-full text-sm sm:w-auto">
                    {currentSlide.cta}
                    <span aria-hidden>-&gt;</span>
                  </Link>
                  <Link to="/products" className="nm-btn-secondary w-full text-sm sm:w-auto">
                    Shop All
                  </Link>
                </div>
              </MotionDiv>
            </AnimatePresence>

            <div className="mt-5 flex flex-wrap gap-2">
              {VALUE_BADGES.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--nm-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>

            {heroCategories.length > 0 && (
              <div className="mt-5">
                <p className="mb-2.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
                  Browse by Category
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {heroCategories.map((category) => (
                    <button
                      key={`${category.slug}-${category.title}`}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className="shrink-0 rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-text)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
                    >
                      {category.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {totalSlides > 1 && (
              <div className="mt-5 flex items-center gap-2">
                {normalizedSlides.map((slide, slideIndex) => {
                  const isActive = slideIndex === index;
                  return (
                    <button
                      key={`${slide.href}-${slideIndex}`}
                      type="button"
                      aria-label={`Go to slide ${slideIndex + 1}`}
                      onClick={() => setIndex(slideIndex)}
                      className={`h-2 rounded-full transition ${
                        isActive
                          ? "w-8 bg-[var(--nm-accent)]"
                          : "w-2.5 bg-[var(--nm-border)] hover:bg-[var(--nm-muted)]/40"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="order-1 relative lg:order-2">
            <AnimatePresence mode="wait">
              <MotionDiv
                key={`${index}-image`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.45 }}
                className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.8rem] border border-[var(--nm-border)] bg-[var(--nm-bg-elevated)] shadow-2xl shadow-black/20 sm:max-w-[28rem] lg:max-w-none"
              >
                <img
                  src={currentSlide.img}
                  alt={currentSlide.title}
                  className="block h-[18rem] w-full object-cover object-[center_14%] sm:h-[24rem] lg:h-[34rem]"
                  onError={(event) => {
                    event.currentTarget.src = "/placeholder.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </MotionDiv>
            </AnimatePresence>

            {totalSlides > 1 && (
              <div className="absolute bottom-3 right-3 z-10 hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => setIndex((prev) => (prev - 1 + totalSlides) % totalSlides)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
                  aria-label="Previous slide"
                >
                  <span aria-hidden>&lt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((prev) => (prev + 1) % totalSlides)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
                  aria-label="Next slide"
                >
                  <span aria-hidden>&gt;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
