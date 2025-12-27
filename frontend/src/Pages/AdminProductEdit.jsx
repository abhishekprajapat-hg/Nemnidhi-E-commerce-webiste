// src/pages/AdminProductEdit.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { showToast } from "../utils/toast";
import AdminLayout from "../components/admin/AdminLayout";

/* --------------------------
   Small UI pieces
   -------------------------- */
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <input
      {...props}
      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-4 py-2.5 
        dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100 focus:ring-indigo-500 
        focus:border-indigo-500"
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <textarea
      {...props}
      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-4 py-2.5 
        dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100 focus:ring-indigo-500 
        focus:border-indigo-500"
    />
  </div>
);

const Card = ({ children }) => (
  <div
    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm 
  dark:bg-zinc-800 dark:border-zinc-700"
  >
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h2 className="text-lg font-semibold mb-4 dark:text-white">{children}</h2>
);

/* --------------------------
   Helpers
   -------------------------- */
const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* --------------------------
   AdminProductEdit component
   -------------------------- */
export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!!id);
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
  // fileInputsRef keyed by variantId
  const fileInputsRef = useRef({}); // { [variantId]: inputElement }

  // lifecycle
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
      // cleanup appended inputs
      Object.values(fileInputsRef.current).forEach((el) => {
        try {
          el.remove();
        } catch (e) {}
      });
      fileInputsRef.current = {};
    };
  }, []);

  // Load initial product (if editing) + categories
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      // load categories (non-blocking)
      api
        .get("/api/content/homepage")
        .then((res) => {
          if (cancelled) return;

          const homepageCats = Array.isArray(res.data?.categories)
            ? res.data.categories
                .filter((c) => c && c.slug && c.name)
                .map((c) => ({
                  name: c.name, // UI
                  slug: c.slug, // FILTER VALUE
                }))
            : [];

          setAvailableCategories(homepageCats);
        })
        .catch(() => {});

      if (!id) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (controllerRef.current) {
        try {
          controllerRef.current.abort();
        } catch (e) {}
      }
      controllerRef.current = new AbortController();

      try {
        const res = await api.get(`/api/products/${id}`, {
          signal: controllerRef.current.signal,
        });
        if (cancelled) return;
        const data = res.data || {};

        // ensure variants have stable ids
        const variants = (
          Array.isArray(data.variants) ? data.variants : []
        ).map((v) => ({
          id: v.id || genId(),
          color: v.color || "",
          images: Array.isArray(v.images) ? v.images : [],
          sizes: Array.isArray(v.sizes)
            ? v.sizes.map((s) => ({
                size: s.size || "",
                price: Number(s.price || 0),
                stock: Number(s.stock || 0),
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

        // since this is loaded data, reset dirty flag
        setDirty(false);
      } catch (err) {
        if (err?.name === "AbortError" || err?.name === "CanceledError") return;
        showToast("Failed to load product", "error");
      } finally {
        if (!cancelled) setLoading(false);
        controllerRef.current = null;
      }
    };

    load();

    return () => {
      cancelled = true;
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [id]);

  // mark dirty when product changes (but not on initial load caused by setProduct above because we reset dirty there)
  useEffect(() => {
    setDirty(true);
  }, [
    product.title,
    product.slug,
    product.description,
    product.category,
    product.variants,
  ]);

  // immutable update helper (functional updates)
  const updateProduct = useCallback((updater) => {
    setProduct((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  }, []);

  /* --------------------------
     Variant/size manipulation (using variant.id)
     -------------------------- */
  const addVariant = useCallback(() => {
    const newV = { id: genId(), color: "", images: [], sizes: [] };
    updateProduct((p) => ({ ...p, variants: [...(p.variants || []), newV] }));
  }, [updateProduct]);

  const removeVariant = useCallback(
    (variantId) => {
      updateProduct((p) => ({
        ...p,
        variants: (p.variants || []).filter((v) => v.id !== variantId),
      }));
      // cleanup file input if any
      const inp = fileInputsRef.current[variantId];
      if (inp) {
        try {
          inp.remove();
        } catch (e) {}
        delete fileInputsRef.current[variantId];
      }
    },
    [updateProduct]
  );

  const updateVariantField = useCallback(
    (variantId, field, value) => {
      updateProduct((p) => {
        const variants = (p.variants || []).map((vv) =>
          vv.id === variantId ? { ...vv, [field]: value } : vv
        );
        return { ...p, variants };
      });
    },
    [updateProduct]
  );

  const addSize = useCallback(
    (variantId) => {
      updateProduct((p) => {
        const variants = (p.variants || []).map((vv) => {
          if (vv.id !== variantId) return vv;
          const sizes = Array.isArray(vv.sizes)
            ? [...vv.sizes, { size: "", price: 0, stock: 0 }]
            : [{ size: "", price: 0, stock: 0 }];
          return { ...vv, sizes };
        });
        return { ...p, variants };
      });
    },
    [updateProduct]
  );

  const removeSize = useCallback(
    (variantId, sIndex) => {
      updateProduct((p) => {
        const variants = (p.variants || []).map((vv) => {
          if (vv.id !== variantId) return vv;
          return {
            ...vv,
            sizes: (vv.sizes || []).filter((_, x) => x !== sIndex),
          };
        });
        return { ...p, variants };
      });
    },
    [updateProduct]
  );

  const updateSizeField = useCallback(
    (variantId, sIndex, field, value) => {
      updateProduct((p) => {
        const variants = (p.variants || []).map((vv) => {
          if (vv.id !== variantId) return vv;
          const sizes = (vv.sizes || []).map((s, j) =>
            j === sIndex ? { ...s, [field]: value } : s
          );
          return { ...vv, sizes };
        });
        return { ...p, variants };
      });
    },
    [updateProduct]
  );

  /* --------------------------
     Upload helper (frontend)
     -------------------------- */
  const uploadFile = useCallback(async (file) => {
    // Try multipart endpoints first, then fallback to dataURI
    const tryUpload = async (url) => {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await api.post(url, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // expect res.data.url
        return res.data?.url || null;
      } catch (e) {
        return null;
      }
    };

    const endpoints = ["/api/upload/image", "/api/upload"];
    for (const ep of endpoints) {
      const r = await tryUpload(ep);
      if (r) return r;
    }

    // fallback to base64 data URI
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev?.target?.result || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  // Handles files chosen for a specific variantId
  const onFilesSelected = useCallback(
    async (variantId, files) => {
      if (!files || files.length === 0) return;
      const urls = [];
      for (const f of Array.from(files)) {
        const url = await uploadFile(f);
        if (url) urls.push(url);
      }
      if (urls.length) {
        // use functional update to avoid stale state
        updateProduct((p) => {
          const variants = (p.variants || []).map((vv) => {
            if (vv.id !== variantId) return vv;
            const existing = Array.isArray(vv.images) ? vv.images : [];
            return { ...vv, images: [...existing, ...urls] };
          });
          return { ...p, variants };
        });
      }
      // reset input element if present
      const input = fileInputsRef.current[variantId];
      if (input) {
        try {
          input.value = "";
        } catch (e) {
          /* ignore */
        }
      }
    },
    [uploadFile, updateProduct]
  );

  /* --------------------------
     Save (create/update) with sanitization
     -------------------------- */
  const save = useCallback(
    async (e) => {
      if (e && typeof e.preventDefault === "function") e.preventDefault();

      // Basic validation
      if (!product.title || !product.slug) {
        showToast("Title and slug are required", "error");
        return;
      }

      setSaving(true);
      try {
        // sanitize variants (remove internal ids before sending)
        const safeVariants = (product.variants || []).map((v) => ({
          color: String(v.color || "").trim(),
          images: Array.isArray(v.images) ? v.images.filter(Boolean) : [],
          sizes: (Array.isArray(v.sizes) ? v.sizes : []).map((s) => ({
            size: String(s.size || "").trim(),
            price: Number(s.price || 0),
            stock: Number(s.stock || 0),
          })),
        }));

        const payload = {
          title: String(product.title || "").trim(),
          slug: String(product.slug || "").trim(),
          description: String(product.description || ""),
          category: String(product.category || ""),
          variants: safeVariants,
        };

        if (id) {
          await api.put(`/api/products/${id}`, payload);
        } else {
          await api.post("/api/products", payload);
        }

        setDirty(false);
        showToast("Product saved successfully");
        navigate("/admin/products");
      } catch (err) {
        showToast(
          "Save failed: " + (err.response?.data?.message || err.message),
          "error"
        );
      } finally {
        setSaving(false);
      }
    },
    [product, id, navigate]
  );

  // Confirm on unload if unsaved
  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const categoryOptions = useMemo(
    () => availableCategories.filter(Boolean),
    [availableCategories]
  );

  const selectedCategoryName = useMemo(() => {
    const c = availableCategories.find((x) => x.slug === product.category);
    return c?.name || product.category || "No category";
  }, [availableCategories, product.category]);

  /* --------------------------
     Render
     -------------------------- */
  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold dark:text-white">
              {id ? "Edit Product" : "Create Product"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage product information, variants, images & inventory.
            </p>
          </div>

          <button
            onClick={() => {
              if (
                dirty &&
                !window.confirm("You have unsaved changes. Leave anyway?")
              )
                return;
              navigate("/admin/products");
            }}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 dark:bg-zinc-700 dark:text-gray-300 dark:border-zinc-600"
          >
            Back
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            Loading…
          </div>
        ) : (
          <form
            onSubmit={save}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardTitle>Basic Information</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Title"
                    value={product.title}
                    onChange={(e) => updateProduct({ title: e.target.value })}
                  />
                  <Input
                    label="Slug"
                    value={product.slug}
                    onChange={(e) => updateProduct({ slug: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <select
                      value={product.category}
                      onChange={(e) =>
                        updateProduct({ category: e.target.value })
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md px-4 py-2.5 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <Textarea
                    label="Description"
                    rows="5"
                    value={product.description}
                    onChange={(e) =>
                      updateProduct({ description: e.target.value })
                    }
                  />
                </div>
              </Card>

              <Card>
                <CardTitle>Product Variants</CardTitle>

                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-3 py-2 bg-black text-white rounded-md text-sm dark:bg-white dark:text-black"
                  >
                    + Add Variant
                  </button>
                </div>

                {product.variants.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No variants added yet.
                  </p>
                )}

                {product.variants.map((variant, vIndex) => (
                  <div
                    key={variant.id}
                    className="border p-4 rounded-lg mb-4 bg-gray-50 dark:bg-zinc-700/50 dark:border-zinc-600"
                  >
                    <div className="flex justify-between mb-3">
                      <h3 className="font-semibold dark:text-white">
                        Variant {vIndex + 1}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="text-red-500 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <Input
                      label="Color"
                      value={variant.color}
                      onChange={(e) =>
                        updateVariantField(variant.id, "color", e.target.value)
                      }
                    />

                    <div className="mt-3">
                      <label className="text-sm font-medium dark:text-gray-300">
                        Images
                      </label>
                      <div className="flex gap-2 mt-2 items-center">
                        <button
                          type="button"
                          onClick={() => {
                            // create a hidden file input for this variant if not exists
                            if (!fileInputsRef.current[variant.id]) {
                              const inp = document.createElement("input");
                              inp.type = "file";
                              inp.accept = "image/*";
                              inp.multiple = true;
                              inp.style.display = "none";
                              inp.addEventListener("change", (e) =>
                                onFilesSelected(variant.id, e.target.files)
                              );
                              document.body.appendChild(inp);
                              fileInputsRef.current[variant.id] = inp;
                            }
                            fileInputsRef.current[variant.id].click();
                          }}
                          className="px-3 py-2 bg-black text-white rounded-md text-sm dark:bg-white dark:text-black"
                        >
                          Upload
                        </button>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          You can upload multiple images
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {(variant.images || []).map((img, i) => (
                          <div
                            key={i}
                            className="relative rounded overflow-hidden border"
                          >
                            <img
                              src={img}
                              loading="lazy"
                              className="w-full h-20 object-cover"
                              alt={`variant-${vIndex}-img-${i}`}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/placeholder.png";
                              }}
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-white text-xs px-1 rounded"
                              onClick={() =>
                                updateVariantField(
                                  variant.id,
                                  "images",
                                  (variant.images || []).filter(
                                    (_, x) => x !== i
                                  )
                                )
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="text-sm font-medium dark:text-gray-300">
                        Sizes
                      </label>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => addSize(variant.id)}
                          className="ml-3 px-2 py-1 bg-gray-800 text-white rounded text-xs dark:bg-white dark:text-black"
                        >
                          + Add Size
                        </button>
                      </div>

                      {(variant.sizes || []).map((s, sIndex) => (
                        <div
                          key={sIndex}
                          className="grid grid-cols-3 gap-3 mt-3 items-center"
                        >
                          <input
                            placeholder="Size (S/M/L)"
                            value={s.size}
                            onChange={(e) =>
                              updateSizeField(
                                variant.id,
                                sIndex,
                                "size",
                                e.target.value
                              )
                            }
                            className="border p-2 rounded dark:bg-zinc-800 dark:border-zinc-600"
                          />
                          <input
                            placeholder="Price (₹)"
                            type="number"
                            value={s.price}
                            onChange={(e) =>
                              updateSizeField(
                                variant.id,
                                sIndex,
                                "price",
                                Number(e.target.value || 0)
                              )
                            }
                            className="border p-2 rounded dark:bg-zinc-800 dark:border-zinc-600"
                          />
                          <input
                            placeholder="Stock (Qty)"
                            type="number"
                            value={s.stock}
                            onChange={(e) =>
                              updateSizeField(
                                variant.id,
                                sIndex,
                                "stock",
                                Number(e.target.value || 0)
                              )
                            }
                            className="border p-2 rounded dark:bg-zinc-800 dark:border-zinc-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeSize(variant.id, sIndex)}
                            className="text-red-500 text-xs col-span-3 text-left mt-1"
                          >
                            Remove size
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </Card>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-black text-white rounded-md font-medium dark:bg-white dark:text-black"
                >
                  {saving ? "Saving…" : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      dirty &&
                      !window.confirm("You have unsaved changes. Leave anyway?")
                    )
                      return;
                    navigate("/admin/products");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:border-zinc-700 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <Card>
                <CardTitle>Preview</CardTitle>
                {product.variants?.[0]?.images?.[0] ? (
                  <img
                    src={product.variants[0].images[0]}
                    loading="lazy"
                    className="mx-auto h-48 object-cover rounded-md border"
                    alt="preview"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />
                ) : (
                  <div className="h-48 bg-gray-100 dark:bg-zinc-700 rounded flex items-center justify-center text-gray-500">
                    No image
                  </div>
                )}
                <h3 className="mt-3 font-semibold text-center dark:text-white">
                  {product.title || "Untitled"}
                </h3>
                <p className="text-sm text-gray-500 text-center dark:text-gray-300">
                  {selectedCategoryName}
                </p>
              </Card>
            </aside>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
