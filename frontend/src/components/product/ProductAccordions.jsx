import React from "react";
import Accordion from "../ui/Accordion";

export default function ProductAccordions({ description }) {
  if (!description) return null;

  return (
    <div className="pt-1">
      <Accordion title="Description" defaultOpen>
        {description}
      </Accordion>
    </div>
  );
}
