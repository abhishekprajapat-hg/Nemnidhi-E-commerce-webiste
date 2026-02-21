import React from "react";
import Section from "./Section";

const TRUST_ITEMS = [
  {
    title: "Authentic Handloom",
    description: "Each piece is sourced with verified quality checks.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="M4 8h16M5 8v11m14-11v11M8 8V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V8m-6 5h4M10 16h4"
      />
    ),
  },
  {
    title: "Speedy Delivery",
    description: "Orders are packed with care and shipped quickly.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="M3 7h11v9H3V7zm11 2h4l3 3v4h-7V9zM8 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm10 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
      />
    ),
  },
  {
    title: "Secure Payments",
    description: "Trusted checkout with protected transactions.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="M12 3l7 3v6c0 5-3.5 7.7-7 9-3.5-1.3-7-4-7-9V6l7-3zm-3 9l2 2 4-4"
      />
    ),
  },
  {
    title: "Easy Support",
    description: "Assistance before and after purchase, every day.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="M21 12a9 9 0 10-3.2 6.9L21 21l-2.1-3.4A8.9 8.9 0 0021 12zM9 10h6M9 14h4"
      />
    ),
  },
];

export default function TrustIconsSection() {
  return (
    <Section className="pt-8 sm:pt-10">
      <div className="nm-shell">
        <div className="rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:p-6">
          <div className="mb-4 sm:mb-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
              Why Nemnidhi
            </p>
            <h2 className="nm-display mt-2 text-[clamp(1.9rem,8vw,3.2rem)] font-semibold leading-[1.02]">
              Quality you can trust
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ITEMS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-4"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--nm-border)] bg-[var(--nm-accent-soft)] text-[var(--nm-accent-strong)]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {item.icon}
                  </svg>
                </div>
                <h3 className="mt-3 text-sm font-semibold sm:text-base">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--nm-muted)] sm:text-sm">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
