import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { showToast } from '../utils/toast';
import AdminLayout from '../components/AdminLayout';

// ⭐️ 1. Reusable UI components (Dark mode support added)
const Input = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="mt-1">
      <input
        id={id}
        name={id}
        {...props}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-2.5 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
      />
    </div>
  </div>
);

const Textarea = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="mt-1">
      <textarea
        id={id}
        name={id}
        {...props}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-2.5 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
      />
    </div>
  </div>
);

const Card = ({ children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">{children}</div>
);

const CardTitle = ({ children }) => (
  <h2 className="text-lg font-semibold mb-4 dark:text-white">{children}</h2>
);


export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    price: 0,
    sizes: [],
    colors: [],
    images: [],
    countInStock: 0,
  });
  const [availableCategories, setAvailableCategories] = useState([
    "Sarees", "Western", "Tops", "Sweaters", "Jeans"
  ]);

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    
    if (id) {
      api
        .get(`/api/products/${id}`)
        .then((res) => {
          if (!mounted) return;
          setProduct(res.data);
        })
        .catch((err) => {
          console.error(err);
          showToast('Failed to load product', 'error');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }

    api.get('/api/products/categories')
      .then(res => {
        if (!mounted || !res.data?.length) return;
        // Combine default and fetched categories, removing duplicates
        setAvailableCategories(cats => [...new Set([...cats, ...res.data])]);
      })
      .catch(err => {
        console.error("Failed to fetch categories", err);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  // Upload helper (No change in logic)
  const uploadFile = async (file) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/api/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.url || null;
    } catch (err) {
      console.warn('Upload failed, using local preview instead', err);
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }
  };

  const addImagesFromFiles = async (files) => {
    if (!files || files.length === 0) return;
    setSaving(true);
    try {
      const arr = Array.from(files);
      const uploaded = [];
      for (const f of arr) {
        const url = await uploadFile(f);
        if (url) uploaded.push(url);
      }
      setProduct((p) => ({ ...p, images: [...(p.images || []), ...uploaded] }));
    } catch (err) {
      console.error(err);
      showToast('Failed to add images', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onFileInputChange = (e) => {
    addImagesFromFiles(e.target.files);
    e.target.value = null;
  };

  // Drag/Drop handlers (No change in logic)
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) addImagesFromFiles(dt.files);
    if (dropRef.current) dropRef.current.classList.remove('ring-2', 'ring-indigo-500');
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.add('ring-2', 'ring-indigo-500');
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.remove('ring-2', 'ring-indigo-500');
  };

  const addImageUrl = () => {
    const url = prompt('Paste image URL');
    if (!url) return;
    setProduct((p) => ({ ...p, images: [...(p.images || []), url] }));
  };

  const removeImageAt = (idx) =>
    setProduct((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  const addNewCategory = () => {
    const newCategory = prompt("Enter new category name:");
    if (!newCategory || !newCategory.trim()) return;

    const trimmedCategory = newCategory.trim();
    // Check if category already exists (case-insensitive)
    if (availableCategories.some(c => c.toLowerCase() === trimmedCategory.toLowerCase())) {
      showToast("Category already exists", "info");
    } else {
      setAvailableCategories(cats => [...cats, trimmedCategory].sort());
    }
    setProduct(p => ({ ...p, category: trimmedCategory }));
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...product,
        price: Number(product.price),
        countInStock: Number(product.countInStock),
      };
      if (id) await api.put(`/api/products/${id}`, payload);
      else await api.post('/api/products/product', payload);
      showToast('Product saved successfully');
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      showToast('Save failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const previewImage = product.images && product.images.length ? product.images[0] : '';

  return (
    // ⭐️ 3. AdminLayout wrapper
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{id ? 'Edit product' : 'Create product'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage product information, images and inventory.</p>
          </div>
          <div className="text-right">
            <button
              onClick={() => navigate('/admin/products')}
              className="text-sm px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-600"
            >
              Back to products
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading product…</div>
        ) : (
          <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Form (spans 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardTitle>Basic information</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Title"
                    id="title"
                    value={product.title}
                    onChange={(e) => setProduct({ ...product, title: e.target.value })}
                  />
                  <Input
                    label="Slug"
                    id="slug"
                    value={product.slug}
                    onChange={(e) => setProduct({ ...product, slug: e.target.value })}
                  />
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                      </label>
                      <button type="button" onClick={addNewCategory} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                        + New
                      </button>
                    </div>
                    <div className="mt-1">
                      <select
                        id="category"
                        value={product.category}
                        onChange={(e) => setProduct({ ...product, category: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-2.5 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
                      >
                        <option value="">Select a category</option>
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Input
                    label="Price"
                    id="price"
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  />
                </div>
                <div className="mt-4">
                  <Textarea
                    label="Description"
                    id="description"
                    rows="5"
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  />
                </div>
              </Card>

              {/* Inventory & Options */}
              <Card>
                <CardTitle>Inventory & options</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Stock"
                    id="stock"
                    type="number"
                    value={product.countInStock}
                    onChange={(e) => setProduct({ ...product, countInStock: e.target.value })}
                  />
                  <Input
                    label="Sizes"
                    id="sizes"
                    value={(product.sizes || []).join(',')}
                    onChange={(e) => setProduct({ ...product, sizes: e.target.value.split(',').map((s) => s.trim()) })}
                    placeholder="S, M, L"
                  />
                  <Input
                    label="Colors"
                    id="colors"
                    value={(product.colors || []).join(',')}
                    onChange={(e) => setProduct({ ...product, colors: e.target.value.split(',').map((s) => s.trim()) })}
                    placeholder="red, blue"
                  />
                </div>
              </Card>

              {/* Image Upload */}
              <Card>
                <div className="flex items-center justify-between">
                  <CardTitle>Images</CardTitle>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-md text-sm font-medium dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                      Upload files
                    </button>
                    <button type="button" onClick={addImageUrl} className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-600">
                      Add URL
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  onChange={onFileInputChange}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {/* Dropzone */}
                <div
                  ref={dropRef}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-indigo-500 dark:bg-zinc-900/30 dark:border-zinc-700 dark:text-gray-400 dark:hover:border-indigo-400"
                >
                  <div className="text-center">
                    <div className="text-sm">Drag & drop images here, or click <button type="button" onClick={() => fileInputRef.current?.click()} className="text-indigo-600 font-medium underline">browse</button></div>
                    <div className="text-xs mt-1 text-gray-400 dark:text-gray-500">Upload multiple images at once</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {(product.images || []).length === 0 && (
                    <div className="col-span-3 text-sm text-gray-400 dark:text-gray-500">No images yet.</div>
                  )}

                  {(product.images || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-700">
                      <img src={url} alt={`preview-${idx}`} className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-start justify-end p-1.5">
                        <button
                          type="button"
                          onClick={() => removeImageAt(idx)}
                          aria-label={`Remove image ${idx}`}
                          className="bg-white/80 hover:bg-white rounded-full p-1 leading-none"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-md font-medium dark:bg-white dark:text-black dark:hover:bg-gray-200">
                  {saving ? 'Saving…' : 'Save product'}
                </button>
                <button type="button" onClick={() => navigate('/admin/products')} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700">
                  Cancel
                </button>
              </div>
            </div>

            {/* Right: Preview / Meta */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              <Card>
                <CardTitle>Preview</CardTitle>
                {previewImage ? (
                  <img src={previewImage} alt="preview" className="mx-auto h-48 w-auto object-cover rounded-md border" />
                ) : (
                  <div className="mx-auto h-48 w-full bg-gray-100 dark:bg-zinc-700 border rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400">No image</div>
                )}
                <h4 className="mt-3 font-semibold text-gray-800 dark:text-white text-center">{product.title || 'Untitled product'}</h4>
                <div className="text-lg font-medium text-gray-900 dark:text-white text-center mt-1">₹{Number(product.price || 0).toFixed(2)}</div>
              </Card>

              <Card>
                <CardTitle>Quick info</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <div>Category: <span className="font-medium text-gray-800 dark:text-white">{product.category || '—'}</span></div>
                  <div>Stock: <span className="font-medium text-gray-800 dark:text-white">{product.countInStock}</span></div>
                  <div>Sizes: <span className="font-medium text-gray-800 dark:text-white">{(product.sizes || []).join(', ') || '—'}</span></div>
                  <div>Colors: <span className="font-medium text-medium dark:text-white">{(product.colors || []).join(', ') || '—'}</span></div>
                </div>
              </Card>
            </aside>
          </form>
        )}
      </div>
    </AdminLayout> 
  );
}