import React from "react";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Input from "../ui/Input";
import ImageUploader from "./ImageUploader"; // relative to admin folder

export default function HeroSlidesEditor({ slides = [], setSlides, emptySlide }) {
  const handleChange = (index, field, value) => {
    const copy = [...slides];
    copy[index] = { ...copy[index], [field]: value };
    setSlides(copy);
  };

  const addSlide = () => {
    setSlides([...slides, emptySlide()]);
  };

  const deleteSlide = (index) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    setSlides(slides.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardTitle>Hero Carousel Slides</CardTitle>

      <div className="space-y-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-lg dark:border-zinc-700"
          >
            <div className="md:col-span-2 flex items-center gap-4">
              <ImageUploader
                value={slide.img}
                onChange={(url) => handleChange(index, "img", url)}
                label="Slide Image"
              />
            </div>

            <div className="md:col-span-3 grid grid-cols-1 gap-2">
              <Input
                label="Title"
                id={`hero_title_${index}`}
                value={slide.title || ""}
                onChange={(e) => handleChange(index, "title", e.target.value)}
                placeholder="Elegance Woven"
              />
              <Input
                label="Subtitle"
                id={`hero_sub_${index}`}
                value={slide.subtitle || ""}
                onChange={(e) => handleChange(index, "subtitle", e.target.value)}
                placeholder="Discover our collection..."
              />
              <Input
                label="Link (href)"
                id={`hero_href_${index}`}
                value={slide.href || ""}
                onChange={(e) => handleChange(index, "href", e.target.value)}
                placeholder="/products?category=Saree"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => deleteSlide(index)}
                  className="px-3 py-2.5 bg-red-50 text-red-600 rounded-md h-11 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addSlide}
          className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium dark:border-zinc-700 dark:text-gray-300"
        >
          + Add New Slide
        </button>
      </div>
    </Card>
  );
}
