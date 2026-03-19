import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api, { getApiErrorMessage } from "../api/client";
import AddressFields from "../components/AddressFields";
import FormField from "../components/FormField";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import RemoteImage from "../components/RemoteImage";
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
import { formatCurrency, formatDate } from "../utils/format";
import {
  buildQuickAddPayload,
  getProductCardPrice,
  getProductPreviewImage,
} from "../utils/product";
import { openWebsiteDestination } from "../utils/navigation";

const TABS = ["profile", "saved", "orders"];

export default function ProfileScreen({ navigation, route }) {
  const { user, logout, mergeUserSession } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(
    TABS.includes(route.params?.tab) ? route.params.tab : "profile"
  );
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState("");
  const [addressDraft, setAddressDraft] = useState(
    normalizeAddress({
      ...EMPTY_ADDRESS,
      fullName: user?.name || "",
    })
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [savedProducts, setSavedProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (TABS.includes(route.params?.tab)) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);

  const defaultAddress = useMemo(
    () =>
      savedAddresses.find((entry) => String(entry._id) === String(defaultAddressId)) || null,
    [defaultAddressId, savedAddresses]
  );

  const isEditingAddress = Boolean(editingAddressId && editingAddressId !== "new");

  const applyAddressBook = useCallback(
    async (payload = {}) => {
      const nextSavedAddresses = mapSavedAddresses(payload.savedAddresses);
      const nextDefaultId =
        String(payload.defaultAddressId || "") || nextSavedAddresses[0]?._id || "";
      const selected =
        nextSavedAddresses.find((entry) => String(entry._id) === String(nextDefaultId)) ||
        normalizeAddress(payload.shippingAddress || EMPTY_ADDRESS);

      setSavedAddresses(nextSavedAddresses);
      setDefaultAddressId(nextDefaultId);
      setEditingAddressId("");
      setShowAddressForm(false);
      setAddressDraft(
        nextSavedAddresses.length
          ? normalizeAddress(selected)
          : normalizeAddress({
              ...EMPTY_ADDRESS,
              fullName: name || user?.name || "",
            })
      );

      await mergeUserSession({
        shippingAddress: normalizeAddress(selected),
        savedAddresses: nextSavedAddresses,
        defaultAddressId: nextDefaultId,
      });
    },
    [mergeUserSession, name, user?.name]
  );

  const loadProfile = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [profileResponse, ordersResponse] = await Promise.all([
        api.get("/api/auth/profile"),
        api.get("/api/orders/myorders"),
      ]);

      const profile = profileResponse?.data || {};
      const nextSavedAddresses = mapSavedAddresses(profile.savedAddresses);
      const nextDefaultId =
        String(profile.defaultAddressId || "") || nextSavedAddresses[0]?._id || "";
      const selected =
        nextSavedAddresses.find((entry) => String(entry._id) === String(nextDefaultId)) ||
        normalizeAddress({
          ...profile.shippingAddress,
          fullName: profile.shippingAddress?.fullName || profile.name || "",
        });

      setName(profile.name || "");
      setEmail(profile.email || "");
      setSavedAddresses(nextSavedAddresses);
      setDefaultAddressId(nextDefaultId);
      setAddressDraft(normalizeAddress(selected));
      setShowAddressForm(false);
      setEditingAddressId("");
      setSavedProducts(
        Array.isArray(profile.savedProducts) ? profile.savedProducts.filter(Boolean) : []
      );
      setOrders(Array.isArray(ordersResponse?.data) ? ordersResponse.data : []);

      await mergeUserSession({
        name: profile.name || "",
        email: profile.email || "",
        shippingAddress: normalizeAddress(selected),
        savedAddresses: nextSavedAddresses,
        defaultAddressId: nextDefaultId,
      });
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not load your profile."), "error");
    } finally {
      setLoading(false);
    }
  }, [mergeUserSession, showToast, user?.token]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast("Please enter your name.", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await api.put("/api/auth/profile", {
        name: name.trim(),
        shippingAddress: normalizeAddress(defaultAddress || addressDraft || EMPTY_ADDRESS),
      });

      setName(data.name || "");
      setEmail(data.email || "");
      await mergeUserSession(data);
      showToast("Profile updated.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not save your profile."), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenAddAddress = useCallback(() => {
    setEditingAddressId("new");
    setAddressDraft(
      normalizeAddress({
        ...EMPTY_ADDRESS,
        fullName: name || user?.name || "",
        phone: defaultAddress?.phone || "",
      })
    );
    setShowAddressForm(true);
  }, [defaultAddress?.phone, name, user?.name]);

  const handleEditAddress = useCallback((address) => {
    if (!address?._id) return;
    setEditingAddressId(String(address._id));
    setAddressDraft(normalizeAddress(address));
    setShowAddressForm(true);
  }, []);

  const handleCancelAddressForm = useCallback(() => {
    setEditingAddressId("");
    setShowAddressForm(false);
    setAddressDraft(
      normalizeAddress(
        defaultAddress || {
          ...EMPTY_ADDRESS,
          fullName: name || user?.name || "",
        }
      )
    );
  }, [defaultAddress, name, user?.name]);

  const handleSaveAddress = async () => {
    if (!isAddressComplete(addressDraft)) {
      showToast("Please complete all required address fields.", "error");
      return;
    }

    setSavingAddress(true);
    try {
      const normalizedDraft = normalizeAddress(addressDraft);

      if (isEditingAddress) {
        const updatedAddresses = savedAddresses.map((entry) =>
          String(entry._id) === String(editingAddressId)
            ? { ...entry, ...normalizedDraft }
            : entry
        );
        const nextDefaultId = defaultAddressId || updatedAddresses[0]?._id || "";
        const nextDefaultAddress =
          updatedAddresses.find((entry) => String(entry._id) === String(nextDefaultId)) ||
          updatedAddresses[0] ||
          normalizedDraft;

        const { data } = await api.put("/api/auth/profile", {
          name: name.trim() || user?.name || "",
          savedAddresses: updatedAddresses,
          defaultAddressId: nextDefaultId,
          shippingAddress: normalizeAddress(nextDefaultAddress),
        });

        await applyAddressBook(data);
        showToast("Address updated.", "success");
      } else {
        const { data } = await api.post("/api/auth/addresses", {
          ...normalizedDraft,
          setDefault: savedAddresses.length === 0,
        });

        await applyAddressBook(data);
        showToast("Address saved.", "success");
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not save the address."), "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setSavingAddress(true);
    try {
      const { data } = await api.put(`/api/auth/addresses/${addressId}/default`);
      await applyAddressBook(data);
      showToast("Default address updated.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not update the default address."), "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleRemoveAddress = async (addressId) => {
    setSavingAddress(true);
    try {
      const { data } = await api.delete(`/api/auth/addresses/${addressId}`);
      await applyAddressBook(data);
      showToast("Address removed.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not remove the address."), "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleRemoveSavedProduct = async (productId) => {
    try {
      const { data } = await api.delete(`/api/auth/wishlist/${productId}`);
      const nextProducts = Array.isArray(data?.savedProducts)
        ? data.savedProducts.filter(Boolean)
        : savedProducts.filter((entry) => String(entry?._id) !== String(productId));
      setSavedProducts(nextProducts);
      showToast("Removed from saved products.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not update saved products."), "error");
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const { data } = await api.put(`/api/orders/${orderId}/cancel`, {
        reason: "Cancelled by user",
      });
      const nextOrder = data?.order;
      setOrders((current) =>
        current.map((entry) =>
          String(entry._id) === String(orderId) ? { ...entry, ...nextOrder } : entry
        )
      );
      showToast("Order cancelled.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not cancel the order."), "error");
    }
  };

  const handleQuickAddSavedProduct = (product) => {
    const payload = buildQuickAddPayload(product);
    if (!payload?.size || !payload?.color) {
      navigation.navigate("ProductDetails", { productId: product?._id });
      return;
    }

    const added = addItem(payload);
    if (added) {
      showToast(`${product.title} added to cart.`, "success");
    }
  };

  if (!user?.token) {
    return (
      <ScrollView
        style={styles.promptScreen}
        contentContainerStyle={styles.promptContent}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stickyHeaderWrap}>
          <MobileHeader />
        </View>

        <View style={styles.promptCard}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>Sign in to unlock your mobile account.</Text>
          <Text style={styles.subtitle}>
            Login gives you the same address book, wishlist, and order history that already lives on the website.
          </Text>
          <View style={styles.promptActions}>
            <PrimaryButton
              title="Sign In"
              onPress={() =>
                navigation.navigate("Login", {
                  redirectTo: "ProfileTab",
                })
              }
            />
            <PrimaryButton
              title="Create Account"
              variant="secondary"
              onPress={() =>
                navigation.navigate("Register", {
                  redirectTo: "ProfileTab",
                })
              }
            />
            <PrimaryButton
              title="Store Policies"
              variant="secondary"
              onPress={() => openWebsiteDestination(navigation, "/policies")}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator color={colors.accentStrong} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stickyHeaderWrap}>
        <MobileHeader />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>My Account</Text>
        <Text style={styles.title}>{name || "Nemnidhi Shopper"}</Text>
        <Text style={styles.subtitle}>{email}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{savedProducts.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{savedAddresses.length}</Text>
            <Text style={styles.statLabel}>Addresses</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const active = tab === activeTab;

          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, active ? styles.tabButtonActive : null]}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                {tab === "profile" ? "Profile" : tab === "saved" ? "Saved" : "Orders"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "profile" ? (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.formGroup}>
              <FormField label="Name" value={name} onChangeText={setName} placeholder="Name" />
              <FormField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                editable={false}
              />
              <PrimaryButton
                title="Save Profile"
                onPress={handleSaveProfile}
                loading={savingProfile}
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressHeaderCopy}>
                <Text style={styles.sectionTitle}>Address Book</Text>
                <Text style={styles.sectionText}>Manage delivery addresses used across mobile and web.</Text>
              </View>
              <PrimaryButton
                title={showAddressForm ? "Cancel" : "Add Address"}
                variant="ghost"
                onPress={() =>
                  showAddressForm ? handleCancelAddressForm() : handleOpenAddAddress()
                }
              />
            </View>

            <View style={styles.addressList}>
              {savedAddresses.length === 0 ? (
                <Text style={styles.emptyText}>No saved addresses yet.</Text>
              ) : (
                savedAddresses.map((address) => {
                  const isDefault = String(address._id) === String(defaultAddressId);

                  return (
                    <View key={address._id} style={styles.addressCard}>
                      <Text style={styles.addressName}>{address.fullName} | {address.label}</Text>
                      <Text style={styles.addressText}>
                        {address.address}, {address.city} - {address.postalCode}
                      </Text>
                      <Text style={styles.addressText}>
                        {address.country}
                        {address.phone ? ` | ${address.phone}` : ""}
                      </Text>

                      <View style={styles.addressActions}>
                        {!isDefault ? (
                          <PrimaryButton
                            title="Set Default"
                            variant="secondary"
                            onPress={() => handleSetDefaultAddress(address._id)}
                          />
                        ) : (
                          <PrimaryButton
                            title="Default"
                            variant="secondary"
                            disabled
                            onPress={() => {}}
                          />
                        )}
                        <PrimaryButton
                          title="Edit"
                          variant="secondary"
                          onPress={() => handleEditAddress(address)}
                        />
                        <PrimaryButton
                          title="Remove"
                          variant="ghost"
                          onPress={() => handleRemoveAddress(address._id)}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {showAddressForm ? (
              <View style={styles.formGroup}>
                <Text style={styles.formIntroTitle}>
                  {isEditingAddress ? "Edit Address" : "Add New Address"}
                </Text>
                <Text style={styles.formIntroText}>
                  {isEditingAddress
                    ? "Update the saved address details used across checkout and profile."
                    : "Save a fresh delivery address for faster checkout on mobile and web."}
                </Text>
                <AddressFields address={addressDraft} onChange={setAddressDraft} />
                <View style={styles.actionRow}>
                  <PrimaryButton
                    title="Cancel"
                    variant="secondary"
                    onPress={handleCancelAddressForm}
                    style={styles.actionCell}
                  />
                  <PrimaryButton
                    title={isEditingAddress ? "Update Address" : "Save Address"}
                    onPress={handleSaveAddress}
                    loading={savingAddress}
                    style={styles.actionCell}
                  />
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Session</Text>
            <Text style={styles.sectionText}>Switch accounts anytime from here.</Text>
            <PrimaryButton
              title="Logout"
              variant="secondary"
              onPress={async () => {
                await logout();
                navigation.navigate("MainTabs", { screen: "HomeTab" });
              }}
              style={styles.logoutButton}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Useful Links</Text>
            <Text style={styles.sectionText}>
              Open the remaining customer pages from the website inside the app.
            </Text>
            <View style={styles.utilityActions}>
              <PrimaryButton
                title="New Arrivals"
                variant="secondary"
                onPress={() => openWebsiteDestination(navigation, "/new-arrivals")}
              />
              <PrimaryButton
                title="Policies"
                variant="secondary"
                onPress={() => openWebsiteDestination(navigation, "/policies")}
              />
              <PrimaryButton
                title="Contact Support"
                variant="secondary"
                onPress={() => openWebsiteDestination(navigation, "/contact")}
              />
            </View>
          </View>
        </>
      ) : null}

      {activeTab === "saved" ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Saved Products</Text>
          {savedProducts.length === 0 ? (
            <Text style={styles.emptyText}>No saved products yet.</Text>
          ) : (
            <View style={styles.savedList}>
              {savedProducts.map((product) => (
                <View key={product._id} style={styles.savedCard}>
                  <RemoteImage
                    uri={getProductPreviewImage(product)}
                    label={product.title}
                    style={styles.savedImage}
                  />
                  <View style={styles.savedInfo}>
                    <Text style={styles.savedTitle}>{product.title}</Text>
                    <Text style={styles.savedPrice}>
                      {formatCurrency(getProductCardPrice(product))}
                    </Text>
                    <View style={styles.savedActions}>
                      <PrimaryButton
                        title="View"
                        variant="secondary"
                        onPress={() =>
                          navigation.navigate("ProductDetails", { productId: product._id })
                        }
                      />
                      <PrimaryButton
                        title="Add To Cart"
                        onPress={() => handleQuickAddSavedProduct(product)}
                      />
                      <PrimaryButton
                        title="Remove"
                        variant="ghost"
                        onPress={() => handleRemoveSavedProduct(product._id)}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {activeTab === "orders" ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>My Orders</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet.</Text>
          ) : (
            <View style={styles.ordersList}>
              {orders.map((order) => {
                const status = String(order?.status || "Created");
                const canCancel = !["Cancelled", "Delivered"].includes(status);

                return (
                  <View key={order._id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderTitle}>{order.orderId || order._id}</Text>
                        <Text style={styles.orderMeta}>{formatDate(order.createdAt)}</Text>
                      </View>
                      <Text style={styles.orderStatus}>{status}</Text>
                    </View>

                    <Text style={styles.orderAmount}>{formatCurrency(order.totalPrice)}</Text>
                    <Text style={styles.orderItems}>
                      {(order.orderItems || [])
                        .slice(0, 2)
                        .map((entry) => entry.title)
                        .join(", ")}
                    </Text>

                    <View style={styles.orderActions}>
                      {canCancel ? (
                        <PrimaryButton
                          title="Cancel Order"
                          variant="secondary"
                          onPress={() => handleCancelOrder(order._id)}
                        />
                      ) : null}
                      {order?.tracking?.trackingUrl ? (
                        <PrimaryButton
                          title="Track"
                          variant="ghost"
                          onPress={() => Linking.openURL(order.tracking.trackingUrl)}
                        />
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  promptScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  promptContent: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  stickyHeaderWrap: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xs,
    zIndex: 5,
  },
  promptCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  promptActions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  loaderScreen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heroCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
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
    lineHeight: 20,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    flex: 1,
    padding: spacing.md,
  },
  statValue: {
    color: colors.text,
    fontFamily: fonts.displayBold,
    fontSize: 24,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 4,
    textTransform: "uppercase",
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tabButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    textAlign: "center",
  },
  tabTextActive: {
    color: colors.white,
  },
  sectionCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 34,
  },
  sectionText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  formGroup: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  formIntroTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  formIntroText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  addressHeader: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  addressHeaderCopy: {
    flex: 1,
  },
  addressList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  addressCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
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
  addressActions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionRow: {
    gap: spacing.md,
  },
  actionCell: {
    width: "100%",
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
  utilityActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  savedList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  savedCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  savedImage: {
    borderRadius: radius.md,
    height: 144,
    width: 110,
  },
  savedInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  savedTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  savedPrice: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginTop: 8,
  },
  savedActions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  ordersList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  orderCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  orderHeader: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  orderTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  orderMeta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  orderStatus: {
    color: colors.accentStrong,
    fontFamily: fonts.bold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  orderAmount: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginTop: spacing.md,
  },
  orderItems: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  orderActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
