import React from "react";
import { motion } from "framer-motion";


export default function ScrollingMarquee() {
return (
<div className="py-4 bg-[#fdf7f7] text-black overflow-hidden dark:bg-zinc-800 dark:text-gray-200">
<motion.div initial={{ x: "0%" }} animate={{ x: "-50%" }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="flex whitespace-nowrap">
{[...Array(2)].map((_, i) => (
<div key={i} className="flex space-x-12 px-6 text-sm font-semibold tracking-wider uppercase">
<span>Authentic Handloom Guaranteed</span>
<span className="text-gray-700 dark:text-gray-400">★</span>
<span>Free Shipping Across India</span>
<span className="text-gray-700 dark:text-gray-400">★</span>
<span>International Shipping Available</span>
<span className="text-gray-700 dark:text-gray-400">★</span>
<span>Handcrafted by Artisans</span>
<span className="text-gray-700 dark:text-gray-400">★</span>
</div>
))}
</motion.div>
</div>
);
}