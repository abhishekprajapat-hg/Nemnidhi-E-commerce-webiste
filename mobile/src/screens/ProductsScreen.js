import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import api, { getApiErrorMessage } from "../api/client";
import MobileHeader from "../components/MobileHeader";
import ProductTile from "../components/ProductTile";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { buildQuickAddPayload } from "../utils/product";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";

const SORT_OPTIONS = [
  { label: "Newest", value: "-createdAt" },
  { label: "Price Low", value: "price" },
  { label: "Price High", value: "-price" },
];

export default function ProductsScreen({ navigation, route }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [categories, setCategories] = useState(["All"]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState(route.params?.category || "");
  const [sort, setSort] = useState("-createdAt");
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (route.params?.category !== undefined) {
      setCategory(route.params?.category || "");
    }
  }, [route.params?.category]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const { data } = await api.get("/api/products/categories");
        if (!active) return;

        const nextCategories = Array.isArray(data)
          ? data.filter(Boolean)
          : data?.categories || [];
        setCategories(["All", ...nextCategories]);
      } catch {
        if (active) {
          setCategories(["All", "Sarees", "Lehengas", "Western", "Tops"]);
        }
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const loadProducts = useCallback(
    async ({ nextPage = 1, append = false, isRefresh = false } = {}) => {
      if (append) setLoadingMore(true);
      else if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = {
          page: nextPage,
          limit: 12,
          sort,
        };

        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (category) params.category = category;

        const { data } = await api.get("/api/products", { params });
        const nextProducts = Array.isArray(data) ? data : data?.products || [];

        setProducts((current) =>
          append ? [...current, ...nextProducts] : nextProducts
        );
        setPage(Number(data?.page || nextPage));
        setPages(Number(data?.pages || 1));
      } catch (error) {
        if (!append) setProducts([]);
        showToast(getApiErrorMessage(error, "Could not load products."), "error");
      } finally {
        if (append) setLoadingMore(false);
        else if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [category, searchQuery, showToast, sort]
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

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <MobileHeader />
        <View style={styles.searchCard}>
          <Text style={styles.eyebrow}>Catalogue</Text>
          <Text style={styles.title}>{category || "All Products"}</Text>
          <Text style={styles.subtitle}>
            Refined pieces across festive and everyday silhouettes.
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={() => setSearchQuery(searchInput.trim())}
              placeholder="Search products"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <Pressable
              onPress={() => setSearchQuery(searchInput.trim())}
              style={styles.searchButton}
            >
              <Text style={styles.searchButtonText}>Go</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {categories.map((entry) => {
              const active = (entry === "All" ? "" : entry) === category;
              return (
                <Pressable
                  key={entry}
                  onPress={() => setCategory(entry === "All" ? "" : entry)}
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? styles.chipTextActive : null,
                    ]}
                  >
                    {entry}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortRow}
          >
            {SORT_OPTIONS.map((option) => {
              const active = option.value === sort;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSort(option.value)}
                  style={[styles.sortChip, active ? styles.sortChipActive : null]}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      active ? styles.sortChipTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    ),
    [categories, category, searchInput, sort]
  );

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      numColumns={2}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrap}
      ListHeaderComponent={header}
      ListEmptyComponent={
        loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={colors.accentStrong} size="large" />
          </View>
        ) : (
          <View style={styles.stateWrap}>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>
              Try a different search or switch back to all categories.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <View style={styles.productCell}>
          <ProductTile
            product={item}
            onPress={() =>
              navigation.navigate("ProductDetails", { productId: item._id })
            }
            onAddToCart={() => handleQuickAdd(item)}
          />
        </View>
      )}
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
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    backgroundColor: colors.background,
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  headerWrap: {
    marginBottom: spacing.lg,
  },
  searchCard: {
    ...shadow,
    backgroundColor: colors.card,
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
    lineHeight: 22,
    marginTop: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: spacing.lg,
  },
  searchInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.body,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    justifyContent: "center",
    minWidth: 56,
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  chipsRow: {
    gap: 10,
    marginTop: spacing.lg,
    paddingRight: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.white,
  },
  sortRow: {
    gap: 10,
    marginTop: spacing.md,
    paddingRight: spacing.sm,
  },
  sortChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  sortChipActive: {
    backgroundColor: "#F0CBB4",
  },
  sortChipText: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  sortChipTextActive: {
    color: colors.text,
  },
  columnWrap: {
    gap: spacing.md,
  },
  productCell: {
    flex: 1,
    marginBottom: spacing.md,
  },
  stateWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  footerLoader: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  footerSpacer: {
    height: spacing.md,
  },
});
