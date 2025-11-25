// src/components/product/ProductAccordions.jsx
import React from "react";
import Accordion from "../ui/Accordion";

export default function ProductAccordions({ description }) {
  return (
    <div className="pt-4 space-y-2">
      {description && <Accordion title="Description" defaultOpen={true}>{description}</Accordion>}
    </div>
  );
}
