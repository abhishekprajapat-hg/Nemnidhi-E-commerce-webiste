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
import { Link } from "react-router-dom";
import CategoryShowcase from "../components/home/CategoryShowcase";

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
  { title: "Sarees", slug: "sarees", img: "/images/img-1.jpg", description: "Traditional to contemporary drapes." },
  { title: "Western", slug: "western", img: "/images/img-4.jpg", description: "Modern silhouettes for every outing." },
  { title: "Tops", slug: "tops", img: "/images/img-3.jpg", description: "Smart layers and everyday staples." },
  { title: "Lehengas", slug: "lehengas", img: "/images/img-2.jpg", description: "Festive looks with statement craft." },
  { title: "Kurtas", slug: "kurtas", img: "/images/img-1.jpg", description: "Elevated comfort for all-day wear." },
  { title: "Accessories", slug: "accessories", img: "/images/img-4.jpg", description: "Finishing touches to complete styling." },
];

const FALLBACK_PROMO = {
  title: "Festive spotlight now live",
  subtitle: "New handcrafted edits with limited quantities, ready to ship this week.",
  buttonText: "Shop The Edit",
  href: "/products",
  img: "/images/img-4.jpg",
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
  const toSlug = (value = "") =>
    String(value)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const normalizeHomepage = (raw = {}) => {
    const heroSlides =
      Array.isArray(raw.heroSlides) && raw.heroSlides.length
        ? raw.heroSlides
        : DEFAULT_HERO_SLIDES;

    const categories =
      Array.isArray(raw.categories) && raw.categories.length
        ? raw.categories
            .map((category, index) => {
              if (typeof category === "string") {
                const title = category.trim();
                const slug = toSlug(title);
                if (!title || !slug) return null;
                return {
                  title,
                  slug,
                  img: DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length].img,
                  description: "Curated picks selected for your wardrobe.",
                  href: `/products?category=${encodeURIComponent(slug)}`,
                };
              }

              const title = String(category?.name || category?.title || "").trim();
              const slug = String(category?.slug || toSlug(title)).trim();
              if (!title || !slug) return null;
              return {
                title,
                slug,
                img:
                  category?.img ||
                  category?.image ||
                  DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length].img,
                description: String(category?.description || category?.subtitle || "").trim(),
                href: String(category?.href || `/products?category=${encodeURIComponent(slug)}`),
              };
            })
            .filter(Boolean)
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

        localStorage.setItem("homepage_content", JSON.stringify(normalized));
        localStorage.setItem("homepage_content_time", String(now));

        setHomepageContent(normalized);
      } catch (err) {
        console.warn("Could not load homepage content, using defaults", err);
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
        const list = Array.isArray(data) ? data : data?.products || [];
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

    const chosenSize = firstVariant?.sizes?.length
      ? firstVariant.sizes[0]
      : null;

    const payload = {
      product: prod._id,
      title: prod.title || prod.name,
      price: Number(chosenSize?.price || prod.price || 0),
      qty: 1,
      image: firstVariant?.images?.[0] || prod.images?.[0] || prod.image || "",
      size: chosenSize?.size || "",
      color: firstVariant?.color || "",
      countInStock: Number(chosenSize?.stock || prod.countInStock || 0),
    };

    dispatch(addToCart(payload));
    showToast(`${payload.title} added to cart`);
  };

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen pb-10 sm:pb-14">
      <HeroSlider
        slides={homepageContent.heroSlides}
        categories={homepageContent.categories}
        loading={loadingHomepage}
      />

      <ScrollingMarquee />
      <CategoryShowcase categories={homepageContent.categories} />

      <ProductCarousel
        title={
          <Link to="/new-arrivals" className="hover:underline">
            New Arrivals
          </Link>
        }
        subtitle="Freshly added products picked for this week."
        viewAllTo="/new-arrivals"
        products={newArrivals}
        loading={loadingArrivals}
        onAddToCart={handleAddToCart}
      />

      <Promo promo={homepageContent.promo} />
      <TrustIconsSection />
      <TestimonialSection />
      <NewsletterSection />
    </div>
  );
}
