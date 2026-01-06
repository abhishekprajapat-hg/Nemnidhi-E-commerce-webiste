import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";

// 🔥 CORRECT PATH (HOME FOLDER)
import {
  ProductCard,
  SkeletonProductCard,
} from "../components/home/ProductCard.jsx";

export default function NewArrivals() {
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      try {
        const { data } = await api.get("/api/products?sort=-createdAt");

        const list = Array.isArray(data)
          ? data
          : data?.products || [];

        if (mounted) setProducts(list);
      } catch (err) {
        console.error("Failed to load new arrivals", err);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProducts();
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

  return (
    <div className="min-h-screen bg-[#fdf7f7] dark:bg-zinc-900 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          New Arrivals
        </h1>

        <div className="flex flex-wrap gap-6">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))}

          {!loading &&
            products.map((p) => (
              <ProductCard
                key={p._id}
                p={p}
                onAddToCart={handleAddToCart}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
