import React from "react";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Input from "../ui/Input";
import ImageUploader from "./ImageUploader";

export default function PromoEditor({ promo = {}, setPromo, emptyPromo }) {
  const handleChange = (field, value) => {
    setPromo({ ...promo, [field]: value });
  };

  return (
    <Card>
      <CardTitle>Promotional Banner</CardTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Title"
          id="promo_title"
          value={promo.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Mid-Season Sale"
        />
        <Input
          label="Subtitle"
          id="promo_subtitle"
          value={promo.subtitle || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          placeholder="Up to 30% off..."
        />
        <Input
          label="Button Text"
          id="promo_btn_text"
          value={promo.buttonText || ""}
          onChange={(e) => handleChange("buttonText", e.target.value)}
          placeholder="Shop Now"
        />
        <Input
          label="Button Link (href)"
          id="promo_href"
          value={promo.href || ""}
          onChange={(e) => handleChange("href", e.target.value)}
          placeholder="/sale"
        />

        <div className="md:col-span-2">
          <ImageUploader
            value={promo.img}
            onChange={(url) => handleChange("img", url)}
            label="Banner Image"
          />
        </div>
      </div>
    </Card>
  );
}
