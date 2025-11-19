// src/pages/Home.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";
import { motion, AnimatePresence, useInView } from "framer-motion";

/* ---------- Small helper: Section with scroll fade-in ---------- */
function Section({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`py-16 md:py-24 ${className}`}
    >
      {children}
    </motion.section>
  );
}

/* ---------- Hero slides data (defaults) ---------- */
const DEFAULT_HERO_SLIDES = [
  {
    img: "src/assets/images/img-1.jpg",
    alt: "Beautiful Indian Sarees",
    title: "Whispers of Jade & Gold",
    subtitle: "A luxurious silk canvas, where vibrant green hues dance with opulent golden threads.",
    href: "/product/6918c0b7272e5abff761c00a",
  },
  {
    img: "src/assets/images/img-2.jpg",
    alt: "Designer Kurta Sets",
    title: "CONTEMPORARY KURTA SETS",
    subtitle: "Modern designs for every occasion.",
    href: "/products?category=Kurta",
  },
  {
    img: "src/assets/images/img-3.jpg",
    alt: "Stunning Lehengas",
    title: "THE BRIDAL COLLECTION",
    subtitle: "Find the perfect lehenga for your special day.",
    href: "/products?category=Lehenga",
  },
];

const DEFAULT_CATEGORIES = [
  { name: "Sarees", href: "/products?category=Saree", img: "src/assets/images/saree.jpg" },
  { name: "Western", href: "/products?category=Western", img: "src/assets/images/western.jpg" },
  { name: "Tops", href: "/products?category=Tops", img: "src/assets/images/tops.jpg" },
  { name: "Sweaters", href: "/products?category=Sweaters", img: "src/assets/images/sweaters.jpg" },
  { name: "Jeans", href: "/products?category=Jeans", img: "src/assets/images/jeans.jpg" },
];

