import React from "react";
import Section from "./Section";


export default function TestimonialSection() {
const testimonials = [
{ name: "Priya S.", quote: "The quality of the silk is amazing! The color is so vibrant and exactly as shown on the website." },
{ name: "Rohan M.", quote: "Wore this lehenga to a wedding and got so many compliments. Fast shipping and perfect fit!" },
{ name: "Anjali K.", quote: "The handwork on my kurta set is so intricate. You can tell it's made with care. Worth every penny." },
];


return (
<Section className="bg-[#fdf7f7] dark:bg-zinc-900">
<div className="max-w-7xl mx-auto px-6 lg:px-8">
<h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-12">What Our Customers Say</h2>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
{testimonials.map((t) => (
<div key={t.name} className="p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
<p className="text-gray-700 dark:text-gray-300">"{t.quote}"</p>
<p className="mt-4 font-semibold text-gray-900 dark:text-white">— {t.name}</p>
</div>
))}
</div>
</div>
</Section>
);
}
