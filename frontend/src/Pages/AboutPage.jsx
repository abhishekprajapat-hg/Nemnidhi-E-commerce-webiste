import React from "react";
import { Link } from "react-router-dom";

const VALUES = [
  {
    title: "Artisan First",
    text: "We work directly with weaving families and independent ateliers to preserve craft and fair value.",
  },
  {
    title: "Authentic Textiles",
    text: "Every piece is selected for fabric integrity, drape quality, and finish consistency.",
  },
  {
    title: "Modern Heritage",
    text: "We blend traditional artistry with silhouettes designed for contemporary wardrobes.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Discover",
    text: "We source across weaving clusters and boutique workshops to find standout creations.",
  },
  {
    step: "02",
    title: "Curate",
    text: "Each product is reviewed for weave, comfort, fit utility, and styling versatility.",
  },
  {
    step: "03",
    title: "Deliver",
    text: "Your selection is packed with care and shipped quickly with tracking and support.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-8">
      <section className="nm-shell pt-8">
        <div className="nm-panel overflow-hidden p-6 sm:p-9">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
            About Nemnidhi
          </p>
          <h1 className="nm-display mt-3 text-5xl font-semibold leading-none sm:text-6xl">
            Rooted in Indian craft, made for modern celebrations
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--nm-muted)] sm:text-base">
            Nemnidhi was built to celebrate handcrafted Indian textiles with a refined, wearable perspective.
            We focus on timeless pieces that feel special now and stay relevant for years.
          </p>
        </div>
      </section>

      <section className="nm-shell mt-8 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-6 sm:p-8">
          <h2 className="nm-display text-4xl font-semibold">Our Story</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--nm-muted)] sm:text-base">
            <p>
              We started in 2025 with a simple goal: make authentic handcrafted clothing easier to discover,
              trust, and style.
            </p>
            <p>
              By working closely with skilled makers, we curate collections that respect tradition while fitting
              real contemporary lifestyles.
            </p>
            <p>
              Every drop is selected around quality, texture, and drape so your purchase feels meaningful from the
              first wear.
            </p>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)]">
          <img
            src="/images/img-2.jpg"
            alt="Textile craftsmanship"
            className="h-full min-h-[19rem] w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = "/placeholder.png";
            }}
          />
        </article>
      </section>

      <section className="nm-shell mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value) => (
            <article
              key={value.title}
              className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 shadow-lg shadow-black/5"
            >
              <h3 className="text-lg font-semibold">{value.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--nm-muted)]">{value.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nm-shell mt-8">
        <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-6 sm:p-8">
          <h2 className="nm-display text-4xl font-semibold">From Loom To You</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PROCESS.map((item) => (
              <article key={item.step} className="rounded-2xl border border-[var(--nm-border)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--nm-accent)]">{item.step}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--nm-muted)]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nm-shell mt-8">
        <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-10 text-center sm:px-8">
          <h2 className="nm-display text-4xl font-semibold">Explore the Collection</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--nm-muted)]">
            Discover curated drapes and elevated ethnic silhouettes crafted for festive moments and everyday grace.
          </p>
          <Link to="/products" className="nm-btn-primary mt-6 text-sm">
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
}
