import React, { useState } from "react";

const Accordion = React.memo(function Accordion({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
      >
        <span>{title}</span>
        <span className="text-xs text-[var(--nm-muted)]">{isOpen ? "Hide" : "Show"}</span>
      </button>

      {isOpen ? (
        <div className="border-t border-[var(--nm-border)] px-4 py-3 text-sm leading-relaxed text-[var(--nm-muted)]">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export default Accordion;
