import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";


export default function Section({ children, className = "" }) {
const ref = useRef(null);
const isInView = useInView(ref, { once: true, margin: "-100px 0px" });


return (
<motion.section
ref={ref}
initial={{ opacity: 0, y: 40 }}
animate={isInView ? { opacity: 1, y: 0 } : {}}
transition={{ duration: 0.6, ease: "easeOut" }}
className={`py-16 md:py-24 ${className}`}
>
{children}
</motion.section>
);
}