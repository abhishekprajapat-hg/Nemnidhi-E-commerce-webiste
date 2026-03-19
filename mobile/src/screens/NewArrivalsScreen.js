import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import api, { getApiErrorMessage } from "../api/client";
import MobileHeader from "../components/MobileHeader";
import ProductTile from "../components/ProductTile";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";
import { buildQuickAddPayload } from "../utils/product";

export default function NewArrivalsScreen({ navigation }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadProducts = useCallback(
    async ({ nextPage = 1, append = false, isRefresh = false } = {}) => {
      if (append) setLoadingMore(true);
      else if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const { data } = await api.get("/api/products", {
          params: {
            page: nextPage,
            limit: 12,
            sort: "-createdAt",
            sortBy: "createdAt",
            order: "desc",
          },
        });

        const nextProducts = Array.isArray(data) ? data : data?.products || [];
        setProducts((current) => (append ? [...current, ...nextProducts] : nextProducts));
        setPage(Number(data?.page || nextPage));
        setPages(Number(data?.pages || 1));
      } catch (error) {
        if (!append) setProducts([]);
        showToast(getApiErrorMessage(error, "Could not load new arrivals."), "error");
      } finally {
        if (append) setLoadingMore(false);
        else if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadProducts({ nextPage: 1 });
  }, [loadProducts]);

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
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={products}
      keyExtractor={(item, index) => String(item?._id || item?.slug || index)}
      numColumns={2}
      columnWrapperStyle={styles.columnWrap}
      renderItem={({ item }) => (
        <View style={styles.productCell}>
          <ProductTile
            product={item}
            onPress={() => navigation.navigate("ProductDetails", { productId: item._id })}
            onAddToCart={() => handleQuickAdd(item)}
          />
        </View>
      )}
      ListHeaderComponent={
        <>
          <View style={styles.headerWrap}>
            <MobileHeader showBack />
          </View>

          <LinearGradient colors={["#FFFDF9", "#F7EADF", "#F3DDCF"]} style={styles.heroCard}>
            <Text style={styles.eyebrow}>Just In</Text>
            <Text style={styles.title}>New Arrivals</Text>
            <Text style={styles.subtitle}>
              The newest silhouettes from the website, now ready to browse inside the app.
            </Text>
          </LinearGradient>
        </>
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.accentStrong} size="large" />
            <Text style={styles.stateTitle}>Loading new arrivals</Text>
            <Text style={styles.stateText}>Pulling the latest products from the centralized backend.</Text>
          </View>
        ) : (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No new arrivals yet</Text>
            <Text style={styles.stateText}>Fresh styles will appear here as soon as they are published.</Text>
          </View>
        )
      }
      onRefresh={() => loadProducts({ nextPage: 1, isRefresh: true })}
      refreshing={refreshing}
      onEndReached={() => {
        if (!loadingMore && !loading && page < pages) {
          loadProducts({ nextPage: page + 1, append: true });
        }
      }}
      onEndReachedThreshold={0.45}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={colors.accentStrong} />
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  headerWrap: {
    marginBottom: spacing.md,
  },
  heroCard: {
    ...shadow,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 44,
    marginTop: 8,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  columnWrap: {
    gap: spacing.md,
    justifyContent: "space-between",
  },
  productCell: {
    flex: 1,
    marginBottom: spacing.md,
  },
  stateCard: {
    ...shadow,
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.xl,
  },
  stateTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 32,
    marginTop: spacing.md,
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
  footerLoader: {
    alignItems: "center",
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  footerSpacer: {
    height: spacing.md,
  },
});
