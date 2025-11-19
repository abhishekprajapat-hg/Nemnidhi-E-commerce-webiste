import React from "react";
import { Link } from "react-router-dom";
import Section from "./Section";

export default function CategoryGrid({ categories = [] }) {
  // If no categories, don't render the whole section
  if (!Array.isArray(categories) || categories.length === 0) {
    return null; // or return a placeholder if you want
  }

  const fallbackImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dy='.3em' font-size='20' text-anchor='middle' fill='%23999'%3EImage%20Unavailable%3C/text%3E%3C/svg%3E";

  return (
    <Section className="bg-[#fdf7f7] dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat?._id || cat.name}
              to={cat?.href || "#"}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg"
            >
              <img
                src={cat?.img}
                alt={cat?.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.src = fallbackImg;
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              <div className="absolute bottom-6 left-6">
                <h3 className="text-2xl font-semibold text-white">
                  {cat?.name || "Category"}
                </h3>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </Section>
  );
}
