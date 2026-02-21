import React from "react";

const ColorSwatch = React.memo(function ColorSwatch({ color, isSelected, onClick }) {
  const safeColor = String(color || "").trim();
  const backgroundStyle = { backgroundColor: safeColor || "transparent" };

  return (
    <button
      type="button"
      onClick={onClick}
      title={safeColor || "color"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-[10px] font-semibold uppercase transition ${
        isSelected
          ? "border-[var(--nm-accent)] ring-2 ring-[var(--nm-accent-soft)]"
          : "border-[var(--nm-border)] hover:border-[var(--nm-accent)]"
      }`}
      style={backgroundStyle}
    >
      {/^(#|rgb|hsl)/i.test(safeColor) ? null : <span className="text-[var(--nm-text)]">{safeColor.slice(0, 2) || "C"}</span>}
      <span className="sr-only">{safeColor || "color"}</span>
    </button>
  );
});

export default ColorSwatch;
