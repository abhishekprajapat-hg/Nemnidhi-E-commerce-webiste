// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";

import { HeroSlider } from "../components/home/HeroSlider";
import ScrollingMarquee from "../components/home/ScrollingMarquee";
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
    href: "/products?category=kurta",
  },
  {
    img: "/images/img-3.jpg",
    alt: "Stunning Lehengas",
    title: "THE BRIDAL COLLECTION",
    subtitle: "Find the perfect lehenga for your special day.",
    href: "/products?category=lehenga",
  },
];

const DEFAULT_CATEGORIES = [
  {
    name: "Sarees",
    href: "/products?category=sarees",
    img: "/images/img-1.jpg",
  },
  {
    name: "Western",
    href: "/products?category=western",
    img: "/images/img-2.jpg",
  },
  {
    name: "Tops",
    href: "/products?category=tops",
    img: "/images/img-3.jpg",
  },
  {
    name: "Sweaters",
    href: "/products?category=sweaters",
    img: "/images/img-1.jpg",
  },
  {
    name: "Jeans",
    href: "/products?category=jeans",
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
    let maybe = raw;
    if (raw?.data) maybe = raw.data;
    if (raw?.homepage) maybe = raw.homepage;
    if (raw?.content) maybe = raw.content;

    const looksLikePromoOnly =
      (maybe && (maybe.title || maybe.img || maybe.buttonText)) && !maybe.heroSlides && !maybe.categories;

    // normalize categories coming from backend if any: ensure href uses lowercase category query
    const normalizedCats = Array.isArray(maybe?.categories) && maybe.categories.length
      ? maybe.categories.map((c) => {
          // c can be string or object
          if (typeof c === "string") {
            const name = c;
            return { name, href: `/products?category=${String(name).toLowerCase()}`, img: "/images/img-1.jpg" };
          }
          const name = c.name || c.title || "";
          // If backend already gives href, keep it but normalize query param (if possible)
          const href = c.href || `/products?category=${String(name).toLowerCase()}`;
          return { name, href, img: c.img || c.image || "/images/img-1.jpg" };
        })
      : DEFAULT_CATEGORIES;

    return {
      heroSlides: Array.isArray(maybe?.heroSlides) && maybe.heroSlides.length ? maybe.heroSlides : DEFAULT_HERO_SLIDES,
      categories: normalizedCats,
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

      {/* New Arrivals / Product carousel */}
      <ProductCarousel
        title="New Arrivals"
        products={newArrivals}
        loading={loadingArrivals}
        onAddToCart={handleAddToCart}
      />
      <Promo promo={homepageContent.promo || FALLBACK_PROMO} />

      {/* Other sections */}
      <TrustIconsSection />
      <NewsletterSection />
      <TestimonialSection />
    </div>
  );
}
