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

/* ================= DEFAULTS ================= */

const DEFAULT_HERO_SLIDES = [
  {
    img: "/images/img-1.jpg",
    alt: "Beautiful Indian Sarees",
    title: "Whispers of Jade & Gold",
    subtitle:
      "A luxurious silk canvas, where vibrant green hues dance with opulent golden threads.",
    href: "/product/6918c0b7272e5abff761c00a",
    cta: "View Product",
  },
];

const DEFAULT_CATEGORIES = [
  { title: "Sarees", slug: "sarees" },
  { title: "Western", slug: "western" },
  { title: "Tops", slug: "tops" },
  { title: "Sweaters", slug: "sweaters" },
  { title: "Jeans", slug: "jeans" },
];

const FALLBACK_PROMO = {
  title: "Mid-Season Sale",
  subtitle: "Up to 30% off",
  buttonText: "Shop Now",
  href: "/sale",
  img: "/images/default-banner.jpg",
};

/* ================= CACHE ================= */
let homepageCache = null;
let homepageCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export default function Home() {
  const dispatch = useDispatch();

  const [homepageContent, setHomepageContent] = useState({
    heroSlides: DEFAULT_HERO_SLIDES,
    categories: DEFAULT_CATEGORIES,
    promo: FALLBACK_PROMO,
  });

  const [loadingHomepage, setLoadingHomepage] = useState(true);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);

  /* ================= NORMALIZER ================= */
  const normalizeHomepage = (raw = {}) => {
    const heroSlides =
      Array.isArray(raw.heroSlides) && raw.heroSlides.length
        ? raw.heroSlides
        : DEFAULT_HERO_SLIDES;

    const categories =
      Array.isArray(raw.categories) && raw.categories.length
        ? raw.categories.map((c) =>
            typeof c === "string"
              ? { title: c, slug: c.toLowerCase() }
              : {
                  title: c.name || c.title || "",
                  slug: c.slug || c.name?.toLowerCase() || "",
                }
          )
        : DEFAULT_CATEGORIES;

    return {
      heroSlides,
      categories,
      promo: raw.promo || FALLBACK_PROMO,
    };
  };

  /* ================= LOAD HOMEPAGE (ONCE) ================= */
  useEffect(() => {
    let mounted = true;

    async function loadHomepage() {
      const now = Date.now();
      setLoadingHomepage(true);

      /* 1️⃣ MEMORY CACHE */
      if (homepageCache && now - homepageCacheTime < CACHE_TTL) {
        mounted && setHomepageContent(homepageCache);
        mounted && setLoadingHomepage(false);
        return;
      }

      /* 2️⃣ LOCAL STORAGE CACHE */
      const stored = localStorage.getItem("homepage_content");
      const storedTime = localStorage.getItem("homepage_content_time");

      if (stored && storedTime && now - Number(storedTime) < CACHE_TTL) {
        const parsed = JSON.parse(stored);
        homepageCache = parsed;
        homepageCacheTime = now;
        mounted && setHomepageContent(parsed);
        mounted && setLoadingHomepage(false);
        return;
      }

      /* 3️⃣ API CALL (ONLY IF NEEDED) */
      try {
        const res = await api.get("/api/content/homepage");
        if (!mounted) return;

        const normalized = normalizeHomepage(res.data || {});
        homepageCache = normalized;
        homepageCacheTime = now;

        localStorage.setItem(
          "homepage_content",
          JSON.stringify(normalized)
        );
        localStorage.setItem(
          "homepage_content_time",
          String(now)
        );

        setHomepageContent(normalized);
      } catch (err) {
        console.warn(
          "Could not load homepage content, using defaults",
          err
        );
      } finally {
        mounted && setLoadingHomepage(false);
      }
    }

    loadHomepage();
    return () => {
      mounted = false;
    };
  }, []);

  /* ================= LOAD NEW ARRIVALS ================= */
  useEffect(() => {
    let mounted = true;

    async function loadNewArrivals() {
      setLoadingArrivals(true);
      try {
        const { data } = await api.get("/api/products?limit=8");
        const list = Array.isArray(data)
          ? data
          : data?.products || [];
        mounted && setNewArrivals(list);
      } catch (err) {
        console.error("Failed to load new arrivals", err);
        mounted && setNewArrivals([]);
      } finally {
        mounted && setLoadingArrivals(false);
      }
    }

    loadNewArrivals();
    return () => {
      mounted = false;
    };
  }, []);

  /* ================= ADD TO CART ================= */
  const handleAddToCart = (prod) => {
    if (!prod || !prod._id) return;

    const firstVariant =
      Array.isArray(prod.variants) && prod.variants.length
        ? prod.variants[0]
        : null;

    const chosenSize =
      firstVariant?.sizes?.length ? firstVariant.sizes[0] : null;

    const payload = {
      product: prod._id,
      title: prod.title || prod.name,
      price: Number(chosenSize?.price || prod.price || 0),
      qty: 1,
      image:
        firstVariant?.images?.[0] ||
        prod.images?.[0] ||
        prod.image ||
        "",
      size: chosenSize?.size || "",
      color: firstVariant?.color || "",
      countInStock:
        Number(chosenSize?.stock || prod.countInStock || 0),
    };

    dispatch(addToCart(payload));
    showToast(`${payload.title} added to cart`);
  };

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen w-full bg-[#fdf7f7] dark:bg-zinc-900">
      {/* HERO */}
      <HeroSlider
        slides={homepageContent.heroSlides}
        categories={homepageContent.categories}
        loading={loadingHomepage}
      />

      {/* MARQUEE */}
      <ScrollingMarquee />

      {/* NEW ARRIVALS */}
      <ProductCarousel
        title="New Arrivals"
        products={newArrivals}
        loading={loadingArrivals}
        onAddToCart={handleAddToCart}
      />

      {/* PROMO */}
      <Promo promo={homepageContent.promo} />

      {/* TRUST + NEWSLETTER + TESTIMONIAL */}
      <TrustIconsSection />
      <NewsletterSection />
      <TestimonialSection />
    </div>
  );
}
