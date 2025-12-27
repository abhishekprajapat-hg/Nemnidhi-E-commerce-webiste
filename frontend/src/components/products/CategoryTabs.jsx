// src/components/products/CategoryTabs.jsx
import React from "react";

const DEFAULT_CAT_IMAGE = "/mnt/data/d5ff4896-1e72-4950-a3f0-2be7cede2a70.png";

export default function CategoryTabs({
  categories = [],
  activeCategory,
  onSelect,
}) {
  const normalized = categories.map((c) => {
    const name = c.name || c.title || "";
    const slug =
      c.slug ||
      (typeof c.href === "string"
        ? new URLSearchParams(c.href.split("?")[1]).get("category")
        : "");

    return {
      name,
      slug,
      img: c.img || DEFAULT_CAT_IMAGE,
    };
  });

  return (
    <nav className="mb-6">
      <div className="overflow-x-auto no-scrollbar">
        <ul className="flex items-end gap-8 px-4 sm:px-6 lg:px-8">
          {/* All Tab */}
          <li className="flex-shrink-0">
            <button
              onClick={() => onSelect(null)}
              className={`flex flex-col items-center gap-2 py-1 px-2 ${
                !activeCategory ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-pink-50 flex items-center justify-center shadow-sm">
                <div className="w-[84%] h-[84%] rounded-full bg-white flex items-center justify-center">
                  <svg className="w-7 h-7 text-indigo-600" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 2L15 9H22L17 14L19 21L12 17 5 21 7 14 2 9H9z"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-xs md:text-sm mt-1">All</span>
            </button>
          </li>

          {/* Dynamic categories */}
          {normalized.map((cat) => {
            const isActive = activeCategory === cat.slug;

            return (
              <li key={cat.slug} className="flex-shrink-0">
                <button
                  onClick={() => onSelect(cat.slug)}
                  className={`flex flex-col items-center gap-2 py-1 px-2 ${
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <div
                    className={`relative w-20 h-20 md:w-24 md:h-24 rounded-t-2xl rounded-b-full flex items-end justify-center bg-pink-50 ${
                      isActive ? "ring-2 ring-indigo-300" : "hover:scale-105"
                    }`}
                    style={{ paddingBottom: 6 }}
                  >
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-white shadow-sm">
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <span className="text-xs md:text-sm mt-2 capitalize">
                    {cat.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
