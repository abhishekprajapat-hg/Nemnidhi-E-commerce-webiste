import React from "react";
import Section from "./Section";


const IconHandloom = () => (
<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13.5M9.75 6.253v13.5M14.25 6.253v13.5M4.5 10.5h15M4.5 13.5h15M7.5 18.253v-2.5M16.5 18.253v-2.5M2.25 12l19.5 0" />
</svg>
);
const IconSecure = () => (
<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12 12 0 0012 21.697z" />
</svg>
);
const IconShipping = () => (
<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 0h17.25M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25v2.25a2.25 2.25 0 002.25 2.25z" />
</svg>
);


export default function TrustIconsSection() {
return (
<Section className="bg-[#fdf7f7] dark:bg-zinc-900">
<div className="max-w-7xl mx-auto px-6 lg:px-8">
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
<div className="flex items-start gap-4">
<div className="shrink-0 bg-gray-100 dark:bg-zinc-800 p-3 rounded-full text-indigo-600 dark:text-yellow-400">
<IconHandloom />
</div>
<div>
<h3 className="text-lg font-semibold dark:text-white">Authentic Handloom</h3>
<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Guaranteed genuine artisanal crafts sourced directly from weavers.</p>
</div>
</div>


<div className="flex items-start gap-4">
<div className="shrink-0 bg-gray-100 dark:bg-zinc-800 p-3 rounded-full text-indigo-600 dark:text-yellow-400">
<IconShipping />
</div>
<div>
<h3 className="text-lg font-semibold dark:text-white">Free Shipping</h3>
<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enjoy free shipping on all orders over ₹2000 across India.</p>
</div>
</div>


<div className="flex items-start gap-4">
<div className="shrink-0 bg-gray-100 dark:bg-zinc-800 p-3 rounded-full text-indigo-600 dark:text-yellow-400">
<IconSecure />
</div>
<div>
<h3 className="text-lg font-semibold dark:text-white">Secure Payments</h3>
<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Shop with confidence using our secure Razorpay gateway.</p>
</div>
</div>
</div>
</div>
</Section>
);
}