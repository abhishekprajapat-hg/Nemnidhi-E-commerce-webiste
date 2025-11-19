import React from "react";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Input from "../ui/Input";
import ImageUploader from "./ImageUploader";

export default function CategoriesEditor({ categories = [], setCategories, emptyCategory }) {
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

  return (
    <Card>
      <CardTitle>Category Grid</CardTitle>

      <div className="space-y-4">
        {categories.map((cat, index) => (
          <div
            key={cat.id || index}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg dark:border-zinc-700"
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

              <div className="flex justify-end">
                <button
                  onClick={() => deleteCategory(index)}
                  className="px-3 py-2.5 bg-red-50 text-red-600 rounded-md h-11 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addCategory}
          className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium dark:border-zinc-700 dark:text-gray-300"
        >
          + Add New Category
        </button>
      </div>
    </Card>
  );
}
