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

function normalizeCategory(category) {
  if (!category) return null;
  if (typeof category === "string") {
    const text = category.trim();
    if (!text) return null;
    return { title: text, slug: text };
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

  const currentSlide = normalizedSlides[index] || DEFAULT_SLIDE;
  const totalSlides = normalizedSlides.length;

  const heroCategories = useMemo(
    () => categories.map(normalizeCategory).filter(Boolean).slice(0, 7),
    [categories]
  );

  useEffect(() => {
    if (paused || totalSlides <= 1) return undefined;
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % totalSlides);
    }, SLIDE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [paused, index, totalSlides]);

  const handleCategorySelect = (category) => {
    if (!category?.slug) return;
    if (typeof onCategoryClick === "function") {
      onCategoryClick(category);
      return;
    }
    navigate(`/products?category=${encodeURIComponent(category.slug)}`);
  };

  return (
    <section className="nm-shell pt-5 sm:pt-7 lg:pt-8">
      <div
        className="nm-panel relative overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-10 sm:pt-8 lg:px-10 lg:pb-12 lg:pt-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="order-2 space-y-6 lg:order-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[var(--nm-accent)]" />
              New Season Edit
            </p>

            <AnimatePresence mode="wait">
              <MotionDiv
                key={`${index}-text`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="space-y-4 min-w-0"
              >
                <h1 className="nm-display max-w-full text-[clamp(2rem,8.5vw,3.7rem)] font-semibold leading-[1.02] [overflow-wrap:anywhere] break-words sm:text-5xl lg:text-6xl">
                  {currentSlide.title}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-[var(--nm-muted)] [overflow-wrap:anywhere] sm:text-base">
                  {currentSlide.subtitle}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to={currentSlide.href} className="nm-btn-primary text-sm">
                    {currentSlide.cta}
                    <span aria-hidden>-&gt;</span>
                  </Link>
                  <Link to="/products" className="nm-btn-secondary text-sm">
                    Shop All
                  </Link>
                </div>
              </MotionDiv>
            </AnimatePresence>

            {heroCategories.length > 0 && (
              <div>
                <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
                  Browse by Category
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {heroCategories.map((category) => (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className="shrink-0 rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
                    >
                      {category.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {totalSlides > 1 && (
              <div className="flex items-center gap-2">
                {normalizedSlides.map((slide, slideIndex) => {
                  const isActive = slideIndex === index;
                  return (
                    <button
                      key={`${slide.href}-${slideIndex}`}
                      type="button"
                      aria-label={`Go to slide ${slideIndex + 1}`}
                      onClick={() => setIndex(slideIndex)}
                      className={`h-2.5 rounded-full transition ${
                        isActive ? "w-9 bg-[var(--nm-accent)]" : "w-2.5 bg-[var(--nm-border)]"
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
                className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.9rem] border border-[var(--nm-border)] bg-[var(--nm-bg-elevated)] sm:max-w-none"
              >
                <img
                  src={currentSlide.img}
                  alt={currentSlide.title}
                  className="block h-[24rem] w-full object-cover object-[center_12%] sm:h-[30rem] sm:object-center lg:h-[36rem]"
                  onError={(event) => {
                    event.currentTarget.src = "/placeholder.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </MotionDiv>
            </AnimatePresence>

            {totalSlides > 1 && (
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 sm:bottom-5 sm:right-5">
                <button
                  type="button"
                  onClick={() => setIndex((prev) => (prev - 1 + totalSlides) % totalSlides)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/45 text-white backdrop-blur transition hover:bg-black/60 sm:h-10 sm:w-10"
                  aria-label="Previous slide"
                >
                  <span aria-hidden>&lt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((prev) => (prev + 1) % totalSlides)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/45 text-white backdrop-blur transition hover:bg-black/60 sm:h-10 sm:w-10"
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
