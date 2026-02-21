import React, { useState } from "react";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Input from "../ui/Input";
import ImageUploader from "./ImageUploader";
import api from "../../api/axios";
import { showToast } from "../../utils/toast";

export default function PromoEditor({
  promo = {},
  setPromo,
  emptyPromo = () => ({}),
}) {
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setPromo({ ...promo, [field]: value });
  };

  const isValidPromo = (value) =>
    Boolean(
      (value?.title && String(value.title).trim()) ||
      (value?.img && String(value.img).trim()) ||
      (value?.buttonText && String(value.buttonText).trim())
    );

  const savePromo = async () => {
    if (!isValidPromo(promo)) {
      showToast("Add at least a title, image, or button text before saving.", "error");
      return;
    }

    setSaving(true);
    try {
      let existing = {};
      try {
        const response = await api.get("/api/content/homepage");
        existing = response?.data || {};
      } catch {
        // continue with empty base
      }

      const payload = { ...existing, promo: { ...promo } };
      await api.post("/api/content/homepage", payload);
      window.dispatchEvent(new Event("homepage:updated"));
      localStorage.setItem("homepage_last_updated_at", String(Date.now()));
      showToast("Promo saved");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to save promo";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardTitle>Promotional Banner</CardTitle>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Title"
          id="promo_title"
          value={promo.title || ""}
          onChange={(event) => handleChange("title", event.target.value)}
          placeholder="Mid-Season Sale"
        />
        <Input
          label="Subtitle"
          id="promo_subtitle"
          value={promo.subtitle || ""}
          onChange={(event) => handleChange("subtitle", event.target.value)}
          placeholder="Up to 30% off"
        />
        <Input
          label="Button Text"
          id="promo_button"
          value={promo.buttonText || ""}
          onChange={(event) => handleChange("buttonText", event.target.value)}
          placeholder="Shop Now"
        />
        <Input
          label="Button Link"
          id="promo_href"
          value={promo.href || ""}
          onChange={(event) => handleChange("href", event.target.value)}
          placeholder="/products"
        />

        <div className="md:col-span-2">
          <ImageUploader
            value={promo.img}
            onChange={(url) => handleChange("img", url)}
            label="Banner Image"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={savePromo}
          disabled={saving}
          className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Promo"}
        </button>

        <button
          type="button"
          onClick={() => setPromo(emptyPromo())}
          className="nm-btn-secondary text-sm"
        >
          Reset
        </button>
      </div>
    </Card>
  );
}
