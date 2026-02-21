import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import AdminLayout from "../components/admin/AdminLayout";

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none ${props.className || ""}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none ${props.className || ""}`}
    />
  );
}

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [product, setProduct] = useState({
    title: "",
    slug: "",
    description: "",
    category: "",
    variants: [],
  });
  const [availableCategories, setAvailableCategories] = useState([]);

  const mountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(Boolean(id));

      api
        .get("/api/content/homepage")
        .then((res) => {
          if (cancelled) return;
          const categories = Array.isArray(res.data?.categories)
            ? res.data.categories
                .filter((cat) => cat && cat.slug && cat.name)
                .map((cat) => ({ name: cat.name, slug: cat.slug }))
            : [];
          setAvailableCategories(categories);
        })
        .catch(() => {});

      if (!id) {
        if (!cancelled) setLoading(false);
        return;
      }

      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      try {
        const res = await api.get(`/api/products/${id}`, {
          signal: controllerRef.current.signal,
        });
        if (cancelled) return;

        const data = res.data || {};
        const variants = (Array.isArray(data.variants) ? data.variants : []).map((variant) => ({
          id: variant.id || genId(),
          color: variant.color || "",
          images: Array.isArray(variant.images) ? variant.images : [],
          sizes: Array.isArray(variant.sizes)
            ? variant.sizes.map((size) => ({
                size: size.size || "",
                price: Number(size.price || 0),
                stock: Number(size.stock || 0),
              }))
            : [],
        }));

        setProduct({
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          category: data.category || "",
          variants,
        });
        setDirty(false);
      } catch (err) {
        if (err?.name === "AbortError" || err?.name === "CanceledError") return;
        showToast("Failed to load product", "error");
      } finally {
        if (!cancelled) setLoading(false);
        controllerRef.current = null;
      }
    }

    load();
    return () => {
      cancelled = true;
      controllerRef.current?.abort();
    };
  }, [id]);

  useEffect(() => {
    const handler = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const updateProduct = useCallback((updater) => {
    setProduct((previous) => {
      const next = typeof updater === "function" ? updater(previous) : { ...previous, ...updater };
      return next;
    });
    setDirty(true);
  }, []);

  const addVariant = useCallback(() => {
    updateProduct((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), { id: genId(), color: "", images: [], sizes: [] }],
    }));
  }, [updateProduct]);

  const removeVariant = useCallback(
    (variantId) => {
      updateProduct((prev) => ({
        ...prev,
        variants: (prev.variants || []).filter((variant) => variant.id !== variantId),
      }));
    },
    [updateProduct]
  );

  const updateVariantField = useCallback(
    (variantId, field, value) => {
      updateProduct((prev) => ({
        ...prev,
        variants: (prev.variants || []).map((variant) =>
          variant.id === variantId ? { ...variant, [field]: value } : variant
        ),
      }));
    },
    [updateProduct]
  );

  const addSize = useCallback(
    (variantId) => {
      updateProduct((prev) => ({
        ...prev,
        variants: (prev.variants || []).map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
                sizes: [...(variant.sizes || []), { size: "", price: 0, stock: 0 }],
              }
            : variant
        ),
      }));
    },
    [updateProduct]
  );

  const removeSize = useCallback(
    (variantId, sizeIndex) => {
      updateProduct((prev) => ({
        ...prev,
        variants: (prev.variants || []).map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
                sizes: (variant.sizes || []).filter((_, idx) => idx !== sizeIndex),
              }
            : variant
        ),
      }));
    },
    [updateProduct]
  );

  const updateSizeField = useCallback(
    (variantId, sizeIndex, field, value) => {
      updateProduct((prev) => ({
        ...prev,
        variants: (prev.variants || []).map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
                sizes: (variant.sizes || []).map((size, idx) =>
                  idx === sizeIndex ? { ...size, [field]: value } : size
                ),
              }
            : variant
        ),
      }));
    },
    [updateProduct]
  );

  const uploadFile = useCallback(async (file) => {
    const attemptUpload = async (url) => {
      try {
        const form = new FormData();
        form.append("file", file);
        const response = await api.post(url, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data?.url || null;
      } catch {
        return null;
      }
    };

    const endpoints = ["/api/upload/image", "/api/upload"];
    for (const endpoint of endpoints) {
      const result = await attemptUpload(endpoint);
      if (result) return result;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event?.target?.result || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  const onFilesSelected = useCallback(
    async (variantId, files) => {
      if (!files || files.length === 0) return;

      const urls = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        if (url) urls.push(url);
      }

      if (urls.length > 0) {
        updateProduct((prev) => ({
          ...prev,
          variants: (prev.variants || []).map((variant) =>
            variant.id === variantId
              ? { ...variant, images: [...(variant.images || []), ...urls] }
              : variant
          ),
        }));
      }
    },
    [uploadFile, updateProduct]
  );

  const save = useCallback(
    async (event) => {
      event?.preventDefault();

      if (!product.title || !product.slug) {
        showToast("Title and slug are required", "error");
        return;
      }

      setSaving(true);
      try {
        const payload = {
          title: String(product.title || "").trim(),
          slug: String(product.slug || "").trim(),
          description: String(product.description || ""),
          category: String(product.category || ""),
          variants: (product.variants || []).map((variant) => ({
            color: String(variant.color || "").trim(),
            images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
            sizes: (Array.isArray(variant.sizes) ? variant.sizes : []).map((size) => ({
              size: String(size.size || "").trim(),
              price: Number(size.price || 0),
              stock: Number(size.stock || 0),
            })),
          })),
        };

        if (id) await api.put(`/api/products/${id}`, payload);
        else await api.post("/api/products", payload);

        setDirty(false);
        showToast("Product saved successfully");
        navigate("/admin/products");
      } catch (err) {
        showToast(`Save failed: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setSaving(false);
      }
    },
    [product, id, navigate]
  );

  const categoryOptions = useMemo(() => availableCategories.filter(Boolean), [availableCategories]);
  const selectedCategoryName = useMemo(() => {
    const cat = availableCategories.find((entry) => entry.slug === product.category);
    return cat?.name || product.category || "No category";
  }, [availableCategories, product.category]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="nm-display text-4xl font-semibold leading-none sm:text-5xl">
              {id ? "Edit Product" : "Create Product"}
            </h2>
            <p className="mt-2 text-sm text-[var(--nm-muted)]">
              Manage product details, variants, images, and stock.
            </p>
          </div>

          <button
            onClick={() => {
              if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
              navigate("/admin/products");
            }}
            className="nm-btn-secondary text-sm"
          >
            Back
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-12 text-center text-sm text-[var(--nm-muted)]">
            Loading...
          </div>
        ) : (
          <form onSubmit={save} className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Title">
                    <TextInput
                      value={product.title}
                      onChange={(event) => updateProduct({ title: event.target.value })}
                    />
                  </Field>
                  <Field label="Slug">
                    <TextInput
                      value={product.slug}
                      onChange={(event) => updateProduct({ slug: event.target.value })}
                    />
                  </Field>
                  <Field label="Category">
                    <select
                      value={product.category}
                      onChange={(event) => updateProduct({ category: event.target.value })}
                      className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Description">
                    <TextArea
                      rows={5}
                      value={product.description}
                      onChange={(event) => updateProduct({ description: event.target.value })}
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Product Variants</h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="nm-btn-secondary text-sm"
                  >
                    + Add Variant
                  </button>
                </div>

                {product.variants.length === 0 && (
                  <p className="text-sm text-[var(--nm-muted)]">No variants added yet.</p>
                )}

                <div className="space-y-4">
                  {product.variants.map((variant, variantIndex) => (
                    <article
                      key={variant.id}
                      className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)]">
                          Variant {variantIndex + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>

                      <Field label="Color">
                        <TextInput
                          value={variant.color}
                          onChange={(event) => updateVariantField(variant.id, "color", event.target.value)}
                        />
                      </Field>

                      <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="nm-btn-secondary cursor-pointer text-sm">
                            Upload Images
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(event) => onFilesSelected(variant.id, event.target.files)}
                            />
                          </label>
                          <span className="text-xs text-[var(--nm-muted)]">You can add multiple images</span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {(variant.images || []).map((image, imageIndex) => (
                            <div key={imageIndex} className="relative overflow-hidden rounded-xl border border-[var(--nm-border)]">
                              <img
                                src={image}
                                alt={`variant-${variantIndex}-img-${imageIndex}`}
                                className="h-20 w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.src = "/placeholder.png";
                                }}
                              />
                              <button
                                type="button"
                                className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold"
                                onClick={() =>
                                  updateVariantField(
                                    variant.id,
                                    "images",
                                    (variant.images || []).filter((_, idx) => idx !== imageIndex)
                                  )
                                }
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold">Sizes</p>
                          <button
                            type="button"
                            onClick={() => addSize(variant.id)}
                            className="nm-btn-secondary text-xs"
                          >
                            + Add Size
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(variant.sizes || []).map((size, sizeIndex) => (
                            <div key={`${variant.id}-size-${sizeIndex}`} className="grid gap-2 md:grid-cols-3">
                              <TextInput
                                placeholder="Size (S/M/L)"
                                value={size.size}
                                onChange={(event) =>
                                  updateSizeField(variant.id, sizeIndex, "size", event.target.value)
                                }
                              />
                              <TextInput
                                type="number"
                                placeholder="Price"
                                value={size.price}
                                onChange={(event) =>
                                  updateSizeField(
                                    variant.id,
                                    sizeIndex,
                                    "price",
                                    Number(event.target.value || 0)
                                  )
                                }
                              />
                              <TextInput
                                type="number"
                                placeholder="Stock"
                                value={size.stock}
                                onChange={(event) =>
                                  updateSizeField(
                                    variant.id,
                                    sizeIndex,
                                    "stock",
                                    Number(event.target.value || 0)
                                  )
                                }
                              />
                              <button
                                type="button"
                                onClick={() => removeSize(variant.id, sizeIndex)}
                                className="md:col-span-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-red-600"
                              >
                                Remove size
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
                    navigate("/admin/products");
                  }}
                  className="nm-btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
              <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
                <h3 className="text-lg font-semibold">Preview</h3>
                {product.variants?.[0]?.images?.[0] ? (
                  <img
                    src={product.variants[0].images[0]}
                    alt="Product preview"
                    className="mt-3 h-52 w-full rounded-2xl border border-[var(--nm-border)] object-cover"
                    onError={(event) => {
                      event.currentTarget.src = "/placeholder.png";
                    }}
                  />
                ) : (
                  <div className="mt-3 flex h-52 items-center justify-center rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-bg-elevated)] text-sm text-[var(--nm-muted)]">
                    No image
                  </div>
                )}
                <h4 className="mt-3 text-base font-semibold">{product.title || "Untitled"}</h4>
                <p className="text-sm text-[var(--nm-muted)]">{selectedCategoryName}</p>
              </section>
            </aside>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
