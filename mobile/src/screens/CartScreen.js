import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import QuantityStepper from "../components/QuantityStepper";
import RemoteImage from "../components/RemoteImage";
import { useAuth } from "../contexts/AuthContext";
import { getCartItemKey, useCart } from "../contexts/CartContext";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";
import { formatCurrency } from "../utils/format";
import { openShopTab } from "../utils/navigation";

const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING_CHARGE = 99;

export default function CartScreen({ navigation }) {
  const { user } = useAuth();
  const {
    items,
    cartLoading,
    itemsPrice,
    clearCart,
    clearItem,
    setItemQty,
  } = useCart();

  const shippingPrice = useMemo(
    () =>
      itemsPrice >= FREE_SHIPPING_THRESHOLD || itemsPrice === 0
        ? 0
        : STANDARD_SHIPPING_CHARGE,
    [itemsPrice]
  );
  const totalPrice = itemsPrice + shippingPrice;
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - itemsPrice
  );

  if (cartLoading) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MobileHeader showBack />
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.accentStrong} size="large" />
          <Text style={styles.stateTitle}>Loading your bag</Text>
          <Text style={styles.stateText}>
            Pulling the same cart items you selected across the app.
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (items.length === 0) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MobileHeader showBack />
        <LinearGradient colors={["#FFFDF9", "#F7EADF", "#F3DDCF"]} style={styles.heroCard}>
          <Text style={styles.eyebrow}>Shopping Bag</Text>
          <Text style={styles.title}>Your bag is waiting for its first pick.</Text>
          <Text style={styles.subtitle}>
            Add a few products from the catalogue and the checkout flow will be ready.
          </Text>
          <View style={styles.badgesRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Free shipping above 1000</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Warm and easy checkout</Text>
            </View>
          </View>
          <View style={styles.footerActions}>
            <PrimaryButton
              title="Browse Products"
              onPress={() => openShopTab(navigation)}
            />
            <PrimaryButton
              title="Go Home"
              variant="secondary"
              onPress={() =>
                navigation.navigate("MainTabs", {
                  screen: "HomeTab",
                })
              }
            />
          </View>
        </LinearGradient>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MobileHeader showBack />

      <LinearGradient colors={["#FFFDF9", "#F7EADF", "#F3DDCF"]} style={styles.heroCard}>
        <Text style={styles.eyebrow}>Cart</Text>
        <Text style={styles.title}>Review your selected pieces.</Text>
        <Text style={styles.subtitle}>
          Adjust quantities here before moving into the checkout flow.
        </Text>
        <View style={styles.badgesRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{items.length} styles selected</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>
              {shippingPrice === 0 ? "Free shipping unlocked" : "Shipping auto calculated"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Bag Edit</Text>
            <Text style={styles.sectionTitle}>Selected products</Text>
          </View>
          <PrimaryButton
            title="Shop More"
            variant="ghost"
            onPress={() => openShopTab(navigation)}
          />
        </View>

        <View style={styles.itemsList}>
        {items.map((item) => (
          <View key={getCartItemKey(item)} style={styles.itemCard}>
            <RemoteImage uri={item.image} label={item.title} style={styles.itemImage} />

            <View style={styles.itemInfo}>
              <Text numberOfLines={2} style={styles.itemTitle}>
                {item.title}
              </Text>
              <View style={styles.metaPills}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{item.color || "Default"}</Text>
                </View>
                {item.size ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>Size {item.size}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.itemPrice}>
                {formatCurrency(Number(item.price || 0))}
              </Text>

              <View style={styles.itemActionsRow}>
                <QuantityStepper
                  value={Number(item.qty || 1)}
                  max={Math.max(1, Number(item.countInStock || 1))}
                  onChange={(nextQty) => setItemQty(item, nextQty)}
                />
                <PrimaryButton
                  title="Remove"
                  variant="ghost"
                  onPress={() => clearItem(item)}
                />
              </View>
            </View>
          </View>
        ))}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionEyebrow}>Summary</Text>
        <Text style={styles.summaryTitle}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items</Text>
          <Text style={styles.summaryValue}>{formatCurrency(itemsPrice)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>
            {shippingPrice === 0 ? "Free" : formatCurrency(shippingPrice)}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryDivider]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
        </View>

        <View style={styles.shippingBanner}>
          <Text style={styles.shippingHintLabel}>Shipping note</Text>
          {remainingForFreeShipping > 0 ? (
            <Text style={styles.shippingHint}>
              Add {formatCurrency(remainingForFreeShipping)} more to unlock free shipping.
            </Text>
          ) : (
            <Text style={styles.shippingHint}>Free shipping unlocked for this order.</Text>
          )}
        </View>
      </View>

      <View style={styles.footerActions}>
        <PrimaryButton
          title={user?.token ? "Proceed To Checkout" : "Sign In To Checkout"}
          onPress={() => {
            if (!user?.token) {
              navigation.navigate("Login", { redirectTo: "Checkout" });
              return;
            }
            navigation.navigate("Checkout");
          }}
        />
        <PrimaryButton
          title="Clear Cart"
          variant="secondary"
          onPress={() => clearCart()}
        />
      </View>
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
  loaderScreen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
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
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 46,
  },
  subtitle: {
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
  badgePillText: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  sectionCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionEyebrow: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 34,
    marginTop: 4,
  },
  itemsList: {
    gap: spacing.md,
  },
  itemCard: {
    ...shadow,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  itemImage: {
    borderRadius: radius.md,
    height: 128,
    width: 104,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    lineHeight: 24,
  },
  metaPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  metaPill: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaPillText: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    textTransform: "uppercase",
  },
  itemPrice: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginTop: 10,
  },
  itemActionsRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  summaryCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  summaryTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 36,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  summaryDivider: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
  summaryLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  summaryValue: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  totalLabel: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  totalValue: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  shippingBanner: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  shippingHintLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  shippingHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  footerActions: {
    gap: spacing.md,
  },
});
