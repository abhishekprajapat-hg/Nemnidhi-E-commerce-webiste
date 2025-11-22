// src/components/admin/PromoEditor.jsx
import React, { useState } from "react";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Input from "../ui/Input";
import ImageUploader from "./ImageUploader";
import api from "../../api/axios";
import { showToast } from "../../utils/toast";

/**
 * PromoEditor
 * Props:
 *  - promo: object
 *  - setPromo: fn to update promo in parent state
 *  - emptyPromo: fn that returns an empty promo object
 */
export default function PromoEditor({ promo = {}, setPromo, emptyPromo = () => ({}) }) {
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setPromo({ ...promo, [field]: value });
  };

  const validatePromo = (p) => {
    // basic validation: at least title or image or buttonText should exist
    if (!p) return false;
    return Boolean(
      (p.title && String(p.title).trim().length) ||
      (p.img && String(p.img).trim().length) ||
      (p.buttonText && String(p.buttonText).trim().length)
    );
  };

  const savePromo = async () => {
    if (!validatePromo(promo)) {
      showToast("Please add at least a title, image or button text before saving.", "error");
      return;
    }

    try {
      setSaving(true);

      // 1) fetch existing homepage content so we merge (prevents wiping other sections)
      let existing = {};
      try {
        const resp = await api.get("/api/content/homepage");
        existing = resp?.data || {};
      } catch (err) {
        // If GET fails it's ok — we'll create new content
        console.info("GET /api/content/homepage failed (continuing with empty):", err?.response?.status);
      }

      // 2) merge promo into existing content
      const newContent = { ...(existing || {}), promo: { ...(promo || {}) } };

      // 3) send to server (POST supported on backend)
      const resp = await api.post("/api/content/homepage", newContent);

      console.log("Promo saved response:", resp?.data);

      // 4) broadcast to other tabs/pages and notify user
      window.dispatchEvent(new Event("homepage:updated"));
      localStorage.setItem("homepage_last_updated_at", Date.now().toString());
      showToast("Promo saved");
    } catch (err) {
      console.error("savePromo failed:", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        showToast("Not authorized to save promo", "error");
      } else {
        // show server message if available
        const serverMsg = err?.response?.data?.error || err?.response?.data?.message || null;
        showToast(serverMsg || "Failed to save promo. See console.", "error");
      }
    } finally {
      setSaving(false);
    }
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

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={savePromo}
          disabled={saving}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Promo"}
        </button>

        <button
          onClick={() => setPromo(emptyPromo())}
          className="px-4 py-2 rounded border"
        >
          Reset
        </button>
      </div>
    </Card>
  );
}
