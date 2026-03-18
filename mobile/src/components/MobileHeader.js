import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BrandMark from "./BrandMark";
import { useCart } from "../contexts/CartContext";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";

export default function MobileHeader({
  compact = false,
  showBack = false,
  onBackPress,
  showCart = true,
}) {
  const navigation = useNavigation();
  const { itemCount } = useCart();
  const handleBack = () => {
    if (typeof onBackPress === "function") {
      onBackPress();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("MainTabs", {
      screen: "HomeTab",
    });
  };

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <View style={styles.panel}>
        <View style={styles.leadingGroup}>
          {showBack ? (
            <Pressable
              accessibilityLabel="Go back"
              onPress={handleBack}
              style={styles.iconButton}
            >
              <FontAwesome6
                color={colors.text}
                iconStyle="solid"
                name="chevron-left"
                size={14}
              />
            </Pressable>
          ) : null}

          <Pressable
            onPress={() =>
              navigation.navigate("MainTabs", {
                screen: "HomeTab",
              })
            }
            style={styles.brand}
          >
            <View style={styles.logoBubble}>
              <BrandMark size={compact ? 26 : 28} />
            </View>

            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTitle}>NEMNIDHI</Text>
            </View>
          </Pressable>
        </View>

        {showCart ? (
          <Pressable
            onPress={() => navigation.navigate("Cart")}
            accessibilityLabel="Open cart"
            style={styles.bagButton}
          >
            <Text style={styles.bagText}>Bag</Text>
            {itemCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  wrapCompact: {
    marginBottom: spacing.sm,
  },
  panel: {
    ...shadow,
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leadingGroup: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 10,
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 10,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  logoBubble: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  brandTextWrap: {
    flexShrink: 1,
  },
  brandTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    includeFontPadding: false,
    letterSpacing: 0.8,
    lineHeight: 28,
  },
  bagButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  bagText: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    justifyContent: "center",
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  headerSpacer: {
    width: 40,
  },
});
