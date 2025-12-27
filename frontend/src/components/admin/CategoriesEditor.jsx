import React, { useState } from "react";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Input from "../ui/Input";
import ImageUploader from "./ImageUploader";

/**
 * CategoriesEditor (SAFE SLUG – FINAL)
 *
 * RULES:
 * - slug is generated ONCE on name blur
 * - slug never changes after generation
 * - name is fully editable
 * - href is derived from slug
 */

export default function CategoriesEditor({
  categories,
  setCategories,
  emptyCategory,
}) {
  const safeCategories = Array.isArray(categories) ? categories : [];

  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const generateSlug = (name = "") =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const buildHref = (slug) =>
    slug ? `/products?category=${slug}` : "";

  // ✅ ONLY update name here
  const handleNameChange = (index, value) => {
    const copy = [...safeCategories];
    copy[index] = { ...copy[index], name: value };
    setCategories(copy);
  };

  // ✅ SLUG GENERATED HERE (ON BLUR, FULL VALUE)
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

  const addCategory = () => {
    setCategories([...safeCategories, emptyCategory()]);
  };

  const deleteCategory = (index) => {
    if (
      !window.confirm(
        "Deleting a category may affect products using it.\nAre you sure?"
      )
    )
      return;
    setCategories(safeCategories.filter((_, i) => i !== index));
  };

  const moveItem = (from, to) => {
    if (from === to) return;
    const copy = [...safeCategories];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setCategories(copy);
  };

  return (
    <Card>
      <CardTitle>Category Grid (Drag to reorder)</CardTitle>

      <div className="space-y-4">
        {safeCategories.map((cat, index) => (
          <div
            key={cat.slug || index}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-white dark:bg-zinc-900 dark:border-zinc-700"
          >
            <div className="md:col-span-2">
              <ImageUploader
                value={cat.img}
                onChange={(url) => handleImageChange(index, url)}
                label="Category Image"
              />
            </div>

            <div className="md:col-span-2 grid gap-2">
              <Input
                label="Name"
                value={cat.name || ""}
                onChange={(e) =>
                  handleNameChange(index, e.target.value)
                }
                onBlur={() => handleNameBlur(index)}
                placeholder="Women Winter"
              />

              <Input
                label="Slug (locked)"
                value={cat.slug || ""}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />

              <Input
                label="Link (auto)"
                value={cat.href || ""}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />

              <div className="flex justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="px-3 py-2 bg-gray-100 rounded"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === safeCategories.length - 1}
                    className="px-3 py-2 bg-gray-100 rounded"
                  >
                    ↓
                  </button>
                </div>

                <button
                  onClick={() => deleteCategory(index)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addCategory}
          className="px-4 py-2 border rounded text-sm"
        >
          + Add New Category
        </button>
      </div>
    </Card>
  );
}
