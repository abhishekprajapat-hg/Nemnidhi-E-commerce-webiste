import React from "react";
import Section from "./Section";
import { ProductCard, SkeletonProductCard } from "./ProductCard";


export default function ProductCarousel({ title, products, loading, onAddToCart }) {
return (
<Section className="bg-[#fdf7f7] dark:bg-black">
<div className="max-w-7xl mx-auto px-6 lg:px-8">
<h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">{title}</h2>
<div className="grid grid-cols-1 gap-6">
{loading ? (
<div className="flex space-x-6">{[...Array(4)].map((_, i) => (<SkeletonProductCard key={i} />))}</div>
) : !products.length ? (
<p className="text-gray-500 dark:text-gray-400">No new arrivals found.</p>
) : (
<div className="flex space-x-6 overflow-x-auto pb-6 -mb-6 scrollbar-hide">
{products.map((p) => (<ProductCard key={p._id} p={p} onAddToCart={onAddToCart} />))}
</div>
)}
</div>
</div>
</Section>
);
}