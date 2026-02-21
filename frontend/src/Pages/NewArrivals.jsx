import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { addToCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";
import { ProductCard, SkeletonProductCard } from "../components/home/ProductCard.jsx";

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
        const list = Array.isArray(data) ? data : data?.products || [];
        if (mounted) setProducts(list);
      } catch (error) {
        console.error("Failed to load new arrivals", error);
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

  const handleAddToCart = (product) => {
    if (!product?._id) return;

    const firstVariant =
      Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants[0]
        : null;
    const firstSize =
      Array.isArray(firstVariant?.sizes) && firstVariant.sizes.length > 0
        ? firstVariant.sizes[0]
        : null;

    const payload = {
      product: product._id,
      title: product.title || product.name,
      price: Number(firstSize?.price || product.price || 0),
      qty: 1,
      image: firstVariant?.images?.[0] || product.images?.[0] || product.image || "",
      size: firstSize?.size || "",
      color: firstVariant?.color || "",
      countInStock: Number(firstSize?.stock || product.countInStock || 0),
    };

    dispatch(addToCart(payload));
    showToast(`${payload.title} added to cart`);
  };

  return (
    <div className="nm-shell py-8 sm:py-10">
      <div className="mb-7">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
          Just In
        </p>
        <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">New Arrivals</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading &&
          Array.from({ length: 8 }).map((_, index) => (
            <SkeletonProductCard key={index} />
          ))}

        {!loading &&
          products.map((product) => (
            <ProductCard key={product._id} p={product} onAddToCart={handleAddToCart} />
          ))}
      </div>
    </div>
  );
}
