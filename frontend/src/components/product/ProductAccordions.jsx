// src/components/product/ProductAccordions.jsx
import React from "react";
import Accordion from "../ui/Accordion";

export default function ProductAccordions({ description }) {
  return (
    <div className="pt-4 space-y-2">
      {description && <Accordion title="Description" defaultOpen={true}>{description}</Accordion>}
      <Accordion title="Materials & Care">
        <p>• Saree: 100% Pure Banarasi Silk</p>
        <p>• Blouse: Silk Blend</p>
        <p className="mt-2">Care: Dry clean only. Store in a muslin cloth.</p>
      </Accordion>
      <Accordion title="Shipping & Returns">
        <p>• Free shipping across India. Dispatched in 2-3 business days.</p>
        <p className="mt-2">• 30-day free returns. Item must be in original, unused condition with all tags attached.</p>
      </Accordion>
    </div>
  );
}
