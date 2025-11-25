import React, { useState } from "react";

/**
 * PoliciesPage.jsx
 * Single-page Policies (Privacy, T&C, Shipping, Returns/Exchange, Cancellation) + FAQs
 * - Tailwind CSS classes assumed available in your app.
 * - Download links point to uploaded docx files in /mnt/data (server will transform path -> URL).
 *
 * Source content taken from uploaded files:
 * - Nemnidhi Glam Policies.docx. :contentReference[oaicite:3]{index=3}
 * - Return & Exchange Policy.docx. :contentReference[oaicite:4]{index=4}
 * - Nemnidhi Glam FAQs.docx. :contentReference[oaicite:5]{index=5}
 *
 * Replace any placeholder contact numbers or city names with real values.
 */

const SECTIONS = {
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    lastUpdated: "2025",
    paragraphs: [
      "Your privacy is important to us. This policy explains what data we collect and how we use it.",
      "We collect name, phone number, email address, billing & shipping address, payment details (processed securely by gateways), device info and cookies.",
      "We use your data to process orders, ship products, communicate order updates, improve website experience, and prevent fraud.",
      "Third parties who may process data on our behalf include shipping partners, payment gateways and analytics tools.",
      "We never sell or rent your personal information. You can request access, correction or deletion of your data.",
      "By placing an order you consent to receive order updates via WhatsApp/SMS/Email.",
    ],
  },

  terms: {
    id: "terms",
    title: "Terms & Conditions",
    lastUpdated: "2025",
    paragraphs: [
      "By accessing or purchasing from Nemnidhi Glam you accept these Terms & Conditions.",
      "All product images, descriptions and content are property of Nemnidhi Glam. Slight colour variations due to lighting or screen settings are not defects.",
      "Orders are subject to availability and acceptance. We may cancel an order for payment issues, incorrect pricing, or suspected fraud.",
      "We may block users who misuse the site or attempt fraudulent orders.",
      "Governing law: India. Disputes are resolved in courts in your registered city (replace with your city).",
    ],
  },

  shipping: {
    id: "shipping",
    title: "Shipping Policy",
    lastUpdated: "2025",
    paragraphs: [
      "Orders are processed and dispatched within 2–3 working days (orders on Sunday/holidays processed next working day).",
      "Free shipping for orders above ₹1999. Standard shipping charges apply for orders below ₹1999.",
      "Delivery typically takes 3–7 working days depending on the destination; remote areas may take longer.",
      "Tracking details are sent via WhatsApp / SMS / Email once the order is shipped.",
      "We are not responsible for delays due to courier issues, weather, or incorrect address provided by the customer.",
    ],
  },

  returns: {
    id: "returns",
    title: "Return / Exchange & Refund Policy",
    lastUpdated: "2025",
    paragraphs: [
      "No general returns. Exchanges allowed only within 48 hours of delivery, provided the item is unused, unwashed, unaltered and has original tags & packaging.",
      "Unboxing video is mandatory for all exchange or refund claims. Requests without an unboxing video will not be eligible.",
      "Refunds are only provided in genuine cases: damaged product, defective product, wrong product delivered, missing item, or package lost in transit.",
      "Sale items, custom-stitched items, altered/used products, and free gifts are not eligible for refunds or exchanges.",
      "If an exchange item is unavailable, store credit valid for 90 days will be issued.",
      "Refund processing time after inspection: typically 5–7 working days (may vary by payment provider).",
    ],
  },

  cancellation: {
    id: "cancellation",
    title: "Cancellation Policy",
    lastUpdated: "2025",
    paragraphs: [
      "Orders can be cancelled only before processing/packing. Once packed or shipped cancellation is not possible.",
      "Prepaid orders generally cannot be cancelled after payment completes; follow support/FAQ workflow for exceptions.",
      "COD orders may require verification; if not verified, order may be cancelled to prevent fake orders.",
      "Approved cancellation refunds (if any) will be processed to the original payment method in 5–7 working days.",
    ],
  },
};

