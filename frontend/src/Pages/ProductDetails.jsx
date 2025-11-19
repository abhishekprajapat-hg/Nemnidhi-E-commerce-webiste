// src/pages/ProductDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { addToCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import ReviewForm from "../components/ReviewForm";

import { useTheme } from "../context/ThemeContext";

/* -------------------------
   Helper: derive images & price from product (variant-aware)
------------------------- */
const deriveImagesFromProduct = (product, selectedVariantIndex) => {
  // If variant model exists and variant has images -> use them
  if (product?.variants && product.variants.length > 0) {
    const variant = product.variants[selectedVariantIndex ?? 0] || product.variants[0];
    if (variant && Array.isArray(variant.images) && variant.images.length > 0) {
      return variant.images.filter(Boolean);
    }
  }

  // Backwards compatibility: use top-level images or image field
  const imgs = Array.isArray(product?.images) && product.images.length
    ? product.images
    : product?.image
      ? [product.image]
      : [];
  if (imgs.length === 0) return ["/placeholder.png"];
  return imgs.filter(Boolean);
};

const derivePriceFromProduct = (product, selectedVariantIndex, selectedSize) => {
  // Use variant-size price if available
  if (product?.variants && product.variants.length > 0) {
    const variant = product.variants[selectedVariantIndex ?? 0] || product.variants[0];
    if (variant?.sizes && variant.sizes.length > 0) {
      const sObj = (selectedSize && variant.sizes.find((s) => s.size === selectedSize)) || variant.sizes[0];
      if (sObj && typeof sObj.price === "number") return Number(sObj.price);
    }
  }
  // Fallback to top-level price
  return Number(product?.price || 0);
};

const deriveStockFromProduct = (product, selectedVariantIndex, selectedSize) => {
  if (product?.variants && product.variants.length > 0) {
    const variant = product.variants[selectedVariantIndex ?? 0] || product.variants[0];
    if (variant?.sizes && variant.sizes.length > 0) {
      const sObj = (selectedSize && variant.sizes.find((s) => s.size === selectedSize)) || variant.sizes[0];
      if (sObj && typeof sObj.stock === "number") return Number(sObj.stock);
    }
    // If no size selected but variants exist, return total stock of variant
    const total = variant?.sizes?.reduce((acc, s) => acc + (Number(s.stock) || 0), 0);
    if (typeof total === "number") return total;
  }
  // Fallback to top-level countInStock
  return Number(product?.countInStock || 0);
};

