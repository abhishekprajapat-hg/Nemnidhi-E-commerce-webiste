import React, { useRef, useState } from "react";
import api from "../../api/axios";

export default function ImageUploader({
  value,
  onChange,
  label = "Image",
  accept = "image/*",
}) {
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
      const message = err?.response?.data?.message || err.message || "Upload failed";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = await uploadFile(file);
    if (url) {
      onChange(url);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => onChange(event.target.result);
      reader.readAsDataURL(file);
    } catch {
      // ignore fallback failures
    }
  };

  const onInputChange = (event) => {
    onFiles(event.target.files);
    event.target.value = null;
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (event.dataTransfer?.files?.length) onFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-3 transition ${
          dragging
            ? "border-[var(--nm-accent)] bg-[var(--nm-accent-soft)]"
            : "border-[var(--nm-border)] bg-[var(--nm-surface)]"
        }`}
      >
        <div className="h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-[var(--nm-border)] bg-[var(--nm-bg-elevated)]">
          {value ? (
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[var(--nm-muted)]">
              No image
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-[var(--nm-muted)]">
              {value ? "Change image or drop another" : "Click or drop an image here"}
            </p>
            <div className="flex items-center gap-2">
              {loading && <span className="text-xs text-[var(--nm-muted)]">Uploading...</span>}
              {value && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(null);
                  }}
                  className="rounded-full border border-red-300 px-2 py-1 text-xs font-semibold text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <p className="mt-1 text-xs text-[var(--nm-muted)]">Supported: JPG / PNG / GIF.</p>
        </div>
      </div>
    </div>
  );
}
