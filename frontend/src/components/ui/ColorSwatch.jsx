// src/components/ui/ColorSwatch.jsx
import React from "react";

const ColorSwatch = React.memo(({ color, isSelected, onClick }) => {
  const style = {};
  try {
    style.backgroundColor = color;
  } catch (e) {
    // ignore
  }
  return (
    <button
      onClick={onClick}
      title={color}
      className={`w-8 h-8 rounded-full border border-gray-300 dark:border-zinc-700 flex items-center justify-center text-xs ${
        isSelected ? "ring-2 ring-black dark:ring-white ring-offset-1" : ""
      }`}
      style={style}
    >
      {!style.backgroundColor && <span className="text-xs dark:text-white">{color}</span>}
      <span className="sr-only">{color}</span>
    </button>
  );
});

export default ColorSwatch;
