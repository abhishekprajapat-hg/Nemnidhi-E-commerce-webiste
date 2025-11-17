import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { showToast } from '../utils/toast';
import AdminLayout from '../components/AdminLayout';

// UI components (copied / simplified)
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

const Card = ({ children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">{children}</div>
);

const CardTitle = ({ children }) => (
  <h2 className="text-lg font-semibold mb-4 dark:text-white">{children}</h2>
);

// Small constants
const EMPTY_SLIDE = { img: "", alt: "", title: "", subtitle: "", href: "" };
const EMPTY_CATEGORY = { name: "", href: "", img: "" };
const EMPTY_PROMO = { title: "", subtitle: "", buttonText: "", href: "", img: "" };

/**
 * ImageUploader
 * props:
 *  - value: current image URL (string)
 *  - onChange: (url|null) => void
 *  - label: text label
 *  - accept: mime string
 */
function ImageUploader({ value, onChange, label = 'Image', accept = 'image/*' }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Upload helper (same endpoint as server)
  const uploadFile = async (file) => {
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/api/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.url || null;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Upload failed';
      setError(msg);
      console.warn('Upload error', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = await uploadFile(file);

    // If upload failed, try to fallback to data URL so user can still preview
    if (!url) {
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

  const remove = () => {
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
        className={`w-full rounded-md border-2 border-dashed p-3 flex items-center gap-3 cursor-pointer ${dragging ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-gray-200'} bg-gray-50 dark:bg-zinc-900/30`}
      >
        <div className="w-28 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-700 flex-shrink-0">
          {value ? (
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">No image</div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">{value ? 'Change image or drop another' : 'Click or drop an image here'}</div>
            <div className="flex items-center gap-2">
              {loading && <div className="text-xs text-gray-500 dark:text-gray-400">Uploading…</div>}
              {value && (
                <button type="button" onClick={(e) => { e.stopPropagation(); remove(); }} className="text-xs px-2 py-1 bg-white border rounded text-red-600 dark:bg-red-900/40">
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">Supported: JPG / PNG / GIF. Max single file.</div>
          
        </div>
      </div>
    </div>
  );
}

export default function AdminHomepageEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    heroSlides: [],
    categories: [],
    promoBanner: { ...EMPTY_PROMO },
  });

  // Data fetch
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: homepageData } = await api.get('/api/content/homepage');
        if (homepageData) {
          setData({
            heroSlides: homepageData.heroSlides || [],
            categories: homepageData.categories || [],
            promoBanner: homepageData.promoBanner || { ...EMPTY_PROMO },
          });
        }
      } catch (err) {
        showToast("Failed to load homepage data. Using defaults.", "error");
        setData({
          heroSlides: [
            { ...EMPTY_SLIDE, img: "https://img.freepik.com/premium-photo/stack-folded-silk-sarees-vibrant-hues-created-with-generative-ai_419341-23285.jpg", title: "Elegance Woven", subtitle: "Discover our handloom sarees.", href: "/products?category=Saree" }
          ],
          categories: [
            { ...EMPTY_CATEGORY, name: "Banarasi Sarees", href: "/products?category=Banarasi", img: "https://images.unsplash.com/photo-1621612423739-b6b58675b47a?w=500&auto=format&fit=crop&q=60" },
            { ...EMPTY_CATEGORY, name: "Designer Lehengas", href: "/products?category=Lehenga", img: "https://images.unsplash.com/photo-1598141226207-e8036696a2b8?w=500&auto=format&fit=crop&q=60" },
          ],
          promoBanner: {
            ...EMPTY_PROMO,
            title: "Mid-Season Sale",
            subtitle: "Up to 30% off on selected items. Don't miss out!",
            buttonText: "Shop Sale",
            href: "/products?category=Sale",
            img: ""
          },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/content/homepage', data);
      showToast("Homepage content saved successfully!", "success");
    } catch (err) {
      showToast("Failed to save content: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSaving(false);
    }
  };

  // Hero handlers
  const handleHeroChange = (index, field, value) => {
    const newSlides = [...data.heroSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setData(prev => ({ ...prev, heroSlides: newSlides }));
  };
  const addHeroSlide = () => {
    setData(prev => ({ ...prev, heroSlides: [...prev.heroSlides, { ...EMPTY_SLIDE, id: Math.random() }] }));
  };
  const deleteHeroSlide = (index) => {
    if (window.confirm("Are you sure you want to delete this slide?")) {
      setData(prev => ({ ...prev, heroSlides: prev.heroSlides.filter((_, i) => i !== index) }));
    }
  };

  // Categories
  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...data.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setData(prev => ({ ...prev, categories: newCategories }));
  };
  const addCategory = () => {
    setData(prev => ({ ...prev, categories: [...prev.categories, { ...EMPTY_CATEGORY, id: Math.random() }] }));
  };
  const deleteCategory = (index) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      setData(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
    }
  };

  // Promo
  const handlePromoChange = (field, value) => {
    setData(prev => ({ ...prev, promoBanner: { ...prev.promoBanner, [field]: value } }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-zinc-700 w-48 rounded" />
            <div className="h-60 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
            <div className="h-60 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
            <div className="h-60 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Homepage Editor</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage content for your main homepage.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2.5 rounded-md font-medium transition ${saving ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"}`}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Hero Slides */}
          <Card>
            <CardTitle>Hero Carousel Slides</CardTitle>
            <div className="space-y-4">
              {(data.heroSlides || []).map((slide, index) => (
                <div key={slide.id || index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-lg dark:border-zinc-700">
                  <div className="md:col-span-2 flex items-center gap-4">
                    <div>
                      <ImageUploader
                        value={slide.img}
                        onChange={(url) => handleHeroChange(index, 'img', url)}
                        label="Slide Image"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3 grid grid-cols-1 gap-2">
                    <Input label="Title" id={`hero_title_${index}`} value={slide.title || ''} onChange={(e) => handleHeroChange(index, 'title', e.target.value)} placeholder="Elegance Woven" />
                    <Input label="Subtitle" id={`hero_sub_${index}`} value={slide.subtitle || ''} onChange={(e) => handleHeroChange(index, 'subtitle', e.target.value)} placeholder="Discover our collection..." />
                    <Input label="Link (href)" id={`hero_href_${index}`} value={slide.href || ''} onChange={(e) => handleHeroChange(index, 'href', e.target.value)} placeholder="/products?category=Saree" />
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteHeroSlide(index)}
                        className="px-3 py-2.5 bg-red-50 text-red-600 rounded-md h-11 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addHeroSlide} className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium dark:border-zinc-700 dark:text-gray-300">
                + Add New Slide
              </button>
            </div>
          </Card>

          {/* Category Grid */}
          <Card>
            <CardTitle>Category Grid</CardTitle>
            <div className="space-y-4">
              {(data.categories || []).map((cat, index) => (
                <div key={cat.id || index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg dark:border-zinc-700">
                  <div className="md:col-span-2 flex items-center gap-4">
                    <ImageUploader value={cat.img} onChange={(url) => handleCategoryChange(index, 'img', url)} label="Category Image" />
                  </div>

                  <Input label="Name" id={`cat_name_${index}`} value={cat.name || ''} onChange={(e) => handleCategoryChange(index, 'name', e.target.value)} placeholder="Banarasi Sarees" />
                  <div className="flex flex-col">
                    <Input label="Link (href)" id={`cat_href_${index}`} value={cat.href || ''} onChange={(e) => handleCategoryChange(index, 'href', e.target.value)} placeholder="/products?category=..." />
                    <div className="mt-2 self-end">
                      <button onClick={() => deleteCategory(index)} className="px-3 py-2.5 bg-red-50 text-red-600 rounded-md h-11 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addCategory} className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium dark:border-zinc-700 dark:text-gray-300">
                + Add New Category
              </button>
            </div>
          </Card>

          {/* Promo Banner */}
          <Card>
            <CardTitle>Promotional Banner</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Title" id="promo_title" value={data.promoBanner.title || ''} onChange={(e) => handlePromoChange('title', e.target.value)} placeholder="Mid-Season Sale" />
              <Input label="Subtitle" id="promo_subtitle" value={data.promoBanner.subtitle || ''} onChange={(e) => handlePromoChange('subtitle', e.target.value)} placeholder="Up to 30% off..." />
              <Input label="Button Text" id="promo_btn_text" value={data.promoBanner.buttonText || ''} onChange={(e) => handlePromoChange('buttonText', e.target.value)} placeholder="Shop Now" />
              <Input label="Button Link (href)" id="promo_href" value={data.promoBanner.href || ''} onChange={(e) => handlePromoChange('href', e.target.value)} placeholder="/sale" />
              <div className="md:col-span-2">
                <ImageUploader value={data.promoBanner.img} onChange={(url) => handlePromoChange('img', url)} label="Banner Image" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
