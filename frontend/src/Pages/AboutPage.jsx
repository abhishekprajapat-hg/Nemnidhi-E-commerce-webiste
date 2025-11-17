import React from "react";
import { Link } from "react-router-dom";

// ⭐️ Naye icons (Values section ke liye)
const IconUsers = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconSwatch = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12.5a.5.5 0 00.5-.5V6a.5.5 0 00-.5-.5H9.5a2 2 0 00-2 2v13z" />
  </svg>
);

const IconShield = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12 12 0 0012 21.697z" />
  </svg>
);


export default function AboutPage() {
  return (
    // ⭐️ 1. Light theme (default) aur dark theme classes
    <div className="min-h-screen bg-white text-gray-900 dark:bg-zinc-900 dark:text-gray-100">
      
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 px-6 bg-gray-50 border-b border-gray-200 dark:bg-zinc-800 dark:border-zinc-700">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
          {/* ⭐️ 2. Brand se match karta hua content (dark mode gradient ke saath) */}
          About <span className="text-indigo-600 dark:text-yellow-400">My Shop</span>
        </h1>
        <p className="max-w-2xl text-gray-600 dark:text-gray-300 text-lg">
          Celebrating the rich heritage of Indian textiles and the artisans who create them.
        </p>
      </section>

      {/* Our Story */}
      <section className="max-w-6xl mx-auto py-20 px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 dark:text-white">Our Story</h2>
            {/* ⭐️ 3. Content ko Saree/Handloom theme par focus kiya hai */}
            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Founded in 2025, <span className="text-gray-900 dark:text-white font-semibold">My Shop</span> was born from a deep love for India's rich textile traditions. We wanted to build a bridge between the timeless art of handloom and the modern wardrobe.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We partner directly with weaver communities across the country—from the master artisans of Varanasi to the Kanjivaram weavers of the south. Our collection is a celebration of their generational skills, curated for those who value authenticity and elegance.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm">
            {/* ⭐️ 4. Image ko behtar URL se replace kiya hai */}
            <img
              src="https://img.freepik.com/premium-photo/stack-folded-silk-sarees-vibrant-hues-created-with-generative-ai_419341-23285.jpg"
              alt="Handloom weaver"
              className="object-cover w-full h-[400px] hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-gray-50 border-y border-gray-200 py-20 dark:bg-black dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">Our Values</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {/* ⭐️ 5. Values ko brand ke hisab se badal diya hai (dark mode ke saath) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 dark:bg-yellow-400/10 dark:text-yellow-400">
                <IconUsers />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Artisan Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                We partner directly with weaver communities, ensuring fair wages and preserving generational skills.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 dark:bg-yellow-400/10 dark:text-yellow-400">
                <IconSwatch />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentic Handloom</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Every saree is a piece of art, guaranteed to be genuine handloom, celebrating its unique character.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 dark:bg-yellow-400/10 dark:text-yellow-400">
                <IconShield />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Timeless Quality</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                We focus on pure materials and lasting quality, creating heirlooms that can be passed down for generations.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ⭐️ 6. NAYA SECTION: "Our Process" (Dark mode ke saath) */}
      <section className="max-w-6xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">From Loom to Your Home</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-200 dark:text-zinc-700 mb-2">01.</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Curation</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">We travel across India to discover unique designs and partner with artisan families.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-200 dark:text-zinc-700 mb-2">02.</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Crafting</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Each piece is meticulously woven on a traditional handloom, a process that can take days or even weeks.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-200 dark:text-zinc-700 mb-2">03.</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quality Check</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Our team personally inspects every single item for quality and finish before it reaches you.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gray-50 border-t border-gray-200 py-20 px-6 text-center dark:bg-black dark:border-zinc-800">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Explore Our Heritage</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
          Find a piece of tradition that tells your story. Browse our latest collection of handwoven sarees and ethnic wear.
        </p>
        {/* ⭐️ 7. Button ko primary style (black/white) se match kiya hai */}
        <Link
          to="/products"
          className="inline-block bg-black text-white font-medium px-8 py-3 rounded-md hover:bg-gray-800 transition dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Shop The Collection
        </Link>
      </section>
    </div>
  );
}