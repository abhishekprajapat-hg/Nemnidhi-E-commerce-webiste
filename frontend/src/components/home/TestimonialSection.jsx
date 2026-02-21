import React from "react";
import Section from "./Section";

const TESTIMONIALS = [
  {
    name: "Priya S.",
    city: "Bengaluru",
    quote: "The drape and color were exactly as shown. The fabric feels premium and looked stunning at my event.",
  },
  {
    name: "Rohan M.",
    city: "Pune",
    quote: "Fast delivery, careful packaging, and the finishing quality exceeded expectations.",
  },
  {
    name: "Anjali K.",
    city: "Jaipur",
    quote: "Beautiful craftsmanship and comfortable fit. I now check Nemnidhi first for festive wear.",
  },
];

export default function TestimonialSection() {
  return (
    <Section>
      <div className="nm-shell">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--nm-muted)]">
              Client Reviews
            </p>
            <h2 className="nm-display mt-2 text-4xl font-semibold sm:text-5xl">
              Loved by modern Indian wardrobes
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <article
              key={testimonial.name}
              className="flex h-full flex-col rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 shadow-lg shadow-black/5"
            >
              <span className="text-3xl leading-none text-[var(--nm-accent)]">&quot;</span>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--nm-text)] sm:text-base">
                {testimonial.quote}
              </p>
              <div className="mt-5 border-t border-[var(--nm-border)] pt-3">
                <p className="text-sm font-semibold">{testimonial.name}</p>
                <p className="text-xs uppercase tracking-[0.15em] text-[var(--nm-muted)]">
                  {testimonial.city}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
