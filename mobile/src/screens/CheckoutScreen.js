import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import api, { getApiErrorMessage } from "../api/client";
import AddressFields from "../components/AddressFields";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";
import {
  EMPTY_ADDRESS,
  isAddressComplete,
  mapSavedAddresses,
  normalizeAddress,
} from "../utils/address";
import { formatCurrency } from "../utils/format";

const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING_CHARGE = 99;

export default function CheckoutScreen({ navigation }) {
  const { user, authLoading, refreshProfile, mergeUserSession } = useAuth();
  const { items, itemsPrice, clearCart } = useCart();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shipping, setShipping] = useState(
    normalizeAddress({
      ...EMPTY_ADDRESS,
      fullName: user?.name || "",
    })
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const shippingPrice = useMemo(
    () =>
      itemsPrice >= FREE_SHIPPING_THRESHOLD || itemsPrice === 0
        ? 0
        : STANDARD_SHIPPING_CHARGE,
    [itemsPrice]
  );
  const totalPrice = useMemo(
    () => itemsPrice + shippingPrice,
    [itemsPrice, shippingPrice]
  );

  const applyAddressBookResponse = useCallback(
    async (payload = {}) => {
      const nextSavedAddresses = mapSavedAddresses(payload.savedAddresses);
      const nextDefaultId =
        String(payload.defaultAddressId || "") || nextSavedAddresses[0]?._id || "";
      const selected =
        nextSavedAddresses.find((entry) => String(entry._id) === String(nextDefaultId)) ||
        normalizeAddress(payload.shippingAddress || EMPTY_ADDRESS);

      setSavedAddresses(nextSavedAddresses);
      setSelectedAddressId(nextDefaultId);
      setShipping(normalizeAddress(selected));
      setShowNewAddressForm(nextSavedAddresses.length === 0);

      await mergeUserSession({
        shippingAddress: normalizeAddress(selected),
        savedAddresses: nextSavedAddresses,
        defaultAddressId: nextDefaultId,
      });
    },
    [mergeUserSession]
  );

  useEffect(() => {
    if (!authLoading && !user?.token) {
      navigation.replace("Login", { redirectTo: "Checkout" });
    }
  }, [authLoading, navigation, user?.token]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user?.token) return;

      setLoading(true);
      try {
        const profile = await refreshProfile();
        if (!active || !profile) return;

        const nextSavedAddresses = mapSavedAddresses(profile.savedAddresses);
        const nextDefaultId =
          String(profile.defaultAddressId || "") || nextSavedAddresses[0]?._id || "";
        const selected =
          nextSavedAddresses.find((entry) => String(entry._id) === String(nextDefaultId)) ||
          normalizeAddress({
            ...profile.shippingAddress,
            fullName: profile.shippingAddress?.fullName || profile.name || "",
          });

        setSavedAddresses(nextSavedAddresses);
        setSelectedAddressId(nextDefaultId);
        setShipping(normalizeAddress(selected));
        setShowNewAddressForm(nextSavedAddresses.length === 0);
      } catch (error) {
        if (active) {
          showToast(getApiErrorMessage(error, "Could not load your profile."), "error");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [refreshProfile, showToast, user?.token]);

  const handleSelectAddress = async (addressId) => {
    setSelectedAddressId(String(addressId));
    setShowNewAddressForm(false);

    try {
      const { data } = await api.put(`/api/auth/addresses/${addressId}/default`);
      await applyAddressBookResponse(data);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not update the default address."), "error");
    }
  };

  const handleSaveAddress = async () => {
    if (!isAddressComplete(shipping)) {
      showToast("Please complete the address before saving.", "error");
      return;
    }

    setSavingAddress(true);
    try {
      const { data } = await api.post("/api/auth/addresses", {
        ...shipping,
        setDefault: true,
      });

      await applyAddressBookResponse(data);
      showToast("Address saved.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not save the address."), "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!items.length) {
      showToast("Your cart is empty.", "error");
      return;
    }

    if (!isAddressComplete(shipping)) {
      showToast("Please complete your delivery address.", "error");
      return;
    }

    setPlacingOrder(true);
    try {
      const { data } = await api.post("/api/orders", {
        orderItems: items,
        shippingAddress: shipping,
        paymentMethod: "COD",
        itemsPrice,
        shippingPrice,
        totalPrice,
      });

      await clearCart();
      navigation.replace("OrderSuccess", {
        orderId: data?.orderId || data?._id,
        totalPrice,
      });
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not place the order."), "error");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading || authLoading) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MobileHeader showBack />
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.accentStrong} size="large" />
          <Text style={styles.stateTitle}>Preparing checkout</Text>
          <Text style={styles.stateText}>
            Pulling your saved addresses and selected products.
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!items.length) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MobileHeader showBack />
        <LinearGradient colors={["#FFFDF9", "#F7EADF", "#F3DDCF"]} style={styles.heroCard}>
          <Text style={styles.eyebrow}>Checkout</Text>
          <Text style={styles.title}>Your cart is empty.</Text>
          <Text style={styles.subtitle}>
            Add products first and then come back to complete delivery details.
          </Text>
          <View style={styles.footerActions}>
            <PrimaryButton title="Open Cart" onPress={() => navigation.navigate("Cart")} />
            <PrimaryButton
              title="Continue Shopping"
              variant="secondary"
              onPress={() =>
                navigation.navigate("MainTabs", {
                  screen: "ShopTab",
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
        <Text style={styles.eyebrow}>Checkout</Text>
        <Text style={styles.title}>Finish the order on mobile.</Text>
        <Text style={styles.subtitle}>
          This first app release uses cash on delivery so checkout stays reliable inside Expo.
        </Text>
        <View style={styles.badgesRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>Address book synced</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>COD enabled</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionEyebrow}>Delivery</Text>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.sectionText}>
              Pick a saved address or add a new one.
            </Text>
          </View>
          <PrimaryButton
            title="Add New"
            variant="ghost"
            onPress={() => {
              setShowNewAddressForm(true);
              setSelectedAddressId("");
              setShipping(
                normalizeAddress({
                  ...EMPTY_ADDRESS,
                  fullName: user?.name || "",
                })
              );
            }}
          />
        </View>

        <View style={styles.addressList}>
          {savedAddresses.map((address) => {
            const isSelected =
              !showNewAddressForm &&
              String(selectedAddressId) === String(address._id);

            return (
              <View
                key={address._id}
                style={[
                  styles.addressCard,
                  isSelected ? styles.addressCardSelected : null,
                ]}
              >
                <Text style={styles.addressName}>
                  {address.fullName} / {address.label}
                </Text>
                <Text style={styles.addressText}>
                  {address.address}, {address.city} - {address.postalCode}
                </Text>
                <Text style={styles.addressText}>
                  {address.country}
                  {address.phone ? ` / ${address.phone}` : ""}
                </Text>
                <PrimaryButton
                  title={isSelected ? "Selected" : "Deliver Here"}
                  variant={isSelected ? "primary" : "secondary"}
                  onPress={() => handleSelectAddress(address._id)}
                  style={styles.addressAction}
                />
              </View>
            );
          })}
        </View>

        {(showNewAddressForm || savedAddresses.length === 0) && (
          <View style={styles.formWrap}>
            <AddressFields address={shipping} onChange={setShipping} />
            <View style={styles.formActions}>
              {savedAddresses.length > 0 ? (
                <PrimaryButton
                  title="Use Saved Address"
                  variant="secondary"
                  onPress={() => setShowNewAddressForm(false)}
                />
              ) : null}
              <PrimaryButton
                title="Save Address"
                onPress={handleSaveAddress}
                loading={savingAddress}
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Review</Text>
        <Text style={styles.sectionTitle}>Order Summary</Text>

        {items.map((item) => (
          <View key={`${item.product}-${item.size}-${item.color}`} style={styles.summaryRow}>
            <View style={styles.summaryItemMeta}>
              <Text numberOfLines={1} style={styles.summaryItemTitle}>
                {item.title}
              </Text>
              <Text style={styles.summaryItemText}>
                Qty {item.qty}
                {item.size ? ` / ${item.size}` : ""}
                {item.color ? ` / ${item.color}` : ""}
              </Text>
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(Number(item.price || 0) * Number(item.qty || 0))}
            </Text>
          </View>
        ))}

        <View style={[styles.summaryRow, styles.summaryDivider]}>
          <Text style={styles.summaryLabel}>Items</Text>
          <Text style={styles.summaryValue}>{formatCurrency(itemsPrice)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>
            {shippingPrice === 0 ? "Free" : formatCurrency(shippingPrice)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
        </View>
      </View>

      <LinearGradient colors={["#FFFDF9", "#F6E8DA"]} style={styles.paymentCard}>
        <Text style={styles.sectionEyebrow}>Payment</Text>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <Text style={styles.paymentText}>
          Cash on delivery is enabled in the app right now.
        </Text>
        <View style={styles.codPanel}>
          <Text style={styles.codLabel}>Method</Text>
          <Text style={styles.codValue}>Cash on Delivery</Text>
        </View>
        <PrimaryButton
          title={placingOrder ? "Placing Order..." : "Place Order (COD)"}
          onPress={handlePlaceOrder}
          loading={placingOrder}
          style={styles.placeOrderButton}
        />
      </LinearGradient>
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
    letterSpacing: 1,
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
    textAlign: "center",
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
    padding: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionEyebrow: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 34,
    marginTop: 4,
  },
  sectionText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  addressList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  addressCardSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  addressName: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  addressText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  addressAction: {
    marginTop: spacing.md,
  },
  formWrap: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  formActions: {
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  summaryDivider: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  summaryItemMeta: {
    flex: 1,
    paddingRight: spacing.md,
  },
  summaryItemTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  summaryItemText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
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
    marginTop: 4,
  },
  totalValue: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginTop: 4,
  },
  paymentCard: {
    ...shadow,
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    padding: spacing.xl,
  },
  paymentText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  codPanel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  codLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  codValue: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginTop: 6,
  },
  placeOrderButton: {
    marginTop: spacing.xl,
  },
  footerActions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
