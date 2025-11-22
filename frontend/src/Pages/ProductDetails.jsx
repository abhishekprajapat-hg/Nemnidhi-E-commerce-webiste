// src/pages/ProductDetails.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { addToCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";

import ReviewForm from "../components/ReviewForm";
import { useTheme } from "../context/ThemeContext";

// Components (split)
import Gallery from "../components/product/Gallery";
import RelatedProducts from "../components/product/RelatedProducts";
import Breadcrumb from "../components/product/Breadcrumb";
import ProductInfoPanel from "../components/product/ProductInfoPanel";
import ReviewSection from "../components/product/ReviewSection";

// Helpers
import {
  deriveImagesFromProduct,
  derivePriceFromProduct,
  deriveStockFromProduct,
} from "../utils/productHelpers";

// Local placeholder (uploaded file path)
const PLACEHOLDER = "/mnt/data/acb9da27-2225-45bd-8890-d39621053a9e.png";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const mountedRef = useRef(true);

  // Swiper refs (kept local)
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [mainSwiper, setMainSwiper] = useState(null);

  // Core data
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Variant & selection state
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // UI interaction state
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [isWished, setIsWished] = useState(false);

  // Related & reviews
  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Cart items (for itemInCart calculation)
  const cartItems = useSelector((s) => s.cart.items);

  // Memoized flag for navigation controls (avoid recalculating on each render)
  const canShowNavigation = useMemo(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
    []
  );

  // Derived images (no separate images state — compute from product + variant)
  const derivedImages = useMemo(() => {
    if (!product) return [PLACEHOLDER];
    return deriveImagesFromProduct(product, selectedVariantIndex);
  }, [product, selectedVariantIndex]);

  // Derived price & stock
  const currentPrice = useMemo(
    () => derivePriceFromProduct(product || {}, selectedVariantIndex, selectedSize),
    [product, selectedVariantIndex, selectedSize]
  );
  const currentStock = useMemo(
    () => deriveStockFromProduct(product || {}, selectedVariantIndex, selectedSize),
    [product, selectedVariantIndex, selectedSize]
  );
  const inStock = useMemo(() => Number(currentStock || 0) > 0, [currentStock]);

  // itemInCart memoized
  const itemInCart = useMemo(() => {
    if (!cartItems || !product) return undefined;
    return cartItems.find(
      (item) =>
        item.product === id &&
        (!selectedSize || item.size === selectedSize) &&
        (!selectedColor || item.color === selectedColor)
    );
  }, [cartItems, id, selectedSize, selectedColor, product]);

  /* -------------------------
     Fetch product (single source of truth)
     - Fetch product
     - After product loads, concurrently fetch related & reviews
     - Abort & ignore if unmounted
  ------------------------- */
  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();

    const fetchProductAndExtras = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/products/${id}`, { signal: ac.signal });
        if (!mountedRef.current) return;
        setProduct(data);

        // Initialize variant selections deterministically
        if (data?.variants?.length > 0) {
          setSelectedVariantIndex(0);
          const firstVariant = data.variants[0];
          setSelectedColor(firstVariant.color || "");
          const firstSize = firstVariant.sizes && firstVariant.sizes.length > 0 ? firstVariant.sizes[0].size : "";
          setSelectedSize(firstSize || "");
        } else {
          setSelectedVariantIndex(-1);
          setSelectedColor((data?.colors && data.colors[0]) || "");
          setSelectedSize((data?.sizes && data.sizes[0]) || "");
        }

        // reset UI state
        setActive(0);
        setQty(1);

        // parallel fetch related & reviews (if applicable)
        const tasks = [];

        if (data?.category) {
          setLoadingRelated(true);
          tasks.push(
            api
              .get(`/api/products?category=${encodeURIComponent(data.category)}&limit=8`, { signal: ac.signal })
              .then((r) => {
                if (!mountedRef.current) return;
                const list = Array.isArray(r.data) ? r.data : r.data.products || [];
                setRelated(list.filter((p) => p._id !== data._id));
              })
              .catch(() => {
                if (mountedRef.current) setRelated([]);
              })
              .finally(() => {
                if (mountedRef.current) setLoadingRelated(false);
              })
          );
        } else {
          setRelated([]);
        }

        tasks.push(
          api
            .get(`/api/reviews/${id}`, { signal: ac.signal })
            .then((r) => {
              if (!mountedRef.current) return;
              setReviews(r.data.reviews || []);
            })
            .catch(() => {
              if (mountedRef.current) setReviews([]);
            })
            .finally(() => {
              if (mountedRef.current) setReviewsLoading(false);
            })
        );

        // mark reviewsLoading before starting
        setReviewsLoading(true);
        await Promise.all(tasks);
      } catch (err) {
        if (!mountedRef.current) return;
        console.error(err);
        // Keep product null if 4xx/5xx
        setProduct(null);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchProductAndExtras();

    return () => {
      mountedRef.current = false;
      ac.abort();
    };
  }, [id]);

  /* -------------------------
     Handlers (stable references with useCallback)
  ------------------------- */
  const onSelectVariant = useCallback(
    (index) => {
      if (!product) return;
      setSelectedVariantIndex(index);
      const variant = product.variants?.[index];
      setSelectedColor(variant?.color || "");
      const firstSize = variant?.sizes && variant.sizes.length > 0 ? variant.sizes[0].size : "";
      setSelectedSize(firstSize || "");
      // reset active image to 0 for new variant
      setActive(0);
    },
    [product]
  );

  const onSelectSize = useCallback((sizeValue) => {
    setSelectedSize(sizeValue);
  }, []);

  const validateAndGetPayload = useCallback(() => {
    if (!product) return null;

    // Variant-aware flow
    if (product?.variants && product.variants.length > 0) {
      if (selectedVariantIndex < 0) {
        showToast("Please select a color/variant", "error");
        return null;
      }
      const variant = product.variants[selectedVariantIndex];
      if (!variant) {
        showToast("Please select a color/variant", "error");
        return null;
      }
      if (variant.sizes?.length > 0 && !selectedSize) {
        showToast("Please select a size", "error");
        return null;
      }

      const sizeObj = variant.sizes?.find((s) => s.size === selectedSize) || variant.sizes?.[0];
      const available = Number(sizeObj?.stock || 0);
      if (available <= 0) {
        showToast("Selected size is out of stock", "error");
        return null;
      }

      const requestedQty = Number(qty || 1);
      if (requestedQty > available) {
        showToast(`Only ${available} items in stock`, "error");
        return null;
      }

      return {
        product: product._id,
        title: product.title,
        price: Number(sizeObj?.price || currentPrice || 0),
        qty: requestedQty,
        image: derivedImages?.[active] || PLACEHOLDER,
        size: sizeObj?.size || "",
        color: variant?.color || "",
        countInStock: available,
      };
    }

    // Backwards compatible flow
    if (product?.sizes?.length && !selectedSize) {
      showToast("Please select a size", "error");
      return null;
    }
    if (product?.colors?.length && !selectedColor) {
      showToast("Please select a color", "error");
      return null;
    }
    const stock = Number(product?.countInStock || 0);
    if (!stock) {
      showToast("Item is out of stock", "error");
      return null;
    }
    const requestedQty = Number(qty || 1);
    if (requestedQty > stock) {
      showToast(`Only ${stock} items in stock`, "error");
      return null;
    }
    return {
      product: product._id,
      title: product.title,
      price: Number(product.price || 0),
      qty: requestedQty,
      image: derivedImages?.[active] || PLACEHOLDER,
      size: selectedSize,
      color: selectedColor,
      countInStock: stock,
    };
  }, [
    product,
    selectedVariantIndex,
    selectedSize,
    selectedColor,
    qty,
    currentPrice,
    derivedImages,
    active,
  ]);

  const onAdd = useCallback(() => {
    const payload = validateAndGetPayload();
    if (payload) {
      dispatch(addToCart(payload));
      showToast(`${product.title} added to cart`);
    }
  }, [validateAndGetPayload, dispatch, product]);

  const handleBuyNow = useCallback(() => {
    const payload = validateAndGetPayload();
    if (!payload) return;
    dispatch(addToCart(payload));
    navigate("/cart");
  }, [validateAndGetPayload, dispatch, navigate]);

  /* -------------------------
     Lightweight UI fallbacks while loading / not found
  ------------------------- */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse grid md:grid-cols-2 gap-10">
          <div className="aspect-square md:aspect-[4/5] bg-gray-200 dark:bg-zinc-700 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-zinc-700 w-2/3 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 w-1/3 rounded" />
            <div className="h-24 bg-gray-100 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-10 text-center dark:text-gray-300">Product not found</div>
    );
  }

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div className="product-details-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#fdf7f7] dark:bg-zinc-900">
      <style>{`
        .swiper-button-next,
        .swiper-button-prev { display: none; }
        @media (min-width: 768px) {
          .swiper-button-next,
          .swiper-button-prev {
            display: flex;
            color: ${theme === "dark" ? "#FFF" : "#000"};
            background-color: ${
              theme === "dark"
                ? "rgba(0,0,0,0.3)"
                : "rgba(255,255,255,0.5)"
            };
            border-radius: 50%;
            width: 40px;
            height: 40px;
          }
        }
        .product-details-page .swiper-pagination-bullet {
          background: ${theme === "dark" ? "#FFF" : "#000"} !important;
        }
        .product-details-page .swiper-slide-thumb-active {
          border: 2px solid ${theme === "dark" ? "#FFF" : "#000"};
        }
      `}</style>

      <Breadcrumb title={product.title} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12">
        <section className="md:col-span-1 lg:col-span-7 order-1">
          <Gallery
            images={derivedImages}
            productTitle={product.title}
            thumbsSwiper={thumbsSwiper}
            setThumbsSwiper={setThumbsSwiper}
            mainSwiper={mainSwiper}
            setMainSwiper={setMainSwiper}
            setActive={setActive}
            active={active}
            inStock={inStock}
            isWished={isWished}
            setIsWished={setIsWished}
            canShowNavigation={canShowNavigation}
          />
        </section>

        <ProductInfoPanel
          product={product}
          currentPrice={currentPrice}
          currentStock={currentStock}
          inStock={inStock}
          selectedVariantIndex={selectedVariantIndex}
          selectedSize={selectedSize}
          onSelectVariant={onSelectVariant}
          onSelectSize={onSelectSize}
          qty={qty}
          setQty={setQty}
          onAdd={onAdd}
          onBuyNow={handleBuyNow}
        />
      </div>

      <ReviewSection
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        onOpenReviewForm={() => setShowReviewModal(true)}
      />

      <RelatedProducts
        related={related}
        loadingRelated={loadingRelated}
        canShowNavigation={canShowNavigation}
      />

      {showReviewModal && (
        <ReviewForm
          productId={id}
          onClose={async (submitted) => {
            setShowReviewModal(false);
            if (submitted) {
              try {
                const { data } = await api.get(`/api/reviews/${id}`);
                if (mountedRef.current) setReviews(data.reviews || []);
              } catch (err) {
                if (mountedRef.current) setReviews([]);
              }
            }
          }}
        />
      )}
    </div>
  );
}
