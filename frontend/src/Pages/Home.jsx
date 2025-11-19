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
    img: "/images/saree.jpg",
  },
  {
    name: "Western",
    href: "/products?category=Western",
    img: "/images/western.jpg",
  },
  {
    name: "Tops",
    href: "/products?category=Tops",
    img: "/images/tops.jpg",
  },
  {
    name: "Sweaters",
    href: "/products?category=Sweaters",
    img: "/images/sweaters.jpg",
  },
  {
    name: "Jeans",
    href: "/products?category=Jeans",
    img: "/images/jeans.jpg",
  },
];

export default function Home() {
  const [homepageContent, setHomepageContent] = useState({
    heroSlides: DEFAULT_HERO_SLIDES,
    categories: DEFAULT_CATEGORIES,
  });
  const [loadingHomepage, setLoadingHomepage] = useState(true);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadHomepageContent = async () => {
      try {
        const { data } = await api.get("/api/content/homepage");
        if (data && (data.heroSlides?.length || data.categories?.length))
          setHomepageContent(data);
      } catch (error) {
        console.warn(
          "Could not load dynamic homepage content. Using defaults.",
          error
        );
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
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = (prod) => {
    if (!prod || !prod._id) return;

    const firstVariant =
      Array.isArray(prod.variants) && prod.variants.length
        ? prod.variants[0]
        : null;
    const chosenSize =
      firstVariant?.sizes && firstVariant.sizes.length
        ? firstVariant.sizes[0]
        : null;

    const imageFromVariant = firstVariant?.images?.length
      ? firstVariant.images[0]
      : null;
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
      image:
        imageFromVariant || (prod.images && prod.images[0]) || prod.image || "",
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
      <ProductCarousel
        title="New Arrivals"
        products={newArrivals}
        loading={loadingArrivals}
        onAddToCart={handleAddToCart}
      />
      <TrustIconsSection />
      <NewsletterSection />
      <TestimonialSection />
    </div>
  );
}
