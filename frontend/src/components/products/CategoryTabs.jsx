import React, { memo, useMemo } from "react";

const DEFAULT_CAT_IMAGE = "/placeholder.png";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

const CategoryButton = memo(function CategoryButton({
  label,
  image,
  active,
  onClick,
  isAll = false,
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      onClick={onClick}
      className={`group flex min-w-[7.25rem] shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition ${
        active
          ? "border-[var(--nm-accent)] bg-[var(--nm-accent-soft)] shadow-sm"
          : "border-[var(--nm-border)] bg-[var(--nm-card)] hover:border-[var(--nm-accent)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border ${
          active ? "border-[var(--nm-accent)]" : "border-[var(--nm-border)]"
        } bg-[var(--nm-bg-elevated)]`}
      >
        {isAll ? (
          <svg className="h-4 w-4 text-[var(--nm-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
          </svg>
        ) : (
          <img
            src={image || DEFAULT_CAT_IMAGE}
            alt={label}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = DEFAULT_CAT_IMAGE;
            }}
          />
        )}
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--nm-text)]">
        {label}
      </span>
    </button>
  );
});

export default function CategoryTabs({ categories = [], activeCategory, onSelect }) {
  const normalizedCategories = useMemo(() => {
    const seen = new Set();
    return categories
      .map((category) => {
        const name = String(category?.name || category?.title || "").trim();
        const slug = String(category?.slug || name).trim();
        const key = normalize(slug);
        if (!name || !slug || seen.has(key)) return null;
        seen.add(key);
        return { name, slug, img: category?.img || DEFAULT_CAT_IMAGE, key };
      })
      .filter(Boolean);
  }, [categories]);

  const activeKey = normalize(activeCategory);

  return (
    <nav className="mb-7" aria-label="Product categories">
      <div className="overflow-x-auto pb-1 no-scrollbar">
        <ul className="flex w-max items-center gap-2" role="tablist">
          <li className="shrink-0">
            <CategoryButton
              label="All"
              isAll
              active={!activeCategory}
              onClick={() => onSelect?.(null)}
            />
          </li>

          {normalizedCategories.map((category) => (
            <li key={category.key} className="shrink-0">
              <CategoryButton
                label={category.name}
                image={category.img}
                active={activeKey === category.key}
                onClick={() => onSelect?.(category.slug)}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
