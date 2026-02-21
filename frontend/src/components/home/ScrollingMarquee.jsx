import React from "react";

const QUICK_HIGHLIGHTS = [
  "Authentic handloom promise",
  "Free shipping above Rs 2000",
  "7-day easy exchanges",
  "Secure payments and support",
];

export default function ScrollingMarquee() {
  return (
    <section className="mt-7 sm:mt-8">
      <div className="nm-shell">
        <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-3 sm:px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {QUICK_HIGHLIGHTS.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--nm-muted)] sm:text-[11px]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
