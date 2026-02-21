import React from "react";
import { Link } from "react-router-dom";

const SHOP_LINKS = [
  { label: "All Products", href: "/products" },
  { label: "Sarees", href: "/products?category=Sarees" },
  { label: "Lehengas", href: "/products?category=Lehenga" },
  { label: "Kurta Sets", href: "/products?category=Kurta" },
];

const COMPANY_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Policies", href: "/policies" },
];

function SocialIcon({ children, label, href }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] text-[var(--nm-text)] transition hover:-translate-y-0.5 hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--nm-border)] bg-[color:color-mix(in_srgb,var(--nm-surface)_88%,transparent)]">
      <div className="nm-shell py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <div className="nm-display text-4xl font-semibold tracking-[0.06em]">NEMNIDHI</div>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--nm-muted)]">
              Crafted silhouettes rooted in Indian heritage, designed for everyday celebration and statement occasions.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <SocialIcon label="Instagram" href="https://instagram.com">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.2c3.2 0 3.6.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.25.07 1.65.07 4.85s-.01 3.6-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.25.06-1.65.07-4.85.07s-3.6-.01-4.85-.07c-3.23-.15-4.77-1.67-4.92-4.92-.06-1.25-.07-1.65-.07-4.85s.01-3.6.07-4.85c.15-3.23 1.67-4.77 4.92-4.92 1.25-.06 1.65-.07 4.85-.07zm0 4.1a5.7 5.7 0 100 11.4 5.7 5.7 0 000-11.4zm0 9.4a3.7 3.7 0 110-7.4 3.7 3.7 0 010 7.4zm5.95-9.85a1.35 1.35 0 11-2.7 0 1.35 1.35 0 012.7 0z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Facebook" href="https://facebook.com">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.07C24 5.45 18.63.07 12 .07S0 5.45 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.92-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.39C19.61 23.03 24 18.06 24 12.07z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="X" href="https://x.com">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.24 2H21l-6.5 7.42L22 22h-5.92l-4.64-6.06L6.1 22H3.33l6.96-7.95L2 2h6.07l4.2 5.52L18.24 2zm-1.04 18h1.53L7.24 3.9H5.6L17.2 20z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--nm-muted)]">
              Shop
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SHOP_LINKS.map((item) => (
                <li key={item.href}>
                  <Link className="transition hover:text-[var(--nm-accent)]" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--nm-muted)]">
              Company
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {COMPANY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link className="transition hover:text-[var(--nm-accent)]" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--nm-muted)]">
              Contact
            </p>
            <div className="mt-4 space-y-3 text-sm text-[var(--nm-muted)]">
              <p>14, Uday Nagar, Indore, Madhya Pradesh 452018</p>
              <p>
                Phone:{" "}
                <a href="tel:+918269150205" className="font-semibold text-[var(--nm-text)] hover:text-[var(--nm-accent)]">
                  +91 82691 50205
                </a>
              </p>
              <p>
                GST:{" "}
                <span className="font-semibold text-[var(--nm-text)]">
                  23CGZPB7175E1Z5
                </span>
              </p>
              <Link
                to="/products"
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--nm-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-text)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
              >
                Start Shopping
                <span aria-hidden>-&gt;</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--nm-border)] pt-6 text-xs text-[var(--nm-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Nemnidhi. All rights reserved.</p>
          <p>Designed for timeless celebrations and modern wardrobes.</p>
        </div>
      </div>
    </footer>
  );
}
