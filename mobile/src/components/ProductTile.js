import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";
import { formatCurrency, formatRating } from "../utils/format";
import { getProductCardPrice, getProductPreviewImage } from "../utils/product";
import PrimaryButton from "./PrimaryButton";
import RemoteImage from "./RemoteImage";

export default function ProductTile({
  product,
  onPress,
  onAddToCart,
  compact = false,
}) {
  const image = getProductPreviewImage(product);
  const price = getProductCardPrice(product);
  const hasRating = Number(product?.rating || 0) > 0;

  return (
    <View style={[styles.card, compact ? styles.compactCard : null]}>
      <Pressable onPress={onPress}>
        <View style={styles.mediaWrap}>
          <RemoteImage
            uri={image}
            label={product?.title}
            style={styles.image}
          />
          <View style={styles.mediaOverlay} />
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{product?.category || "Collection"}</Text>
          <Text numberOfLines={2} style={styles.title}>
            {product?.title || "Product"}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.price}>{formatCurrency(price)}</Text>
            {hasRating ? (
              <Text style={styles.rating}>
                {formatRating(product.rating)} ({product?.numReviews || 0})
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      {onAddToCart ? (
        <PrimaryButton
          title="Add To Cart"
          onPress={onAddToCart}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
  },
  compactCard: {
    width: 228,
  },
  mediaWrap: {
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    aspectRatio: 0.75,
    borderRadius: radius.md,
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    bottom: 0,
    height: 92,
    position: "absolute",
  },
  content: {
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: spacing.md,
  },
  category: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 42,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  price: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  rating: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  action: {
    marginTop: spacing.md,
  },
});
