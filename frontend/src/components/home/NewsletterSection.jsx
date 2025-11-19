import React from "react";
import Section from "./Section";


export default function NewsletterSection() {
return (
<Section className="bg-[#fdf7f7] dark:bg-black">
<div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
<h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Stay in the Loop</h2>
<p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Join our newsletter to receive updates on new arrivals, exclusive offers, and the stories behind our crafts.</p>
<form className="mt-8 flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
<input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
<button type="submit" className="px-8 py-3 rounded-md bg-black text-white font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors shadow-lg">Subscribe</button>
</form>
</div>
</Section>
);
}