/* ---------- HeroSlider component ---------- */
function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);

  // Auto-play
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearTimeout(t);
  }, [index, slides]);

  if (!slides || slides.length === 0) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Hero Section Not Configured</h2>
          <p className="text-gray-500 mt-2">Please add slides in the admin homepage editor.</p>
        </div>
      </div>
    );
  }

  const slide = slides[index];

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-stretch bg-[#fdf7f7] dark:bg-zinc-900 text-gray-900 dark:text-white overflow-hidden">
      {/* Left: content area */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center">
        <div className="max-w-2xl px-8 md:px-12 lg:px-16 py-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="bg-transparent"
            >
              {slide.eyebrow && (
                <div className="text-xs tracking-wider text-gray-600 dark:text-gray-300 mb-3">
                  {slide.eyebrow}
                </div>
              )}

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-black dark:text-white leading-tight">
                {slide.title}
              </h1>

              <p className="mt-6 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-lg">
                {slide.subtitle}
              </p>

              <div className="mt-10 flex items-center gap-6">
                <Link
                  to={slide.href}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-md border border-black/10 bg-black text-white dark:bg-white dark:text-black font-semibold text-sm md:text-base hover:scale-[1.02] transition-transform duration-200 shadow-sm"
                >
                  SHOP NOW
                </Link>

                <Link
                  to={slide.href}
                  className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium hover:underline"
                >
                  EXPLORE LOOKBOOK
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right: image area */}
      <div className="hidden lg:block w-1/2 relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={slide.img}
            alt={slide.alt}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect fill='%23f3f4f6' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%23999'%3EImage%20Not%20Found%3C/text%3E%3C/svg%3E";
            }}
          />
        </AnimatePresence>
      </div>

      {/* Mobile background image */}
      <div className="lg:hidden absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={`mobile-${index}`}
            src={slide.img}
            alt={slide.alt}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(.55)" }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect fill='%23f3f4f6' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%23999'%3EImage%20Not%20Found%3C/text%3E%3C/svg%3E";
            }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-black/0 lg:hidden" />
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all ${i === index ? "bg-white w-6 h-3" : "bg-white/60 w-3 h-3"}`}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------- Scrolling marquee trust bar ---------- */
function ScrollingMarquee() {
  return (
    <div className="py-4 bg-[#fdf7f7] text-black overflow-hidden dark:bg-zinc-800 dark:text-gray-200">
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: "-50%" }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap"
      >
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex space-x-12 px-6 text-sm font-semibold tracking-wider uppercase">
            <span>Authentic Handloom Guaranteed</span>
            <span className="text-gray-700 dark:text-gray-400">★</span>
            <span>Free Shipping Across India</span>
            <span className="text-gray-700 dark:text-gray-400">★</span>
            <span>International Shipping Available</span>
            <span className="text-gray-700 dark:text-gray-400">★</span>
            <span>Handcrafted by Artisans</span>
            <span className="text-gray-700 dark:text-gray-400">★</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------- Category Grid ---------- */
function CategoryGrid({ categories }) {
  return (
    <Section className="bg-[#fdf7f7] dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
          Shop by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={cat.href}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-2xl font-semibold text-white">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- ProductCard (uses variant images & lowest price) ---------- */
function ProductCard({ p, onAddToCart }) {
  // Flatten variant images (if any)
  const variantImages = Array.isArray(p?.variants)
    ? p.variants.flatMap((v) => (Array.isArray(v.images) ? v.images : []))
    : [];

  const slides =
    (variantImages && variantImages.length && variantImages) ||
    (p?.images && p.images.length && p.images) ||
    (p?.image && [p.image]) ||
    ["/placeholder.png"];

  // compute lowest price across all variants/sizes; fallback to p.price
  const pricesFromVariants = Array.isArray(p?.variants)
    ? p.variants.flatMap((v) => (Array.isArray(v.sizes) ? v.sizes.map((s) => Number(s.price || 0)) : []))
    : [];

  const displayPrice = pricesFromVariants.length ? Math.min(...pricesFromVariants) : Number(p?.price || 0);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [index, paused, slides.length]);

  return (
    <div className="w-72 shrink-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="group relative border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-800">
        <Link to={`/product/${p?._id}`} className="block aspect-[4/5] bg-gray-100 dark:bg-zinc-700 relative" aria-label={p?.title || p?.name || "Product"}>
          <AnimatePresence mode="wait">
            <motion.img
              key={index + (slides[index] || "")}
              src={slides[index]}
              alt={p?.title || p?.name || `Product image ${index + 1}`}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder.png";
              }}
            />
          </AnimatePresence>

          {slides.length > 1 && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-20 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(ev) => {
                    ev.preventDefault(); ev.stopPropagation(); setIndex(i);
                  }}
                  aria-label={`Go to image ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all ${i === index ? "bg-white w-4" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </Link>

        <div className="p-4 relative min-h-[90px]">
          <div className="transition-opacity duration-300 group-hover:opacity-0">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white truncate" title={p?.title || p?.name}>
              {p?.title || p?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">₹{Number(displayPrice || 0).toFixed(2)}</p>
          </div>

          <div className="absolute inset-0 p-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (typeof onAddToCart === "function") onAddToCart(p); }}
              className="w-full px-4 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonProductCard() {
  return (
    <div className="w-72 shrink-0">
      <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-800 shadow-sm animate-pulse">
        <div className="aspect-[4/5] bg-gray-200 dark:bg-zinc-700" />
        <div className="p-4">
          <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2 mt-2" />
        </div>
      </div>
    </div>
  );
}

function ProductCarousel({ title, products, loading, onAddToCart }) {
  return (
    <Section className="bg-[#fdf7f7] dark:bg-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">{title}</h2>
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="flex space-x-6">
              {[...Array(4)].map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          ) : !products.length ? (
            <p className="text-gray-500 dark:text-gray-400">No new arrivals found.</p>
          ) : (
            <div className="flex space-x-6 overflow-x-auto pb-6 -mb-6 scrollbar-hide">
              {products.map((p) => <ProductCard key={p._id} p={p} onAddToCart={onAddToCart} />)}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ---------- Trust icons ---------- */
const IconHandloom = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13.5M9.75 6.253v13.5M14.25 6.253v13.5M4.5 10.5h15M4.5 13.5h15M7.5 18.253v-2.5M16.5 18.253v-2.5M2.25 12l19.5 0" /></svg>
);
const IconSecure = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12 12 0 0012 21.697z" /></svg>
);
const IconShipping = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 0h17.25M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25v2.25a2.25 2.25 0 002.25 2.25z" /></svg>
);

function TrustIconsSection() {
  return (
    <Section className="bg-[#fdf7f7] dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="shrink-0 bg-gray-100 dark:bg-zinc-800 p-3 rounded-full text-indigo-600 dark:text-yellow-400">
              <IconHandloom />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Authentic Handloom</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Guaranteed genuine artisanal crafts sourced directly from weavers.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="shrink-0 bg-gray-100 dark:bg-zinc-800 p-3 rounded-full text-indigo-600 dark:text-yellow-400">
              <IconShipping />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Free Shipping</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enjoy free shipping on all orders over ₹2000 across India.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="shrink-0 bg-gray-100 dark:bg-zinc-800 p-3 rounded-full text-indigo-600 dark:text-yellow-400">
              <IconSecure />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Secure Payments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Shop with confidence using our secure Razorpay gateway.</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- Newsletter + Testimonials ---------- */
function NewsletterSection() {
  return (
    <Section className="bg-[#fdf7f7] dark:bg-black">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Stay in the Loop</h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Join our newsletter to receive updates on new arrivals, exclusive offers, and the stories behind our crafts.</p>
        <form className="mt-8 flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
          <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          <button type="submit" className="px-8 py-3 rounded-md bg-black text-white font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors shadow-lg">Subscribe</button>
        </form>
      </div>
    </Section>
  );
}

function TestimonialSection() {
  const testimonials = [
    { name: "Priya S.", quote: "The quality of the silk is amazing! The color is so vibrant and exactly as shown on the website." },
    { name: "Rohan M.", quote: "Wore this lehenga to a wedding and got so many compliments. Fast shipping and perfect fit!" },
    { name: "Anjali K.", quote: "The handwork on my kurta set is so intricate. You can tell it's made with care. Worth every penny." },
  ];

  return (
    <Section className="bg-[#fdf7f7] dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-12">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <p className="text-gray-700 dark:text-gray-300">"{t.quote}"</p>
              <p className="mt-4 font-semibold text-gray-900 dark:text-white">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- Main Home component ---------- */
export default function Home() {
  const [homepageContent, setHomepageContent] = useState({
    heroSlides: DEFAULT_HERO_SLIDES,
    categories: DEFAULT_CATEGORIES,
  });
  const [loadingHomepage, setLoadingHomepage] = useState(true);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const dispatch = useDispatch();

  // Fetch dynamic homepage content
  useEffect(() => {
    const loadHomepageContent = async () => {
      try {
        const { data } = await api.get('/api/content/homepage');
        if (data && (data.heroSlides?.length || data.categories?.length)) {
          setHomepageContent(data);
        }
      } catch (error) {
        console.warn("Could not load dynamic homepage content. Using defaults.");
      } finally {
        setLoadingHomepage(false);
      }
    };
    loadHomepageContent();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadNewArrivals() {
      setLoadingArrivals(true);
      try {
        const { data } = await api.get("/api/products?limit=8");
        const list = Array.isArray(data) ? data : data.products || [];
        if (mounted) setNewArrivals(list);
      } catch (err) {
        console.error("Failed to load new arrivals", err);
        if (mounted) setNewArrivals([]);
      } finally {
        if (mounted) setLoadingArrivals(false);
      }
    }
    loadNewArrivals();
    return () => { mounted = false; };
  }, []);

  // Add to cart — prefers first variant & first size if available
  const handleAddToCart = (prod) => {
    if (!prod || !prod._id) return;

    const firstVariant = Array.isArray(prod.variants) && prod.variants.length ? prod.variants[0] : null;
    const chosenSize = firstVariant?.sizes && firstVariant.sizes.length ? firstVariant.sizes[0] : null;

    const imageFromVariant = firstVariant?.images?.length ? firstVariant.images[0] : null;
    const priceFromVariant = chosenSize ? Number(chosenSize.price || 0) : (prod.price ? Number(prod.price) : 0);
    const stockFromVariant = chosenSize ? Number(chosenSize.stock || 0) : (prod.countInStock || 0);

    const payload = {
      product: prod._id,
      title: prod.title || prod.name,
      price: priceFromVariant,
      qty: 1,
      image: imageFromVariant || (prod.images && prod.images[0]) || prod.image || "",
      size: chosenSize?.size || "",
      color: firstVariant?.color || "",
      countInStock: stockFromVariant,
    };

    dispatch(addToCart(payload));
    showToast(`${payload.title} added to cart`);
  };

  return (
    <div className="min-h-screen w-full bg-[#fdf7f7] dark:bg-zinc-900">
      <HeroSlider slides={homepageContent.heroSlides} />
      <ScrollingMarquee />
      <CategoryGrid categories={homepageContent.categories} />
      <ProductCarousel title="New Arrivals" products={newArrivals} loading={loadingArrivals} onAddToCart={handleAddToCart} />
      <TrustIconsSection />
      <NewsletterSection />
      <TestimonialSection />
    </div>
  );
}
