import React from "react";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Input from "../ui/Input";
import ImageUploader from "./ImageUploader";

export default function CategoriesEditor({
  categories = [],
  setCategories,
  emptyCategory,
}) {
  const safeCategories = Array.isArray(categories) ? categories : [];

  const generateSlug = (name = "") =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const buildHref = (slug = "") => (slug ? `/products?category=${slug}` : "");

  const handleNameChange = (index, value) => {
    const copy = [...safeCategories];
    copy[index] = { ...copy[index], name: value };
    setCategories(copy);
  };

  const handleNameBlur = (index) => {
    const copy = [...safeCategories];
    const current = copy[index];
    if (!current.slug && current.name) {
      const slug = generateSlug(current.name);
      copy[index] = {
        ...current,
        slug,
        href: buildHref(slug),
      };
      setCategories(copy);
    }
  };

  const handleImageChange = (index, url) => {
    const copy = [...safeCategories];
    copy[index] = { ...copy[index], img: url };
    setCategories(copy);
  };

  const moveItem = (from, to) => {
    if (to < 0 || to >= safeCategories.length || from === to) return;
    const copy = [...safeCategories];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setCategories(copy);
  };

  const deleteCategory = (index) => {
    if (!window.confirm("Delete this category?")) return;
    setCategories(safeCategories.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardTitle>Category Grid</CardTitle>

      <div className="space-y-4">
        {safeCategories.map((category, index) => (
          <div
            key={category.id || category.slug || index}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-4 md:grid-cols-4"
          >
            <div className="md:col-span-2">
              <ImageUploader
                value={category.img}
                onChange={(url) => handleImageChange(index, url)}
                label="Category Image"
              />
            </div>

            <div className="md:col-span-2 grid gap-2">
              <Input
                label="Name"
                value={category.name || ""}
                onChange={(event) => handleNameChange(index, event.target.value)}
                onBlur={() => handleNameBlur(index)}
                placeholder="Women Winter"
              />

              <Input label="Slug (locked)" value={category.slug || ""} disabled />
              <Input label="Link (auto)" value={category.href || ""} disabled />

              <div className="mt-1 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === safeCategories.length - 1}
                    className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-40"
                  >
                    Down
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => deleteCategory(index)}
                  className="rounded-full border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setCategories([...safeCategories, emptyCategory()])}
          className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-2 text-sm font-semibold hover:border-[var(--nm-accent)]"
        >
          + Add New Category
        </button>
      </div>
    </Card>
  );
}
