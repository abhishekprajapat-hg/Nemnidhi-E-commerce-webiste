import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import api, { getApiErrorMessage, toAbsoluteAssetUrl } from "../api/client";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import ProductTile from "../components/ProductTile";
import RemoteImage from "../components/RemoteImage";
import SectionHeader from "../components/SectionHeader";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";
import { buildQuickAddPayload } from "../utils/product";
import { openShopTab, openWebsiteDestination } from "../utils/navigation";

const VALUE_BADGES = ["Handloom Verified", "Fast Dispatch", "Secure Checkout"];
const TRUST_ITEMS = [
  {
    title: "Authentic Handloom",
    description: "Each piece is sourced with verified quality checks.",
  },
  {
    title: "Speedy Delivery",
    description: "Orders are packed with care and shipped quickly.",
  },
  {
    title: "Secure Payments",
    description: "Trusted checkout with protected transactions.",
  },
  {
    title: "Easy Support",
    description: "Assistance before and after purchase, every day.",
  },
];

const DEFAULT_CATEGORIES = [
  { name: "Sarees", description: "Curated edit for your wardrobe." },
  { name: "Lehengas", description: "Curated edit for your wardrobe." },
  { name: "Western", description: "Curated edit for your wardrobe." },
  { name: "Tops", description: "Curated edit for your wardrobe." },
];

