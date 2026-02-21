import React from "react";

const TONE_CLASS = {
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  yellow: "bg-amber-100 text-amber-800",
  blue: "bg-sky-100 text-sky-800",
};

export default function Badge({ children, tone = "amber" }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${TONE_CLASS[tone] || TONE_CLASS.amber}`}>
      {children}
    </span>
  );
}
