import React from "react";
import Section from "./Section";

export default function NewsletterSection() {
  return (
    <Section>
      <div className="nm-shell">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] px-5 py-9 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--nm-muted)]">
              Join The Circle
            </p>
            <h2 className="nm-display mt-3 text-4xl font-semibold sm:text-5xl">
              Early access to new drops and private offers
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--nm-muted)] sm:text-base">
              Sign up for launch alerts, styling inspiration, and limited seasonal edits before they sell out.
            </p>
          </div>

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
    </Section>
  );
}
