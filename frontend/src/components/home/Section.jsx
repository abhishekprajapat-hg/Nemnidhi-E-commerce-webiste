import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function Section({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`py-10 sm:py-14 lg:py-16 ${className}`}
    >
      {children}
    </motion.section>
  );
}
