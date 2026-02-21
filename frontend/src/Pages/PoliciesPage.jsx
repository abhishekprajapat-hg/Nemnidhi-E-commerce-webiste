import React, { useState } from "react";

const SECTIONS = {
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    lastUpdated: "January 2026",
    paragraphs: [
      "We collect only the information required to process orders, deliver shipments, and provide customer support.",
      "Your data may be shared with payment, logistics, and analytics partners only for operational purposes.",
      "We do not sell or rent personal data. You may request correction or deletion by contacting support.",
    ],
  },
  terms: {
    id: "terms",
    title: "Terms and Conditions",
    lastUpdated: "January 2026",
    paragraphs: [
      "By using this website and placing orders, you agree to our terms.",
      "Product colors may vary slightly based on screen and lighting; this is not treated as a defect.",
      "Orders may be cancelled for payment mismatch, incorrect pricing, or fraud risk.",
    ],
  },
  shipping: {
    id: "shipping",
    title: "Shipping Policy",
    lastUpdated: "January 2026",
    paragraphs: [
      "Most orders are processed within 2-3 working days.",
      "Delivery timelines vary by location and courier serviceability.",
      "Tracking details are shared after dispatch through SMS, email, or WhatsApp.",
    ],
  },
  returns: {
    id: "returns",
    title: "Returns and Exchanges",
    lastUpdated: "January 2026",
    paragraphs: [
      "Exchange requests should be raised quickly after delivery with proof and intact tags.",
      "Refunds are issued only for valid cases such as damaged or incorrect items.",
      "Custom, altered, or final-sale products may not be eligible for return.",
    ],
  },
  cancellation: {
    id: "cancellation",
    title: "Cancellation Policy",
    lastUpdated: "January 2026",
    paragraphs: [
      "Orders can be cancelled before processing or dispatch.",
      "Prepaid cancellation refunds are made to the original payment method.",
      "Refund timing depends on payment provider processing cycles.",
    ],
  },
};

const FAQS = [
  {
    q: "How long does shipping take?",
    a: "Dispatch usually takes 2-3 working days, then transit time depends on your location.",
  },
  {
    q: "Can I exchange an item?",
    a: "Yes, eligible items can be exchanged if requested within the allowed window and condition requirements.",
  },
  {
    q: "When do I get refunds?",
    a: "After approval, refunds are processed to the original method. Banking timelines vary by provider.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach us via email at support@nemnidhiglam.com or WhatsApp at +91 82691 50205.",
  },
];

export default function PoliciesPage() {
  const [active, setActive] = useState("privacy");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const sectionList = Object.values(SECTIONS);
  const selected = SECTIONS[active];

  return (
    <div className="nm-shell py-8 sm:py-10">
      <div className="mb-6">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">Policies</p>
        <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">Store Policies</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.35fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <nav className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">
              On This Page
            </p>
            <ul className="mt-2 space-y-1">
              {sectionList.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActive(section.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                      active === section.id
                        ? "bg-[var(--nm-accent-soft)] text-[var(--nm-accent-strong)]"
                        : "text-[var(--nm-text)] hover:bg-[var(--nm-bg-elevated)]"
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setActive("faq")}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    active === "faq"
                      ? "bg-[var(--nm-accent-soft)] text-[var(--nm-accent-strong)]"
                      : "text-[var(--nm-text)] hover:bg-[var(--nm-bg-elevated)]"
                  }`}
                >
                  FAQs
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="space-y-5">
          {active !== "faq" && selected && (
            <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
              <h2 className="text-xl font-semibold">{selected.title}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--nm-muted)]">
                Last updated: {selected.lastUpdated}
              </p>
              <div className="mt-4 space-y-3">
                {selected.paragraphs.map((text) => (
                  <p key={text} className="text-sm leading-7 text-[var(--nm-muted)]">
                    {text}
                  </p>
                ))}
              </div>
            </article>
          )}

          {active === "faq" && (
            <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              <div className="mt-4 space-y-2">
                {FAQS.map((faq, idx) => (
                  <div key={faq.q} className="rounded-2xl border border-[var(--nm-border)]">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold"
                    >
                      <span>{faq.q}</span>
                      <span>{openFaqIndex === idx ? "-" : "+"}</span>
                    </button>
                    {openFaqIndex === idx && (
                      <p className="px-4 pb-4 text-sm leading-7 text-[var(--nm-muted)]">{faq.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
