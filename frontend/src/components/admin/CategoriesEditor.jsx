import React, { useState } from "react";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Input from "../ui/Input";
import ImageUploader from "./ImageUploader";

/**
 * CategoriesEditor (draggable)
 *
 * - Uses native HTML5 drag/drop to reorder categories.
 * - Visual cue for drag-over.
 * - Keyboard fallback buttons (Up / Down) for accessibility.
 *
 * Props:
 * - categories: array
 * - setCategories: function to update array
 * - emptyCategory: function that returns a new empty category
 */
export default function CategoriesEditor({ categories = [], setCategories, emptyCategory }) {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleChange = (index, field, value) => {
    const copy = [...categories];
    copy[index] = { ...copy[index], [field]: value };
    setCategories(copy);
  };

  const addCategory = () => {
    setCategories([...categories, emptyCategory()]);
  };

  const deleteCategory = (index) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    setCategories(categories.filter((_, i) => i !== index));
  };

  // reorder helper
  const moveItem = (from, to) => {
    if (from === to) return;
    const copy = [...categories];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setCategories(copy);
  };

  // drag handlers
  const onDragStart = (e, index) => {
    setDraggingIndex(index);
    try {
      // required for Firefox to allow dragging
      e.dataTransfer.setData("text/plain", String(index));
    } catch (err) {}
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, index) => {
    e.preventDefault(); // allow drop
    if (dragOverIndex !== index) setDragOverIndex(index);
    e.dataTransfer.dropEffect = "move";
  };

  const onDragLeave = () => {
    setDragOverIndex(null);
  };

  const onDrop = (e, index) => {
    e.preventDefault();
    let from = null;
    try {
      const d = e.dataTransfer.getData("text/plain");
      from = d ? Number(d) : draggingIndex;
    } catch (err) {
      from = draggingIndex;
    }
    const to = index;
    if (from === null || Number.isNaN(from)) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }
    moveItem(from, to);
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Card>
      <CardTitle>Category Grid (Drag to reorder)</CardTitle>

      <div className="space-y-4">
        {categories.map((cat, index) => {
          const isDragging = index === draggingIndex;
          const isDragOver = index === dragOverIndex;

          return (
            <div
              key={cat.id || cat.name || index}
              draggable
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, index)}
              onDragEnd={onDragEnd}
              className={`grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg dark:border-zinc-700 transition-shadow bg-white dark:bg-zinc-900 ${
                isDragging ? "opacity-80 ring-2 ring-dashed ring-indigo-300" : ""
              } ${isDragOver ? "shadow-lg scale-[1.01]" : ""}`}
              aria-grabbed={isDragging}
            >
              <div className="md:col-span-2 flex items-center gap-4">
                <ImageUploader
                  value={cat.img}
                  onChange={(url) => handleChange(index, "img", url)}
                  label="Category Image"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 gap-2">
                <Input
                  label="Name"
                  id={`cat_name_${index}`}
                  value={cat.name || ""}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  placeholder="Banarasi Sarees"
                />

                <Input
                  label="Link (href)"
                  id={`cat_href_${index}`}
                  value={cat.href || ""}
                  onChange={(e) => handleChange(index, "href", e.target.value)}
                  placeholder="/products?category=..."
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {/* Keyboard accessibility: Move up / down */}
                    <button
                      onClick={() => moveItem(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      title="Move up"
                      className="px-3 py-2 bg-gray-100 rounded-md disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveItem(index, Math.min(categories.length - 1, index + 1))}
                      disabled={index === categories.length - 1}
                      title="Move down"
                      className="px-3 py-2 bg-gray-100 rounded-md disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteCategory(index)}
                      className="px-3 py-2.5 bg-red-50 text-red-600 rounded-md h-11 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex">
          <button
            onClick={addCategory}
            className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium dark:border-zinc-700 dark:text-gray-300"
          >
            + Add New Category
          </button>
          <div className="ml-4 text-sm text-gray-500 dark:text-gray-400 self-center">
            Drag items to reorder. Use ↑/↓ for keyboard move.
          </div>
        </div>
      </div>
    </Card>
  );
}
