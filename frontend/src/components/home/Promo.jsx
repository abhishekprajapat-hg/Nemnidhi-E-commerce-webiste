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
    <Section className="pt-8 sm:pt-10">
      <div className="nm-shell">
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-7 lg:p-9"
        >
          <div className="pointer-events-none absolute -left-12 top-8 h-48 w-48 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-0 h-52 w-52 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />

          <div className="relative grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
                {eyebrow}
              </p>

              <h3 className="nm-display mt-3 text-[clamp(2rem,8vw,3.4rem)] font-semibold leading-[0.98]">
                {title}
              </h3>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--nm-muted)] sm:text-base">{subtitle}</p>

              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
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
              <img
                src={img || "/images/img-3.jpg"}
                alt={imgAlt}
                className="h-[18rem] w-full rounded-[1.5rem] border border-[var(--nm-border)] object-cover sm:h-[21rem] lg:h-[24rem]"
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.png";
                }}
                loading="lazy"
              />
            </div>
          </div>
        </motion.article>
      </div>
    </Section>
  );
}
