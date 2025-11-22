// src/components/ui/Accordion.jsx
import React, { useState } from "react";

const Accordion = React.memo(({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200 dark:border-zinc-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-4 text-left font-medium dark:text-white"
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
      {isOpen && <div className="pb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>}
    </div>
  );
});

export default Accordion;
