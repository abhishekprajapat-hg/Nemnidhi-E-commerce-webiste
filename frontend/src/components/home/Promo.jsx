import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Section from "./Section";

export default function Promo({ promo = {} }) {
  const {
    title = "Curated festive edits now live",
    subtitle = "Discover handpicked drapes and elevated silhouettes for weddings, celebrations, and statement evenings.",
    buttonText = "Shop the Edit",
    href = "/products",
    img = "/images/img-3.jpg",
    imgAlt = "Promotional banner",
    eyebrow = "Editor Pick",
  } = promo || {};

  return (
    <Section>
      <div className="nm-shell">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute -top-28 left-1/3 h-72 w-72 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-8 h-64 w-64 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--nm-muted)]">
                {eyebrow}
              </p>
              <h3 className="nm-display mt-3 text-4xl font-semibold leading-[1.02] sm:text-5xl">
                {title}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--nm-muted)] sm:text-base">
                {subtitle}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={href || "/products"} className="nm-btn-primary text-sm">
                  {buttonText || "Shop Now"}
                  <span aria-hidden>-&gt;</span>
                </Link>
                <Link to="/products" className="nm-btn-secondary text-sm">
                  View All Products
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 -top-4 hidden rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-3 py-2 text-xs font-semibold text-[var(--nm-text)] shadow-lg sm:block">
                Limited Stock
              </div>

              <img
                src={img || "/images/img-3.jpg"}
                alt={imgAlt}
                className="h-[18rem] w-full rounded-[1.6rem] border border-[var(--nm-border)] object-cover sm:h-[23rem]"
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.png";
                }}
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
