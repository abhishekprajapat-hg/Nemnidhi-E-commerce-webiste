import React from "react";
import { motion } from "framer-motion";

const MARQUEE_ITEMS = [
  "Authentic handloom promise",
  "Free shipping above Rs 2000",
  "Hand-finished by skilled artisans",
  "Secure checkout and easy support",
];

export default function ScrollingMarquee() {
  return (
    <section className="mt-8 border-y border-[var(--nm-border)] bg-[var(--nm-surface)] py-3">
      <div className="overflow-hidden">
        <motion.div
          className="flex w-max whitespace-nowrap"
          initial={{ x: "0%" }}
          animate={{ x: "-50%" }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1].map((loop) => (
            <div key={loop} className="flex items-center gap-8 px-4 sm:px-8">
              {MARQUEE_ITEMS.map((item) => (
                <div key={`${loop}-${item}`} className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
                    {item}
                  </span>
                  <span className="text-[var(--nm-accent)]">+</span>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
