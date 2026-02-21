// src/pages/ProductDetails.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { addToCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";

import ReviewForm from "../components/ReviewForm";

// Components (split)
import Gallery from "../components/product/Gallery";
import RelatedProducts from "../components/product/RelatedProducts";
import Breadcrumb from "../components/product/Breadcrumb";
import ProductInfoPanel from "../components/product/ProductInfoPanel";
import ProductDescriptionSection from "../components/product/ProductDescriptionSection";
import ReviewSection from "../components/product/ReviewSection";

// Helpers
import {
  deriveImagesFromProduct,
  derivePriceFromProduct,
  deriveStockFromProduct,
} from "../utils/productHelpers";

const PLACEHOLDER = "/placeholder.png";
const isProductSaved = (savedProducts, productId) =>
  Array.isArray(savedProducts) &&
  savedProducts.some((entry) => String(entry?._id || entry) === String(productId));

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
  const [wishLoading, setWishLoading] = useState(false);

  // Related & reviews
  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Cart items (for itemInCart calculation)
  const cartItems = useSelector((s) => s.cart.items);
  const reduxUser = useSelector((s) => s.auth?.user || null);

  const authUser = useMemo(() => {
    if (reduxUser?.token) return reduxUser;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token ? parsed : null;
    } catch {
      return null;
    }
  }, [reduxUser]);
  const isAuthenticated = Boolean(authUser?.token);

  // Memoized flag for navigation controls (avoid recalculating on each render)
  const canShowNavigation = useMemo(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
    []
  );

  // Derived images (no separate images state - compute from product + variant)
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
  const _itemInCart = useMemo(() => {
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

  const handleToggleWish = useCallback(async () => {
    if (!product?._id) return;

    if (!isAuthenticated) {
      showToast("Please register to save products", "info");
      navigate("/register", { state: { from: `/product/${id}` } });
      return;
    }

    if (wishLoading) return;

    setWishLoading(true);
    try {
      const endpoint = `/api/auth/wishlist/${product._id}`;
      const { data } = isWished ? await api.delete(endpoint) : await api.post(endpoint);
      const nextSaved = isProductSaved(data?.savedProducts, product._id);
      if (mountedRef.current) setIsWished(nextSaved);
      showToast(nextSaved ? "Product saved to your profile" : "Product removed from saved");
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to update saved products", "error");
    } finally {
      if (mountedRef.current) setWishLoading(false);
    }
  }, [id, isAuthenticated, isWished, navigate, product?._id, wishLoading]);

  useEffect(() => {
    if (!product?._id || !isAuthenticated) {
      setIsWished(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const syncSavedState = async () => {
      try {
        const { data } = await api.get("/api/auth/wishlist", { signal: controller.signal });
        if (cancelled || !mountedRef.current) return;
        setIsWished(isProductSaved(data?.savedProducts, product._id));
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        if (!cancelled && mountedRef.current) setIsWished(false);
      }
    };

    syncSavedState();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [product?._id, isAuthenticated]);

  /* -------------------------
     Lightweight UI fallbacks while loading / not found
  ------------------------- */
  if (loading) {
    return (
      <div className="nm-shell py-8 sm:py-10">
        <div className="animate-pulse grid md:grid-cols-2 gap-10">
          <div className="aspect-square md:aspect-[4/5] rounded-3xl bg-[var(--nm-bg-elevated)]" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded bg-[var(--nm-bg-elevated)]" />
            <div className="h-4 w-1/3 rounded bg-[var(--nm-bg-elevated)]" />
            <div className="h-24 rounded bg-[var(--nm-bg-elevated)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="nm-shell py-12 text-center text-[var(--nm-muted)]">Product not found</div>
    );
  }

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div className="product-details-page pd-page nm-shell py-8 sm:py-10 lg:py-12">
      <Breadcrumb title={product.title} />

      <div className="pd-main-grid grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-10 lg:grid-cols-12 lg:gap-12">
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
            onToggleWish={handleToggleWish}
            wishLoading={wishLoading}
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
          selectedColor={selectedColor}
          onSelectVariant={onSelectVariant}
          onSelectSize={onSelectSize}
          onSelectColor={setSelectedColor}
          qty={qty}
          setQty={setQty}
          onAdd={onAdd}
          onBuyNow={handleBuyNow}
        />
      </div>

      <ProductDescriptionSection description={product.description} />

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
              } catch {
                if (mountedRef.current) setReviews([]);
              }
            }
          }}
        />
      )}
    </div>
  );
}

