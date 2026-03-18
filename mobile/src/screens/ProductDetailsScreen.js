import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import api, { getApiErrorMessage } from "../api/client";
import MobileHeader from "../components/MobileHeader";
import ProductTile from "../components/ProductTile";
import PrimaryButton from "../components/PrimaryButton";
import QuantityStepper from "../components/QuantityStepper";
import RemoteImage from "../components/RemoteImage";
import SectionHeader from "../components/SectionHeader";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";
import { formatCurrency, formatRating } from "../utils/format";
import {
  buildCartItem,
  deriveImagesFromProduct,
  derivePriceFromProduct,
  deriveStockFromProduct,
  getDefaultVariantSelection,
} from "../utils/product";

function DetailChip({ active, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionChip, active ? styles.optionChipActive : null]}
    >
      <Text
        style={[styles.optionChipText, active ? styles.optionChipTextActive : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StateCard({ title, text, showLoader = false }) {
  return (
    <View style={styles.stateCard}>
      {showLoader ? <ActivityIndicator color={colors.accentStrong} size="large" /> : null}
      <Text style={[styles.stateTitle, showLoader ? styles.stateTitleSpacing : null]}>{title}</Text>
      <Text style={styles.stateText}>{text}</Text>
    </View>
  );
}

export default function ProductDetailsScreen({ navigation, route }) {
  const productId = route.params?.productId;
  const { user } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);

      try {
        const { data } = await api.get(`/api/products/${productId}`);
        if (!active) return;

        const defaults = getDefaultVariantSelection(data);
        setProduct(data);
        setSelectedVariantIndex(defaults.selectedVariantIndex);
        setSelectedSize(defaults.selectedSize);
        setImageIndex(0);
        setQty(1);

        const [reviewsResponse, relatedResponse, wishlistResponse] =
          await Promise.all([
            api.get(`/api/reviews/${productId}?limit=3`).catch(() => null),
            data?.category
              ? api
                  .get("/api/products", {
                    params: { category: data.category, limit: 8 },
                  })
                  .catch(() => null)
              : Promise.resolve(null),
            user?.token ? api.get("/api/auth/wishlist").catch(() => null) : Promise.resolve(null),
          ]);

        if (!active) return;

        const relatedProducts = Array.isArray(relatedResponse?.data)
          ? relatedResponse?.data
          : relatedResponse?.data?.products || [];
        const savedProducts = wishlistResponse?.data?.savedProducts || [];

        setReviews(reviewsResponse?.data?.reviews || []);
        setRelated(
          relatedProducts.filter((entry) => String(entry._id) !== String(data._id)).slice(0, 6)
        );
        setIsSaved(
          Array.isArray(savedProducts) &&
            savedProducts.some((entry) => String(entry?._id || entry) === String(data._id))
        );
      } catch (error) {
        if (active) {
          showToast(getApiErrorMessage(error, "Could not load this product."), "error");
          setProduct(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }

    return () => {
      active = false;
    };
  }, [productId, showToast, user?.token]);

  const images = useMemo(
    () => deriveImagesFromProduct(product, selectedVariantIndex),
    [product, selectedVariantIndex]
  );
  const selectedVariant =
    product?.variants?.[selectedVariantIndex] || product?.variants?.[0] || null;
  const currentPrice = useMemo(
    () => derivePriceFromProduct(product, selectedVariantIndex, selectedSize),
    [product, selectedSize, selectedVariantIndex]
  );
  const currentStock = useMemo(
    () => deriveStockFromProduct(product, selectedVariantIndex, selectedSize),
    [product, selectedSize, selectedVariantIndex]
  );
  const heroCopy = useMemo(() => {
    const description = String(product?.description || "").trim();
    if (!description) {
      return "A curated handpicked piece styled for an elegant mobile shopping experience.";
    }
    return description.length > 130 ? `${description.slice(0, 127)}...` : description;
  }, [product?.description]);

  const handleSelectVariant = useCallback(
    (nextIndex) => {
      const variant = product?.variants?.[nextIndex];
      setSelectedVariantIndex(nextIndex);
      setSelectedSize(String(variant?.sizes?.[0]?.size || ""));
      setImageIndex(0);
      setQty(1);
    },
    [product?.variants]
  );

  const buildSelectedCartItem = useCallback(() => {
    if (!product) return null;

    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      if (!selectedVariant) {
        showToast("Please choose a color.", "error");
        return null;
      }

      if (selectedVariant?.sizes?.length > 0 && !selectedSize) {
        showToast("Please choose a size.", "error");
        return null;
      }
    }

    const payload = buildCartItem({
      product,
      selectedVariantIndex,
      selectedSize,
      qty,
      imageIndex,
    });

    if (!payload?.size || !payload?.color) {
      showToast("This product is missing variant information.", "error");
      return null;
    }

    if (payload.countInStock <= 0 || payload.qty > payload.countInStock) {
      showToast("Selected size is out of stock.", "error");
      return null;
    }

    return payload;
  }, [
    imageIndex,
    product,
    qty,
    selectedSize,
    selectedVariant,
    selectedVariantIndex,
    showToast,
  ]);

  const handleAddToCart = useCallback(() => {
    const payload = buildSelectedCartItem();
    if (!payload) return;

    const added = addItem(payload);
    if (added) {
      showToast(`${product.title} added to cart.`, "success");
    }
  }, [addItem, buildSelectedCartItem, product?.title, showToast]);

  const handleBuyNow = useCallback(() => {
    const payload = buildSelectedCartItem();
    if (!payload) return;

    const added = addItem(payload);
    if (!added) return;

    if (!user?.token) {
      navigation.navigate("Login", { redirectTo: "Checkout" });
      return;
    }

    navigation.navigate("Checkout");
  }, [addItem, buildSelectedCartItem, navigation, user?.token]);

  const handleToggleWishlist = useCallback(async () => {
    if (!product?._id) return;

    if (!user?.token) {
      showToast("Sign in to save products.", "info");
      navigation.navigate("Login");
      return;
    }

    if (wishLoading) return;

    setWishLoading(true);
    try {
      const endpoint = `/api/auth/wishlist/${product._id}`;
      const response = isSaved ? await api.delete(endpoint) : await api.post(endpoint);
      const savedProducts = response?.data?.savedProducts || [];
      const nextSaved = savedProducts.some(
        (entry) => String(entry?._id || entry) === String(product._id)
      );
      setIsSaved(nextSaved);
      showToast(nextSaved ? "Saved to your profile." : "Removed from saved.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not update saved products."), "error");
    } finally {
      setWishLoading(false);
    }
  }, [isSaved, navigation, product?._id, showToast, user?.token, wishLoading]);

  if (loading) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MobileHeader showBack compact />
        <StateCard
          showLoader
          title="Loading product"
          text="Pulling product images, reviews, and recommendations."
        />
      </ScrollView>
    );
  }

  if (!product) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MobileHeader showBack compact />
        <StateCard
          title="Product not found"
          text="The selected item may have been removed or is temporarily unavailable."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MobileHeader showBack compact />

      <LinearGradient colors={["#FFFDF9", "#F7EADF", "#F3DDCF"]} style={styles.heroCard}>
        <Text style={styles.eyebrow}>{product.category || "Collection"}</Text>
        <Text style={styles.heroTitle}>{product.title}</Text>
        <Text style={styles.heroSubtitle}>{heroCopy}</Text>

        <View style={styles.badgesRow}>
          <View
            style={[
              styles.badgePill,
              currentStock > 0 ? styles.badgePillPositive : styles.badgePillNegative,
            ]}
          >
            <Text
              style={[
                styles.badgePillText,
                currentStock > 0 ? styles.badgePillTextPositive : styles.badgePillTextNegative,
              ]}
            >
              {currentStock > 0 ? "Ready to ship" : "Sold out"}
            </Text>
          </View>
          {Number(product?.rating || 0) > 0 ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>
                {formatRating(product.rating)} / 5 rating
              </Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.galleryCard}>
        <RemoteImage
          uri={images[imageIndex]}
          label={product.title}
          style={styles.mainImage}
        />

        {images.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {images.map((image, index) => (
              <Pressable
                key={`${image}-${index}`}
                onPress={() => setImageIndex(index)}
                style={[
                  styles.thumbWrap,
                  imageIndex === index ? styles.thumbWrapActive : null,
                ]}
              >
                <RemoteImage uri={image} label={product.title} style={styles.thumbImage} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.price}>{formatCurrency(currentPrice)}</Text>
          </View>
          <View style={styles.stockWrap}>
            <Text style={styles.stockLabel}>Availability</Text>
            <Text
              style={[
                styles.stockValue,
                currentStock > 0 ? styles.stockPositive : styles.stockNegative,
              ]}
            >
              {currentStock > 0 ? `${currentStock} available` : "Out of stock"}
            </Text>
          </View>
        </View>

        {Array.isArray(product?.variants) && product.variants.length > 0 ? (
          <View style={styles.optionsBlock}>
            <Text style={styles.optionLabel}>Color</Text>
            <View style={styles.optionsRow}>
              {product.variants.map((variant, index) => (
                <DetailChip
                  key={`${variant.color}-${index}`}
                  active={index === selectedVariantIndex}
                  label={variant.color}
                  onPress={() => handleSelectVariant(index)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {selectedVariant?.sizes?.length ? (
          <View style={styles.optionsBlock}>
            <Text style={styles.optionLabel}>Size</Text>
            <View style={styles.optionsRow}>
              {selectedVariant.sizes.map((entry) => (
                <DetailChip
                  key={entry.size}
                  active={selectedSize === entry.size}
                  label={`${entry.size}`}
                  onPress={() => setSelectedSize(entry.size)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.qtyRow}>
          <View>
            <Text style={styles.optionLabel}>Quantity</Text>
            <Text style={styles.qtyNote}>Adjust pieces before adding to your bag.</Text>
          </View>
          <QuantityStepper value={qty} max={Math.max(1, currentStock)} onChange={setQty} />
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Add To Cart" onPress={handleAddToCart} />
          <PrimaryButton title="Buy Now" variant="secondary" onPress={handleBuyNow} />
          <PrimaryButton
            title={isSaved ? "Remove From Saved" : "Save To Profile"}
            variant="ghost"
            onPress={handleToggleWishlist}
            loading={wishLoading}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Category</Text>
          <Text style={styles.statValue}>{product.category || "Edit"}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Reviews</Text>
          <Text style={styles.statValue}>{product.numReviews || reviews.length || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Stock</Text>
          <Text style={styles.statValue}>{currentStock > 0 ? "Live" : "Sold"}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <SectionHeader eyebrow="Description" title="About this piece" />
        <Text style={styles.description}>
          {product.description || "No description has been added yet for this product."}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <SectionHeader eyebrow="Reviews" title="Customer voices" />
        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet for this product.</Text>
        ) : (
          reviews.map((review) => (
            <View key={review._id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewName}>{review.userName || review.name || "Customer"}</Text>
                <Text style={styles.reviewRating}>{formatRating(review.rating)} / 5</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))
        )}
      </View>

      {related.length > 0 ? (
        <View style={styles.relatedWrap}>
          <SectionHeader eyebrow="More Like This" title="Related styles" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedRow}
          >
            {related.map((item) => (
              <ProductTile
                key={item._id}
                compact
                product={item}
                onPress={() =>
                  navigation.replace("ProductDetails", { productId: item._id })
                }
                onAddToCart={() => {
                  const payload = buildCartItem({
                    product: item,
                    selectedVariantIndex: 0,
                    selectedSize: item?.variants?.[0]?.sizes?.[0]?.size || "",
                    qty: 1,
                  });

                  if (!payload?.size || !payload?.color) {
                    navigation.replace("ProductDetails", { productId: item._id });
                    return;
                  }

                  const added = addItem(payload);
                  if (added) {
                    showToast(`${item.title} added to cart.`, "success");
                  }
                }}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  stateCard: {
    ...shadow,
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  stateTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 32,
    textAlign: "center",
  },
  stateTitleSpacing: {
    marginTop: spacing.lg,
  },
  stateText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  heroCard: {
    ...shadow,
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    padding: spacing.xl,
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 44,
    marginTop: 8,
  },
  heroSubtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 12,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.xl,
  },
  badgePill: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgePillPositive: {
    backgroundColor: "#EAF5EF",
    borderColor: "rgba(29, 114, 68, 0.18)",
  },
  badgePillNegative: {
    backgroundColor: "#FAE8E4",
    borderColor: "rgba(184, 69, 54, 0.18)",
  },
  badgePillText: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  badgePillTextPositive: {
    color: colors.success,
  },
  badgePillTextNegative: {
    color: colors.danger,
  },
  galleryCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing.sm,
  },
  mainImage: {
    aspectRatio: 0.82,
    borderRadius: radius.lg,
  },
  thumbRow: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingRight: spacing.sm,
  },
  thumbWrap: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumbWrapActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  thumbImage: {
    borderRadius: radius.md,
    height: 72,
    width: 58,
  },
  infoCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  priceRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  priceLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  price: {
    color: colors.accentStrong,
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 40,
    marginTop: 6,
  },
  stockWrap: {
    alignItems: "flex-end",
  },
  stockLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  stockValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginTop: 6,
  },
  stockPositive: {
    color: colors.success,
  },
  stockNegative: {
    color: colors.danger,
  },
  optionsBlock: {
    marginTop: spacing.lg,
  },
  optionLabel: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionChipText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  optionChipTextActive: {
    color: colors.white,
  },
  qtyRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },
  qtyNote: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 24,
    marginTop: 6,
    textAlign: "center",
  },
  sectionCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  description: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  reviewCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  reviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewName: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  reviewRating: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  reviewComment: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  relatedWrap: {
    gap: spacing.md,
  },
  relatedRow: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
});