const EXPLORE_LINKS = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Most Loved", href: "/products?sort=-rating" },
  { label: "Policies", href: "/policies" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function normalizeCategory(category) {
  if (!category) return null;

  if (typeof category === "string") {
    return {
      name: category,
      slug: String(category).trim().toLowerCase().replace(/\s+/g, "-"),
      description: "Curated edit for your wardrobe.",
      image: null,
    };
  }

  const name = String(category?.title || category?.name || category?.slug || "").trim();
  if (!name) return null;

  return {
    name,
    slug: String(category?.slug || name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-"),
    description:
      String(category?.subtitle || category?.description || "Curated edit for your wardrobe.").trim(),
    image: toAbsoluteAssetUrl(
      category?.img ||
        category?.image ||
        category?.imageUrl ||
        category?.thumbnail ||
        category?.coverImage
    ),
  };
}

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [heroSlide, setHeroSlide] = useState(null);
  const [promo, setPromo] = useState(null);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isNarrowScreen = width < 390;
  const isCompactScreen = width < 360;
  const categoryCardWidth = isNarrowScreen
    ? "100%"
    : Math.max(0, (width - spacing.md * 2 - spacing.md) / 2);

  const loadHome = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [homepageResponse, productsResponse] = await Promise.all([
          api.get("/api/content/homepage").catch(() => null),
          api.get("/api/products?limit=8").catch(() => null),
        ]);

        const homepage = homepageResponse?.data || {};
        const heroSlides = Array.isArray(homepage.heroSlides) ? homepage.heroSlides : [];
        const nextCategories = Array.isArray(homepage.categories)
          ? homepage.categories.map(normalizeCategory).filter(Boolean)
          : [];
        const products = Array.isArray(productsResponse?.data)
          ? productsResponse?.data
          : productsResponse?.data?.products || [];

        setHeroSlide(heroSlides[0] || null);
        setCategories(nextCategories.length ? nextCategories.slice(0, 6) : DEFAULT_CATEGORIES);
        setPromo(homepage.promo || null);
        setNewArrivals(products);
      } catch (error) {
        showToast(
          getApiErrorMessage(error, "Could not load the home screen."),
          "error"
        );
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const hero = useMemo(
    () => ({
      title:
        heroSlide?.title || "Modern Indian silhouettes for every celebration",
      subtitle:
        heroSlide?.subtitle ||
        "Curated textiles, artisan finishes, and statement drapes built for timeless wardrobes.",
      cta: heroSlide?.cta || "Explore Collection",
      href: heroSlide?.href || "/products",
    }),
    [heroSlide]
  );

  const handleQuickAdd = useCallback(
    (product) => {
      const payload = buildQuickAddPayload(product);
      if (!payload?.size || !payload?.color) {
        navigation.navigate("ProductDetails", { productId: product?._id });
        return;
      }

      const added = addItem(payload);
      if (added) {
        showToast(`${product.title} added to cart.`, "success");
      }
    },
    [addItem, navigation, showToast]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadHome(true)}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stickyHeaderWrap}>
        <MobileHeader />
      </View>

      <LinearGradient
        colors={["#FFFDF9", "#F7EADF", "#F3DDCF"]}
        style={[styles.heroPanel, isNarrowScreen ? styles.heroPanelNarrow : null]}
      >
        <View
          style={[
            styles.heroBadgeRow,
            isNarrowScreen ? styles.heroBadgeRowStacked : null,
          ]}
        >
          <Text style={styles.heroEyebrow}>New Season Edit</Text>
          <Text style={styles.heroCounter}>01 / 01</Text>
        </View>

        <Text
          style={[
            styles.heroTitle,
            isNarrowScreen ? styles.heroTitleNarrow : null,
            isCompactScreen ? styles.heroTitleCompact : null,
          ]}
        >
          {hero.title}
        </Text>
        <Text
          style={[
            styles.heroSubtitle,
            isNarrowScreen ? styles.heroSubtitleNarrow : null,
          ]}
        >
          {hero.subtitle}
        </Text>

        <View style={styles.heroActions}>
          <PrimaryButton
            title={hero.cta}
            onPress={() => openWebsiteDestination(navigation, hero.href)}
            style={styles.heroPrimary}
          />
          <PrimaryButton
            title="Shop All"
            variant="secondary"
            onPress={() => openWebsiteDestination(navigation, "/products")}
            style={styles.heroSecondary}
          />
        </View>

        <View style={styles.badgesRow}>
          {VALUE_BADGES.map((item) => (
            <View key={item} style={styles.badgePill}>
              <Text style={styles.badgePillText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.categoriesChipWrap}>
          <Text style={styles.categoriesChipLabel}>Browse by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.categoriesChipRow,
              isNarrowScreen ? styles.categoriesChipRowNarrow : null,
            ]}
          >
            {categories.map((category) => (
              <PrimaryButton
                key={category.slug || category.name}
                title={category.name}
                variant="secondary"
                onPress={() => openShopTab(navigation, category.slug || category.name)}
                style={styles.categoryChipButton}
                textStyle={styles.categoryChipButtonText}
              />
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <View>
        <SectionHeader
          eyebrow="Shop by Category"
          title="Find your next favorite fit"
        />
        <View style={styles.categoryGrid}>
          {categories.slice(0, 6).map((category) => (
            <PressableCategory
              key={category.slug || category.name}
              category={category}
              onPress={() => openShopTab(navigation, category.slug || category.name)}
              width={categoryCardWidth}
            />
          ))}
        </View>
      </View>

      <View>
        <SectionHeader
          eyebrow="Fresh Picks"
          title="New Arrivals"
          subtitle="Handpicked styles selected by our editors."
          actionLabel="View all"
          onActionPress={() => navigation.navigate("NewArrivals")}
        />

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.accentStrong} size="large" />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsRow}
          >
            {newArrivals.map((product) => (
              <ProductTile
                key={product._id}
                compact
                product={product}
                onPress={() =>
                  navigation.navigate("ProductDetails", {
                    productId: product._id,
                  })
                }
                onAddToCart={() => handleQuickAdd(product)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <LinearGradient
        colors={["#FFFDF9", "#F6E8DA"]}
        style={[styles.promoCard, isNarrowScreen ? styles.promoCardNarrow : null]}
      >
        <Text style={styles.promoEyebrow}>{promo?.eyebrow || "Editor Pick"}</Text>
        <Text
          style={[
            styles.promoTitle,
            isNarrowScreen ? styles.promoTitleNarrow : null,
            isCompactScreen ? styles.promoTitleCompact : null,
          ]}
        >
          {promo?.title || "Curated festive edits now live"}
        </Text>
        <Text style={styles.promoText}>
          {promo?.subtitle ||
            "Discover handpicked drapes and elevated silhouettes for weddings, celebrations, and statement evenings."}
        </Text>
        <View style={styles.promoActions}>
          <PrimaryButton
            title={promo?.buttonText || "Shop the Edit"}
            onPress={() =>
              openWebsiteDestination(
                navigation,
                promo?.href || promo?.buttonHref || "/products"
              )
            }
          />
          <PrimaryButton
            title="View All Products"
            variant="secondary"
            onPress={() => openWebsiteDestination(navigation, "/products")}
          />
        </View>
      </LinearGradient>

      <View style={styles.trustCard}>
        <SectionHeader
          eyebrow="Why Nemnidhi"
          title="Quality you can trust"
        />
        <View style={styles.trustGrid}>
          {TRUST_ITEMS.map((item) => (
            <View key={item.title} style={styles.trustItem}>
              <View style={styles.trustIconBubble}>
                <Text style={styles.trustIconText}>N</Text>
              </View>
              <Text style={styles.trustTitle}>{item.title}</Text>
              <Text style={styles.trustText}>{item.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.exploreCard}>
        <SectionHeader
          eyebrow="Explore More"
          title="Everything from the website, now inside the app"
          subtitle="Jump into curated collections, support pages, and store policies."
        />
        <View style={styles.exploreActions}>
          {EXPLORE_LINKS.map((item) => (
            <PrimaryButton
              key={item.href}
              title={item.label}
              variant="secondary"
              onPress={() => openWebsiteDestination(navigation, item.href)}
              style={styles.exploreButton}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function PressableCategory({ category, onPress, width }) {
  return (
    <LinearGradient
      colors={["#2A1D17", "#7D4C34"]}
      style={[styles.categoryCard, { width }]}
    >
      <RemoteImage
        uri={category?.image}
        label={category?.name}
        style={styles.categoryCardImageWrap}
        imageStyle={styles.categoryCardImage}
      />
      <LinearGradient
        colors={["rgba(24,15,11,0.12)", "rgba(24,15,11,0.26)", "rgba(24,15,11,0.82)"]}
        style={styles.categoryCardOverlay}
      />
      <Text style={styles.categoryCardTitle}>{category.name}</Text>
      <Text style={styles.categoryCardText}>{category.description}</Text>
      <PrimaryButton
        title="Open"
        variant="ghost"
        onPress={onPress}
        style={styles.categoryCardButton}
        textStyle={styles.categoryCardButtonText}
      />
    </LinearGradient>
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
  stickyHeaderWrap: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xs,
    zIndex: 5,
  },
  heroPanel: {
    ...shadow,
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing.xl,
  },
  heroPanelNarrow: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  heroBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroBadgeRowStacked: {
    alignItems: "flex-start",
    gap: 10,
  },
  heroEyebrow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  heroCounter: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 48,
    lineHeight: 48,
    marginTop: 18,
  },
  heroTitleNarrow: {
    fontSize: 40,
    lineHeight: 40,
  },
  heroTitleCompact: {
    fontSize: 36,
    lineHeight: 38,
  },
  heroSubtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 14,
  },
  heroSubtitleNarrow: {
    lineHeight: 22,
  },
  heroActions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  heroPrimary: {
    width: "100%",
  },
  heroSecondary: {
    width: "100%",
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
    paddingVertical: 7,
  },
  badgePillText: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  categoriesChipWrap: {
    marginTop: spacing.xl,
  },
  categoriesChipLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  categoriesChipRow: {
    gap: 10,
    paddingRight: spacing.md,
  },
  categoriesChipRowNarrow: {
    paddingRight: spacing.xl,
  },
  categoryChipButton: {
    minHeight: 42,
  },
  categoryChipButtonText: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  categoryCard: {
    borderRadius: 24,
    minHeight: 205,
    overflow: "hidden",
    padding: spacing.lg,
    position: "relative",
  },
  categoryCardImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryCardImage: {
    transform: [{ scale: 1.02 }],
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryCardTitle: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    marginTop: "auto",
  },
  categoryCardText: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  categoryCardButton: {
    alignSelf: "flex-start",
    marginTop: "auto",
    paddingHorizontal: 0,
  },
  categoryCardButtonText: {
    color: colors.white,
    fontSize: 12,
  },
  loaderWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  productsRow: {
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingRight: spacing.md,
  },
  promoCard: {
    ...shadow,
    borderColor: colors.border,
    borderRadius: 32,
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing.xl,
  },
  promoCardNarrow: {
    borderRadius: 28,
    padding: spacing.lg,
  },
  promoEyebrow: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  promoTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 44,
    marginTop: 12,
  },
  promoTitleNarrow: {
    fontSize: 36,
    lineHeight: 38,
  },
  promoTitleCompact: {
    fontSize: 32,
    lineHeight: 34,
  },
  promoText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 16,
  },
  promoActions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  trustCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 32,
    borderWidth: 1,
    padding: spacing.lg,
  },
  trustGrid: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  trustItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  trustIconBubble: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  trustIconText: {
    color: colors.accentStrong,
    fontFamily: fonts.displayBold,
    fontSize: 22,
    lineHeight: 22,
  },
  trustTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginTop: 12,
  },
  trustText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  exploreCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  exploreActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  exploreButton: {
    width: "47%",
  },
});
