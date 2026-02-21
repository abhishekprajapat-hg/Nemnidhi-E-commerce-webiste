import React from "react";
import Section from "./Section";

export default function NewsletterSection() {
  return (
    <Section className="pt-8 sm:pt-10">
      <div className="nm-shell">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-8">
          <div className="pointer-events-none absolute -left-12 top-8 h-44 w-44 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-[var(--nm-accent-soft)] blur-3xl" />

          <div className="relative mx-auto max-w-3xl">
            <p className="text-center text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
              Join the Circle
            </p>
            <h2 className="nm-display mt-3 text-center text-[clamp(1.9rem,8vw,3.3rem)] font-semibold leading-[1.02]">
              Be first to know about every new drop
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-[var(--nm-muted)] sm:text-base">
              Get launch alerts, styling notes, and private seasonal offers straight to your inbox.
            </p>

            <form className="mx-auto mt-7 flex max-w-xl flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-5 py-3 text-sm text-[var(--nm-text)] placeholder:text-[var(--nm-muted)] focus:border-[var(--nm-accent)] focus:outline-none"
              />
              <button type="submit" className="nm-btn-primary whitespace-nowrap text-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </Section>
  );
}
