import React, { useRef, useState } from "react";
import api from "../../api/axios";

/**
 * ImageUploader: small reusable uploader used across admin editors.
 * - value: current image URL (string)
 * - onChange: (url|null) => void
 * - label: string
 */
export default function ImageUploader({ value, onChange, label = "Image", accept = "image/*" }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const uploadFile = async (file) => {
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.url || null;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Upload failed";
      setError(msg);
      console.warn("Upload error", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = await uploadFile(file);

    if (!url) {
      // fallback to data URL preview if upload failed
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange(e.target.result);
        };
        reader.readAsDataURL(file);
        return;
      } catch (e) {
        // ignore
      }
    } else {
      onChange(url);
    }
  };

  const onClick = () => {
    inputRef.current?.click();
  };

  const onInputChange = (e) => {
    onFiles(e.target.files);
    e.target.value = null;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
  };

  const remove = (e) => {
    e?.stopPropagation();
    onChange(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onInputChange} />

      <div
        onClick={onClick}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        className={`w-full rounded-md border-2 border-dashed p-3 flex items-center gap-3 cursor-pointer ${
          dragging ? "ring-2 ring-indigo-500 border-indigo-300" : "border-gray-200"
        } bg-gray-50 dark:bg-zinc-900/30`}
      >
        <div className="w-28 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-700 flex-shrink-0">
          {value ? (
            // small preview
            // Consider adding width/height props if needed
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              No image
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {value ? "Change image or drop another" : "Click or drop an image here"}
            </div>
            <div className="flex items-center gap-2">
              {loading && <div className="text-xs text-gray-500 dark:text-gray-400">Uploading…</div>}
              {value && (
                <button
                  type="button"
                  onClick={remove}
                  className="text-xs px-2 py-1 bg-white border rounded text-red-600 dark:bg-red-900/40"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
          <div className="text-xs text-gray-400 mt-1">Supported: JPG / PNG / GIF. Max single file.</div>
        </div>
      </div>
    </div>
  );
}