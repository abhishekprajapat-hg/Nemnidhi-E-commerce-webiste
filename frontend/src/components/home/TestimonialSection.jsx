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
    <Section className="pt-8 sm:pt-10">
      <div className="nm-shell">
        <div className="mb-5 sm:mb-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
            Customer Voices
          </p>
          <h2 className="nm-display mt-2 text-[clamp(1.9rem,8vw,3.2rem)] font-semibold leading-[1.02]">
            Real feedback from repeat buyers
          </h2>
        </div>

        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <article
              key={testimonial.name}
              className="min-w-[85%] snap-start rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 shadow-lg shadow-black/5 sm:min-w-0"
            >
              <span className="text-3xl leading-none text-[var(--nm-accent)]">&quot;</span>
              <p className="mt-2 text-sm leading-6 text-[var(--nm-text)] sm:text-base">{testimonial.quote}</p>
              <div className="mt-5 border-t border-[var(--nm-border)] pt-3">
                <p className="text-sm font-semibold">{testimonial.name}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--nm-muted)]">{testimonial.city}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
