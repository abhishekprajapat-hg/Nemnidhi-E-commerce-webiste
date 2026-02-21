import React from "react";
import Section from "./Section";

const TRUST_ITEMS = [
  {
    title: "Authentic Handloom",
    description: "Direct artisan sourcing with quality checks on every piece.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M4 8h16M5 8v11m14-11v11M8 8V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V8m-6 5h4M10 16h4"
      />
    ),
  },
  {
    title: "Fast Delivery",
    description: "Quick dispatch with careful packaging across India.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M3 7h11v9H3V7zm11 2h4l3 3v4h-7V9zM8 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm10 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
      />
    ),
  },
  {
    title: "Secure Payments",
    description: "Trusted payment gateway and checkout protection.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M12 3l7 3v6c0 5-3.5 7.7-7 9-3.5-1.3-7-4-7-9V6l7-3zm-3 9l2 2 4-4"
      />
    ),
  },
];

export default function TrustIconsSection() {
  return (
    <Section className="pt-4 sm:pt-6">
      <div className="nm-shell">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_ITEMS.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 shadow-lg shadow-black/5"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-accent-soft)] text-[var(--nm-accent-strong)]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {item.icon}
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--nm-text)]">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--nm-muted)]">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
