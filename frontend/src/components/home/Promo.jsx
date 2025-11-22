import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import Card from "../ui/Card";

/**
 * Optimized Promo
 *
 * - Explore button redirects to same `href` as the main CTA when `href` exists.
 * - Improved parallax: uses rAF and a single scroll handler; fewer DOM queries.
 * - Intersection observer entrance (cleaner lifecycle).
 * - Minor accessibility tweaks and defensive checks.
 *
 * Props:
 *  - promo: { title, subtitle, buttonText, href, img, imgAlt, align, eyebrow }
 *  - className
 *  - useCard
 *  - onClick
 */
export default function Promo({
  promo = {},
  className = "",
  useCard = true,
  onClick,
}) {
  const {
    title = "Exciting Offers",
    subtitle = "",
    buttonText = "Shop Now",
    href = "",
    img = "",
    imgAlt = "Promotional banner",
    align = "left",
    eyebrow = "Special Offer",
  } = promo || {};

  const controls = useAnimation();
  const rootRef = useRef(null);
  const imgRef = useRef(null);
  const rafRef = useRef(null);

  const alignCenter = align === "center";
  const hasHref = Boolean(href && href.trim());

  // Add reusable keyframes once
  useEffect(() => {
    const id = "promo-anim-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes promo-cta-pulse {
        0% { box-shadow: 0 0 0 0 rgba(17,24,39, 0.0); }
        50% { box-shadow: 0 8px 24px -8px rgba(17,24,39, 0.12); }
        100% { box-shadow: 0 0 0 0 rgba(17,24,39, 0.0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      // keep stylesheet (cheap); if you'd prefer removal, uncomment below
      // if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);

  // Intersection observer entrance (cleaner)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            controls.start("show");
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [controls]);

  // Parallax handler using rAF for better perf
  useEffect(() => {
    const rootEl = rootRef.current;
    const image = imgRef.current;
    if (!rootEl || !image) return;

    let mounted = true;

    function onScroll() {
      if (!mounted) return;
      if (rafRef.current) return; // already scheduled

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const rect = rootEl.getBoundingClientRect();
        const winH = window.innerHeight || document.documentElement.clientHeight;
        // normalized t in [-1,1] relative to center
        const t = Math.max(-1, Math.min(1, (rect.top - winH / 2) / (winH / 2)));
        const translate = Math.round(t * -10); // +/- 10px
        // apply transform but preserve any hover/scale styles from framer
        image.style.transform = `translateY(${translate}px)`;
      });
    }

    // initialize once
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [img]);

  // CTA pulse style
  const ctaPulse = useMemo(
    () => ({ animation: "promo-cta-pulse 2.8s ease-in-out infinite" }),
    []
  );

  // Unified click handler (passed to links/buttons)
  const handleCTAClick = useCallback(
    (e) => {
      if (typeof onClick === "function") onClick(e);
      // leave navigation to Link / anchor when href present
    },
    [onClick]
  );

  // Explore action: if href exists, go there (use Link/anchor). Otherwise smooth scroll to #products
  const handleExploreClick = useCallback(
    (e) => {
      if (hasHref) {
        // allow Link/anchor to handle navigation; no JS needed
        return;
      }
      // else smooth-scroll to #products
      e.preventDefault();
      // prefer document.getElementById to minimize query scope
      const doc = rootRef.current?.ownerDocument || document;
      const target = doc.getElementById("products");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [hasHref]
  );

  // Motion variants
  const container = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, when: "beforeChildren" } },
  };
  const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } };
  const imgHover = { hover: { y: -8, scale: 1.02, rotate: -0.6, transition: { duration: 0.35 } }, initial: {} };

  const content = (
    <div
      ref={rootRef}
      className={`bg-[#fdf7f7] dark:bg-black relative overflow-hidden rounded-2xl p-6 md:p-8 lg:p-10 ${className}`}
      aria-label={title || "Promotional banner"}
    >
      {/* decorative soft shape */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          style={{
            position: "absolute",
            left: "-8%",
            top: "-12%",
            width: "36%",
            height: "32%",
            borderRadius: "999px",
            background: "linear-gradient(135deg, rgba(253,247,247,0.9), rgba(255,245,240,0.6))",
            filter: "blur(48px)",
            transform: "rotate(8deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-10%",
            bottom: "-18%",
            width: "42%",
            height: "40%",
            borderRadius: "999px",
            background: "linear-gradient(225deg, rgba(250,240,245,0.6), rgba(248,255,255,0.5))",
            filter: "blur(56px)",
            transform: "rotate(-6deg)",
          }}
        />
      </div>

      <motion.div initial="hidden" animate={controls} variants={container} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Text */}
        <motion.div variants={fadeUp} className={`order-2 md:order-1 md:col-span-1 flex flex-col gap-3 ${alignCenter ? "items-center text-center" : "items-start text-left"}`}>
          <span className="inline-block text-xs md:text-sm font-medium text-pink-500 uppercase tracking-wide">{eyebrow}</span>

          <h3 className="text-2xl md:text-4xl font-extrabold leading-tight text-slate-900 dark:text-white">
            {title || "Exciting Offers"}
          </h3>

          {subtitle ? (
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-xl">{subtitle}</p>
          ) : null}

          <motion.div variants={fadeUp} className="mt-3 flex flex-wrap gap-3">
            {buttonText ? (
              hasHref ? (
                href.startsWith("/") ? (
                  <Link
                    to={href}
                    onClick={handleCTAClick}
                    className="relative inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold transform transition hover:-translate-y-0.5 active:translate-y-0"
                    style={ctaPulse}
                    aria-label={buttonText}
                  >
                    <span>{buttonText}</span>
                    <svg className="w-4 h-4 opacity-90" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ) : (
                  <a
                    href={href}
                    onClick={handleCTAClick}
                    className="relative inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold transform transition hover:-translate-y-0.5 active:translate-y-0"
                    style={ctaPulse}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={buttonText}
                  >
                    <span>{buttonText}</span>
                    <svg className="w-4 h-4 opacity-90" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )
              ) : (
                <button
                  onClick={handleCTAClick}
                  className="relative inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold transform transition hover:-translate-y-0.5 active:translate-y-0"
                  style={ctaPulse}
                  aria-label={buttonText}
                >
                  <span>{buttonText}</span>
                </button>
              )
            ) : null}

            {/* Explore: if href exists, render same link (redirect to shop). else, smooth-scroll */}
            {hasHref ? (
              href.startsWith("/") ? (
                <Link
                  to={href}
                  onClick={handleExploreClick}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                  aria-label="Explore"
                >
                  Explore
                </Link>
              ) : (
                <a
                  href={href}
                  onClick={handleExploreClick}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                  aria-label="Explore"
                >
                  Explore
                </a>
              )
            ) : (
              <button
                onClick={handleExploreClick}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Explore"
              >
                Explore
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* Image */}
        <motion.div variants={fadeUp} className="order-1 md:order-2 md:col-span-1 flex items-center justify-center" whileHover="hover">
          {img ? (
            <motion.img
              ref={imgRef}
              data-parallax="true"
              variants={imgHover}
              src={img}
              alt={imgAlt}
              loading="lazy"
              className="w-[320px] md:w-[420px] lg:w-[520px] object-cover rounded-xl shadow-2xl"
              style={{ willChange: "transform", transition: "transform 0.2s ease-out" }}
            />
          ) : (
            <motion.div
              variants={imgHover}
              className="w-[300px] md:w-[380px] lg:w-[460px] h-44 md:h-56 lg:h-64 flex items-center justify-center bg-gradient-to-br from-white to-[#fff6f4] rounded-xl shadow-inner border border-transparent/10"
            >
              <div className="text-sm text-slate-500">No image provided</div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* small badge */}
      <div className="absolute right-4 bottom-4 hidden md:flex items-center gap-2 bg-white/90 py-1 px-3 rounded-full shadow-sm text-xs text-slate-700">
        <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2v20" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 9h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-medium">Limited time</span>
      </div>
    </div>
  );

  return useCard ? <Card>{content}</Card> : content;
}
