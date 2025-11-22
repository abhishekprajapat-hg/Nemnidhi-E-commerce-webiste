// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";

import { HeroSlider } from "../components/home/HeroSlider";
import ScrollingMarquee from "../components/home/ScrollingMarquee";
import CategoryGrid from "../components/home/CategoryGrid";
import ProductCarousel from "../components/home/ProductCarousel";
import TrustIconsSection from "../components/home/TrustIconsSection";
import NewsletterSection from "../components/home/NewsletterSection";
import TestimonialSection from "../components/home/TestimonialSection";
import Promo from "../components/home/Promo";

const DEFAULT_HERO_SLIDES = [
  {
    img: "/images/img-1.jpg",
    alt: "Beautiful Indian Sarees",
    title: "Whispers of Jade & Gold",
    subtitle:
      "A luxurious silk canvas, where vibrant green hues dance with opulent golden threads.",
    href: "/product/6918c0b7272e5abff761c00a",
  },
  {
    img: "/images/img-1.jpg",
    alt: "Designer Kurta Sets",
    title: "CONTEMPORARY KURTA SETS",
    subtitle: "Modern designs for every occasion.",
    href: "/products?category=Kurta",
  },
  {
    img: "/images/img-3.jpg",
    alt: "Stunning Lehengas",
    title: "THE BRIDAL COLLECTION",
    subtitle: "Find the perfect lehenga for your special day.",
    href: "/products?category=Lehenga",
  },
];

const DEFAULT_CATEGORIES = [
  {
    name: "Sarees",
    href: "/products?category=Saree",
    img: "/images/img-1.jpg",
  },
  {
    name: "Western",
    href: "/products?category=Western",
    img: "/images/img-2.jpg",
  },
  {
    name: "Tops",
    href: "/products?category=Tops",
    img: "/images/img-3.jpg",
  },
  {
    name: "Sweaters",
    href: "/products?category=Sweaters",
    img: "/images/img-1.jpg",
  },
  {
    name: "Jeans",
    href: "/products?category=Jeans",
    img: "/images/img-2.jpg",
  },
];

const FALLBACK_PROMO = {
  title: "Mid-Season Sale",
  subtitle: "Up to 30% off",
  buttonText: "Shop Now",
  href: "/sale",
  img: "/images/default-banner.jpg",
};

export default function Home() {
  const [homepageContent, setHomepageContent] = useState({
    heroSlides: DEFAULT_HERO_SLIDES,
    categories: DEFAULT_CATEGORIES,
    promo: null,
  });
  const [loadingHomepage, setLoadingHomepage] = useState(true);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const dispatch = useDispatch();

  // Normalize different response shapes into expected { heroSlides, categories, promo }
  const normalizeHomepage = (raw = {}) => {
    // raw might be: { heroSlides, categories, promo } OR { data: { ... } } OR { homepage: { ... } } etc.
    let maybe = raw;
    if (raw?.data) maybe = raw.data;
    if (raw?.homepage) maybe = raw.homepage;
    if (raw?.content) maybe = raw.content;

    // If the whole object seems like promo directly (e.g., admin returned only promo), handle it.
    const looksLikePromoOnly =
      (maybe && (maybe.title || maybe.img || maybe.buttonText)) && !maybe.heroSlides && !maybe.categories;

    return {
      heroSlides: Array.isArray(maybe?.heroSlides) && maybe.heroSlides.length ? maybe.heroSlides : DEFAULT_HERO_SLIDES,
      categories: Array.isArray(maybe?.categories) && maybe.categories.length ? maybe.categories : DEFAULT_CATEGORIES,
      promo: looksLikePromoOnly ? maybe : maybe?.promo ?? null,
    };
  };

  // Load homepage content (with live-update listeners)
  useEffect(() => {
    let mounted = true;

    const loadHomepageContent = async () => {
      if (mounted) setLoadingHomepage(true);
      try {
        const resp = await api.get("/api/content/homepage");
        console.log("homepage content response:", resp?.data);
        if (!mounted) return;

        const normalized = normalizeHomepage(resp?.data || {});
        setHomepageContent((prev) => ({
          heroSlides: normalized.heroSlides || prev.heroSlides,
          categories: normalized.categories || prev.categories,
          promo: typeof normalized.promo !== "undefined" ? normalized.promo : prev.promo,
        }));
      } catch (err) {
        console.warn("Could not load dynamic homepage content. Using defaults.", err);
      } finally {
        if (mounted) setLoadingHomepage(false);
      }
    };

    loadHomepageContent();

    const onHomepageUpdated = () => {
      loadHomepageContent();
    };
    const onStorage = (e) => {
      if (e.key === "homepage_last_updated_at") loadHomepageContent();
    };

    window.addEventListener("homepage:updated", onHomepageUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("homepage:updated", onHomepageUpdated);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Load new arrivals / products
  useEffect(() => {
    let mounted = true;
    async function loadNewArrivals() {
      if (mounted) setLoadingArrivals(true);
      try {
        const { data } = await api.get("/api/products?limit=8");
        const list = Array.isArray(data) ? data : data?.products || [];
        if (mounted) setNewArrivals(list);
      } catch (err) {
        console.error("Failed to load new arrivals", err);
        if (mounted) setNewArrivals([]);
      } finally {
        if (mounted) setLoadingArrivals(false);
      }
    }
    loadNewArrivals();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = (prod) => {
    if (!prod || !prod._id) return;

    const firstVariant =
      Array.isArray(prod.variants) && prod.variants.length ? prod.variants[0] : null;
    const chosenSize =
      firstVariant?.sizes && firstVariant.sizes.length ? firstVariant.sizes[0] : null;

    const imageFromVariant = firstVariant?.images?.length ? firstVariant.images[0] : null;
    const priceFromVariant = chosenSize
      ? Number(chosenSize.price || 0)
      : prod.price
      ? Number(prod.price)
      : 0;
    const stockFromVariant = chosenSize
      ? Number(chosenSize.stock || 0)
      : prod.countInStock || 0;

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
      {/* Hero */}
      <HeroSlider slides={homepageContent.heroSlides} loading={loadingHomepage} />

      {/* Scrolling marquee */}
      <ScrollingMarquee />

      {/* Categories */}
      {/* <CategoryGrid categories={homepageContent.categories} /> */}

      {/* New Arrivals / Product carousel */}
      <ProductCarousel
        title="New Arrivals"
        products={newArrivals}
        loading={loadingArrivals}
        onAddToCart={handleAddToCart}
      />
      <Promo promo={homepageContent.promo || FALLBACK_PROMO} />

      {/* Promo: use backend promo if present; otherwise fallback to a default promo */}

      {/* Other sections */}
      <TrustIconsSection />
      <NewsletterSection />
      <TestimonialSection />
    </div>
  );
}