/* -------------------------
   Product Card (related) - variant-aware
------------------------- */
const ProductCard = ({ p }) => {
  // derive thumb & price
  const thumb = (p?.variants && p.variants.length > 0 && p.variants[0].images?.[0]) ||
    (Array.isArray(p.images) && p.images[0]) ||
    p.image ||
    "/placeholder.png";

  const price = (p?.variants && p.variants.length > 0 && p.variants[0].sizes?.[0]?.price) ||
    Number(p?.price || 0);

  return (
    <div className="group border rounded-lg overflow-hidden bg-white hover:shadow-md transition dark:bg-zinc-800 dark:border-zinc-700 flex flex-col">
      <div className="aspect-[4/5] sm:aspect-[3/4] bg-gray-100 dark:bg-zinc-700 relative">
        <Link to={`/product/${p._id}`} className="block h-full w-full">
          <img
            src={thumb}
            alt={p.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        </Link>
      </div>
      <div className="p-3">
        <Link to={`/product/${p._id}`}>
          <div className="font-medium line-clamp-1 dark:text-white hover:underline">
            {p.title}
          </div>
        </Link>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          ₹{Number(price || 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
};

/* -------------------------
   Color swatch
------------------------- */
const ColorSwatch = React.memo(({ color, isSelected, onClick }) => {
  // If color is not a valid CSS color, render text circle
  const style = {};
  try {
    style.backgroundColor = color;
  } catch (e) {
    // ignore
  }
  return (
    <button
      onClick={onClick}
      title={color}
      className={`w-8 h-8 rounded-full border border-gray-300 dark:border-zinc-700 flex items-center justify-center text-xs ${
        isSelected ? "ring-2 ring-black dark:ring-white ring-offset-1" : ""
      }`}
      style={style}
    >
      {!style.backgroundColor && <span className="text-xs dark:text-white">{color}</span>}
      <span className="sr-only">{color}</span>
    </button>
  );
});

/* -------------------------
   Star rating
------------------------- */
const StarRating = React.memo(({ rating, numReviews }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      <div className="flex text-yellow-500">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`}>★</span>
        ))}
        {halfStar && <span>☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 dark:text-zinc-600">
            ★
          </span>
        ))}
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({numReviews || 0})</span>
    </div>
  );
});

/* -------------------------
   Accordion
------------------------- */
const Accordion = React.memo(({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200 dark:border-zinc-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-4 text-left font-medium dark:text-white"
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
      {isOpen && <div className="pb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>}
    </div>
  );
});

/* -------------------------
   Main component
------------------------- */
export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [mainSwiper, setMainSwiper] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // variant selections
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [qty, setQty] = useState(1);

  const [images, setImages] = useState([]);
  const [active, setActive] = useState(0);

  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [isWished, setIsWished] = useState(false);

  const cartItems = useSelector((state) => state.cart.items);

  // itemInCart must match cart item fields (product id + size + color)
  const itemInCart = useMemo(() => {
    if (!cartItems || !product) return undefined;
    return cartItems.find(
      (item) =>
        item.product === id &&
        (!selectedSize || item.size === selectedSize) &&
        (!selectedColor || item.color === selectedColor)
    );
  }, [cartItems, id, selectedSize, selectedColor, product]);

  const canShowNavigation = typeof window !== "undefined" && window.innerWidth >= 768;

  /* -------------------------
     Fetch product
  ------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/products/${id}`);
        if (!alive) return;

        setProduct(data);

        // Determine default variant & size selections:
        if (data?.variants && data.variants.length > 0) {
          setSelectedVariantIndex(0);
          const firstVariant = data.variants[0];
          setSelectedColor(firstVariant.color || "");
          const firstSize = firstVariant.sizes && firstVariant.sizes.length > 0 ? firstVariant.sizes[0].size : "";
          setSelectedSize(firstSize || "");
          setImages(deriveImagesFromProduct(data, 0));
        } else {
          // Backward compatibility: top-level sizes/colors/images
          setSelectedVariantIndex(-1);
          setSelectedColor((data?.colors && data.colors[0]) || "");
          setSelectedSize((data?.sizes && data.sizes[0]) || "");
          const imgs = (Array.isArray(data.images) && data.images.length ? data.images : (data.image ? [data.image] : []));
          setImages((imgs && imgs.length) ? imgs : ["/placeholder.png"]);
        }

        setActive(0);
        setQty(1);
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  /* -------------------------
     Fetch related
  ------------------------- */
  useEffect(() => {
    let alive = true;
    if (!product?.category) return;
    (async () => {
      try {
        setLoadingRelated(true);
        const { data } = await api.get(`/api/products?category=${encodeURIComponent(product.category)}&limit=8`);
        const list = Array.isArray(data) ? data : data.products || [];
        if (alive) setRelated(list.filter((p) => p._id !== product._id));
      } catch (err) {
        if (alive) setRelated([]);
      } finally {
        if (alive) setLoadingRelated(false);
      }
    })();
    return () => { alive = false; };
  }, [product?.category, product?._id]);

  /* -------------------------
     Fetch reviews
  ------------------------- */
  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        setReviewsLoading(true);
        const { data } = await api.get(`/api/reviews/${id}`);
        if (alive) setReviews(data.reviews || []);
      } catch (err) {
      } finally {
        if (alive) setReviewsLoading(false);
      }
    })();
    return () => (alive = false);
  }, [id]);

  /* -------------------------
     Derived values: images, price, stock, inStock
  ------------------------- */
  const derivedImages = useMemo(() => {
    if (!product) return ["/placeholder.png"];
    return deriveImagesFromProduct(product, selectedVariantIndex);
  }, [product, selectedVariantIndex]);

  useEffect(() => {
    setImages(derivedImages);
    setActive(0);
  }, [derivedImages]);

  const currentPrice = useMemo(() => derivePriceFromProduct(product || {}, selectedVariantIndex, selectedSize), [product, selectedVariantIndex, selectedSize]);

  const currentStock = useMemo(() => deriveStockFromProduct(product || {}, selectedVariantIndex, selectedSize), [product, selectedVariantIndex, selectedSize]);

  const inStock = useMemo(() => Number(currentStock || 0) > 0, [currentStock]);

  /* -------------------------
     Handlers for selecting variant & size
  ------------------------- */
  const onSelectVariant = (index) => {
    if (!product) return;
    setSelectedVariantIndex(index);
    const variant = product.variants?.[index];
    const newColor = variant?.color || "";
    setSelectedColor(newColor);
    // choose first available size by default
    const firstSize = variant?.sizes && variant.sizes.length > 0 ? variant.sizes[0].size : "";
    setSelectedSize(firstSize);
    // images will update via derivedImages effect
  };

  const onSelectSize = (sizeValue) => {
    setSelectedSize(sizeValue);
  };

  /* -------------------------
     Validation & payload
  ------------------------- */
  const validateAndGetPayload = () => {
    if (!product) return null;

    // If product has variants, ensure a variant & size are selected
    if (product?.variants && product.variants.length > 0) {
      if (selectedVariantIndex == null || selectedVariantIndex < 0) {
        showToast("Please select a color/variant", "error");
        return null;
      }
      const variant = product.variants[selectedVariantIndex];
      if (!variant) {
        showToast("Please select a color/variant", "error");
        return null;
      }
      if (variant.sizes && variant.sizes.length > 0 && !selectedSize) {
        showToast("Please select a size", "error");
        return null;
      }
      // get selected size object
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
        image: images?.[active] || "",
        size: sizeObj?.size || "",
        color: variant?.color || "",
        countInStock: available,
      };
    }

    // Backwards compatibility: old fields
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
      image: images?.[active] || "",
      size: selectedSize,
      color: selectedColor,
      countInStock: stock,
    };
  };

  const onAdd = () => {
    const payload = validateAndGetPayload();
    if (payload) {
      dispatch(addToCart(payload));
      showToast(`${product.title} added to cart`);
    }
  };

  const handleBuyNow = () => {
    const payload = validateAndGetPayload();
    if (!payload) return;
    dispatch(addToCart(payload));
    navigate("/cart");
  };

  /* -------------------------
     UI: Loading / Not found
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
    return <div className="p-10 text-center dark:text-gray-300">Product not found</div>;
  }

  /* -------------------------
     Render main page
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
            background-color: ${theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)"};
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

      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/products" className="hover:underline">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 dark:text-gray-200">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Gallery */}
        <section className="md:col-span-1 lg:col-span-7 order-1">
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border dark:border-zinc-700">
            <Swiper
              modules={[Navigation, Autoplay, Pagination, Thumbs]}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              onSlideChange={(swiper) => setActive(swiper.activeIndex)}
              onSwiper={setMainSwiper}
              spaceBetween={0}
              slidesPerView={1}
              navigation={canShowNavigation}
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: true }}
              className="h-full w-full aspect-[4/5] sm:aspect-[3/4] main-gallery-swiper"
            >
              {images.map((img, i) => (
                <SwiperSlide key={i}>
                  <img
                    src={img}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {!inStock && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs px-2 py-1 rounded z-10">Out of stock</span>
            )}

            <button
              onClick={() => setIsWished(!isWished)}
              className="absolute top-4 right-4 bg-white/70 p-2 rounded-full backdrop-blur-sm dark:bg-zinc-700/70 z-10"
            >
              <span className="dark:text-white">{isWished ? "♥" : "♡"}</span>
              <span className="sr-only">Add to wishlist</span>
            </button>
          </div>

          {images.length > 1 && (
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={4}
              watchSlidesProgress={true}
              modules={[Thumbs]}
              className="mt-4 thumbnail-swiper"
              breakpoints={{
                320: { slidesPerView: 4, spaceBetween: 8 },
                640: { slidesPerView: 5, spaceBetween: 10 },
                1024: { slidesPerView: 7, spaceBetween: 12 },
              }}
            >
              {images.map((src, i) => (
                <SwiperSlide key={i}>
                  <button
                    onClick={() => {
                      setActive(i);
                      if (mainSwiper && mainSwiper.slideTo) mainSwiper.slideTo(i);
                    }}
                    className={`aspect-square rounded-lg overflow-hidden border transition-all ${i === active ? "ring-2 ring-black dark:ring-white" : "border-gray-200 dark:border-zinc-700 opacity-70 hover:opacity-100"}`}
                  >
                    <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }} />
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

        {/* Details & Buy Box */}
        <aside className="md:col-span-1 lg:col-span-5 order-2">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight dark:text-white">{product.title}</h1>
              {product.category && <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.category}</div>}
            </div>

            <div className="flex items-baseline gap-3">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold dark:text-white">₹{Number(currentPrice || 0).toFixed(2)}</div>
              {product.rating > 0 && <StarRating rating={product.rating} numReviews={product.numReviews} />}
            </div>

            {/* VARIANTS UI */}
            {product?.variants && product.variants.length > 0 && (
              <>
                {/* Colors */}
                <div>
                  <div className="text-sm font-medium mb-2 dark:text-white">Color</div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, idx) => (
                      <ColorSwatch
                        key={v.color + "-" + idx}
                        color={v.color || `var-${idx}`}
                        isSelected={selectedVariantIndex === idx}
                        onClick={() => onSelectVariant(idx)}
                      />
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2 dark:text-white">Size</div>
                  <div className="flex flex-wrap gap-2">
                    {(product.variants[selectedVariantIndex]?.sizes || []).map((s) => {
                      const disabled = Number(s.stock || 0) <= 0;
                      return (
                        <button
                          key={s.size}
                          onClick={() => !disabled && onSelectSize(s.size)}
                          className={`px-3 py-1.5 rounded border text-sm ${selectedSize === s.size ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:text-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={disabled}
                        >
                          {s.size}
                          {disabled && <span className="ml-2 text-xs text-red-500">Out</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Backwards compatibility: old sizes/colors (if present) */}
            {!product?.variants?.length && !!product.sizes?.length && (
              <div>
                <div className="text-sm font-medium mb-2 dark:text-white">Size</div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`px-3 py-1.5 rounded border text-sm ${selectedSize === s ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:text-gray-300"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {!product?.variants?.length && !!product.colors?.length && (
              <div>
                <div className="text-sm font-medium mb-2 dark:text-white">Color</div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => <ColorSwatch key={c} color={c} isSelected={selectedColor === c} onClick={() => setSelectedColor(c)} />)}
                </div>
              </div>
            )}

            {/* Quantity + stock */}
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium dark:text-white">Quantity</div>
              <div className="flex items-center border rounded-md dark:border-zinc-700">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 border-r dark:border-zinc-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-l-md">-</button>
                <input type="text" value={qty} readOnly className="w-12 text-center dark:bg-zinc-900 dark:text-white focus:outline-none" />
                <button onClick={() => setQty((q) => Math.min(Number(currentStock), q + 1))} disabled={qty >= currentStock} className="px-4 py-2 border-l dark:border-zinc-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-r-md disabled:cursor-not-allowed disabled:opacity-50">+</button>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{inStock ? `${currentStock} in stock` : "Unavailable"}</div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button disabled={!inStock} onClick={onAdd} className={`w-full px-5 py-3 rounded-md font-semibold transition border ${!inStock ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed dark:bg-zinc-700 dark:text-gray-400 dark:border-zinc-700" : "bg-white text-black border-black hover:bg-gray-100 dark:bg-zinc-800 dark:text-white dark:border-white dark:hover:bg-zinc-700"}`}>Add to Cart</button>
              <button disabled={!inStock} onClick={handleBuyNow} className={`w-full px-5 py-3 rounded-md font-semibold transition ${!inStock ? "bg-gray-300 cursor-not-allowed" : "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200"}`}>Buy Now</button>
            </div>

            {/* Accordions */}
            <div className="pt-4 space-y-2">
              {product.description && <Accordion title="Description" defaultOpen={true}>{product.description}</Accordion>}
              <Accordion title="Materials & Care">
                <p>• Saree: 100% Pure Banarasi Silk</p>
                <p>• Blouse: Silk Blend</p>
                <p className="mt-2">Care: Dry clean only. Store in a muslin cloth.</p>
              </Accordion>
              <Accordion title="Shipping & Returns">
                <p>• Free shipping across India. Dispatched in 2-3 business days.</p>
                <p className="mt-2">• 30-day free returns. Item must be in original, unused condition with all tags attached.</p>
              </Accordion>
            </div>
          </div>
        </aside>
      </div>

      {/* Reviews */}
      <section className="mt-12 pt-8 border-t border-gray-200 dark:border-zinc-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold dark:text-white">Customer Reviews</h2>
            {reviewsLoading ? <div className="text-gray-500 dark:text-gray-300">Loading reviews...</div> : reviews.length === 0 ? <div className="text-gray-500 dark:text-gray-400 mt-1">No reviews yet.</div> : <div className="mt-6 space-y-6">
              {reviews.map((r) => (
                <div key={r._id} className="border-b pb-4 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <strong className="dark:text-white">{r.userName || r.name || "User"}</strong>
                    <div className="text-yellow-500">{"★".repeat(r.rating)}</div>
                    <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">{r.comment}</p>
                  {r.images?.length > 0 && <div className="flex gap-3 mt-2">{r.images.map((img, i) => <img key={i} src={img} className="w-20 h-20 object-cover rounded border" alt="" />)}</div>}
                </div>
              ))}
            </div>}
          </div>
          <button onClick={() => setShowReviewModal(true)} className="border rounded-lg px-4 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800 w-full sm:w-auto">Write a Review</button>
        </div>
      </section>

      {/* Related */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold dark:text-white">You may also like</h2>
          <Link to="/products" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">View all</Link>
        </div>

        {loadingRelated ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-gray-200 dark:bg-zinc-700 rounded-lg" />
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 mt-2 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : related.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">No related products.</div>
        ) : (
          <Swiper modules={[Navigation]} spaceBetween={24} slidesPerView={2} navigation={canShowNavigation} breakpoints={{ 320: { slidesPerView: 2 }, 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }} className="related-products-swiper">
            {related.map((p) => (
              <SwiperSlide key={p._id}>
                <ProductCard p={p} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>

      {showReviewModal && <ReviewForm productId={id} onClose={async (submitted) => { setShowReviewModal(false); if (submitted) { const { data } = await api.get(`/api/reviews/${id}`); setReviews(data.reviews || []); } }} />}

    </div>
  );
}