const FAQS = [
  {
    q: "Are the product photos accurate?",
    a: "Yes — images are captured in-house. Slight colour variations due to screen or lighting are normal and not considered defects.",
  },
  {
    q: "When will my order be dispatched?",
    a: "Dispatch time is 2–3 working days. Delivery takes 3–7 working days depending on location.",
  },
  {
    q: "What is the exchange window?",
    a: "Exchanges must be requested within 48 hours of delivery, item unused with all tags & original packaging, and a full unboxing video provided.",
  },
  {
    q: "Do you offer refunds?",
    a: "Refunds are offered only in limited cases: damaged, defective, wrong, missing items or lost shipments — and only with required proof (unboxing video, photos).",
  },
  {
    q: "Are sale or customised items refundable?",
    a: "No — sale items, customised/stiched items, and items with hygiene seals removed are not eligible for refund/exchange.",
  },
  {
    q: "How do I contact support?",
    a: "Email: support@nemnidhiglam.com | WhatsApp: +91-XXXXXXXXXX | Support hours: 10 AM – 7 PM (Mon–Sat). Replace with real contact details.",
  },
];

export default function PoliciesPage() {
  const [active, setActive] = useState("privacy");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const sectionList = Object.values(SECTIONS);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Nemnidhi Glam — Policies</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Privacy, Terms, Shipping, Returns & FAQs — official store policies.</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/mnt/data/Nemnidhi Glam Policies.docx"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-pink-600 text-pink-600 text-sm font-medium hover:bg-pink-50 dark:text-pink-400 dark:border-pink-500 dark:hover:bg-pink-900/50"
              download
            >
              Download Policies (DOCX)
            </a>

            <a
              href="/mnt/data/Return & Exchange Policy.docx"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              download
            >
              Download Return Policy
            </a>

            <a
              href="/mnt/data/Nemnidhi Glam FAQs.docx"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              download
            >
              Download FAQs
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="sticky top-20 bg-white dark:bg-zinc-800/50 dark:border-zinc-700 rounded-2xl p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">On this page</h3>

              <ul className="flex flex-col gap-2">
                {sectionList.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setActive(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        active === s.id
                          ? "bg-pink-50 border border-pink-100 text-pink-700 font-semibold dark:bg-pink-900/50 dark:border-pink-800 dark:text-pink-300"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-700/50"
                      }`}
                    >
                      {s.title}
                    </button>
                  </li>
                ))}

                <li>
                  <button
                    onClick={() => setActive("faq")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      active === "faq"
                        ? "bg-pink-50 border border-pink-100 text-pink-700 font-semibold dark:bg-pink-900/50 dark:border-pink-800 dark:text-pink-300"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-700/50"
                    }`}
                  >
                    FAQs
                  </button>
                </li>
              </ul>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>Last updated: 2025. Keep these pages up-to-date and show exact dates in production.</p>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <main className="md:col-span-3 space-y-6">
            {/* Render selected section */}
            {active !== "faq" && (
              <article className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border dark:border-zinc-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{SECTIONS[active].title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last updated: {SECTIONS[active].lastUpdated}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-gray-700 dark:text-gray-300">
                  {SECTIONS[active].paragraphs.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed">
                      {p}
                    </p>
                  ))}

                  {/* Helpful tips area */}
                  <div className="mt-4 border-t dark:border-zinc-700 pt-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      For legal certainty, have these policies reviewed by a lawyer. Save user checkbox acceptance at checkout
                      (timestamp + user id) for evidence of agreement.
                    </p>
                  </div>
                </div>
              </article>
            )}

            {/* FAQs */}
            {active === "faq" && (
              <section className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border dark:border-zinc-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Common customer queries & quick answers.</p>

                <div className="mt-6 space-y-3">
                  {FAQS.map((f, idx) => (
                    <div key={idx} className="border dark:border-zinc-700 rounded-lg">
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-200">{f.q}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{openFaqIndex === idx ? "−" : "+"}</span>
                      </button>

                      {openFaqIndex === idx && (
                        <div className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300">{f.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick combined view: show all sections (printable) */}
            <section className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border dark:border-zinc-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Printable / Full Text (Quick Export)</h3>
              <div className="mt-3 grid gap-4">
                {Object.values(SECTIONS).map((s) => (
                  <div key={s.id} id={s.id} className="pt-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{s.title} — <span className="text-sm text-gray-500 dark:text-gray-400">Last updated: {s.lastUpdated}</span></h4>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                      {s.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Source documents included with this project: <code>/mnt/data/Nemnidhi Glam Policies.docx</code>, <code>/mnt/data/Return & Exchange Policy.docx</code>, <code>/mnt/data/Nemnidhi Glam FAQs.docx</code>.
              </div>
            </section>
          </main>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Nemnidhi Glam. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
