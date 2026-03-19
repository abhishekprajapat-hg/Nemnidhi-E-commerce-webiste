import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
  { label: "Title A-Z", value: "title" },
  { label: "Title Z-A", value: "-title" },
];

const RATING_OPTIONS = [
  { label: "Any", value: "" },
  { label: "4+", value: "4" },
  { label: "3+", value: "3" },
  { label: "2+", value: "2" },
  { label: "1+", value: "1" },
];

const DEFAULT_CATEGORY_OPTIONS = [
  { label: "All", value: "" },
  { label: "Sarees", value: "saree" },
  { label: "Lehengas", value: "lehengas" },
  { label: "Western", value: "western" },
  { label: "Tops", value: "tops" },
];

const MAX_FACET_SCAN_PAGES = 8;

function toSlug(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function sortStrings(values = []) {
  return [...values].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
  );
}

function toggleListValue(list = [], value = "") {
  if (!value) return list;
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

function collectFacetValues(products = [], brandSet, colorSet, sizeSet) {
  const addSafe = (setRef, value) => {
    const text = String(value || "").trim();
    if (text) setRef.add(text);
  };

  products.forEach((product) => {
    addSafe(brandSet, product?.brand);

    if (Array.isArray(product?.aggColors)) {
      product.aggColors.forEach((entry) => addSafe(colorSet, entry));
    }
    if (Array.isArray(product?.aggSizes)) {
      product.aggSizes.forEach((entry) => addSafe(sizeSet, entry));
    }

    if (Array.isArray(product?.variants)) {
      product.variants.forEach((variant) => {
        addSafe(colorSet, variant?.color);
        if (Array.isArray(variant?.sizes)) {
          variant.sizes.forEach((sizeEntry) => addSafe(sizeSet, sizeEntry?.size));
        }
      });
    }
  });
}

function normalizeCategoryOption(category) {
  if (!category) return null;

  if (typeof category === "string") {
    const value = toSlug(category);
    if (!value) return null;

    return {
      label: category,
      value,
    };
  }

  const label = String(category?.name || category?.title || category?.slug || "").trim();
  const value = String(category?.slug || toSlug(label)).trim();
  if (!label || !value) return null;

  return {
    label,
    value,
  };
}

function resolveCategoryValue(rawValue = "", options = []) {
  const incoming = String(rawValue || "").trim();
  if (!incoming) return "";

  const normalizedIncoming = toSlug(incoming);
  const match = options.find((option) => {
    const label = String(option?.label || "").trim();
    const value = String(option?.value || "").trim();

    return (
      incoming === value ||
      incoming === label ||
      normalizedIncoming === value ||
      normalizedIncoming === toSlug(label)
    );
  });

  return match?.value || normalizedIncoming || incoming;
}

function buildSortParams(sort = "-createdAt") {
  const sortValue = String(sort || "").trim();
  if (!sortValue) return {};

  const isDesc = sortValue.startsWith("-");
  const cleanSort = isDesc ? sortValue.slice(1) : sortValue;

  return {
    sort: sortValue,
    sortBy: cleanSort === "price" ? "price" : cleanSort,
    order: isDesc ? "desc" : "asc",
  };
}

export default function ProductsScreen({ navigation, route }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [categories, setCategories] = useState(DEFAULT_CATEGORY_OPTIONS);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState(() =>
    resolveCategoryValue(route.params?.category || "", DEFAULT_CATEGORY_OPTIONS)
  );
  const [sort, setSort] = useState("-createdAt");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [facetOptions, setFacetOptions] = useState({
    brands: [],
    colors: [],
    sizes: [],
  });
  const [facetLoading, setFacetLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (route.params?.category !== undefined) {
      setCategory(resolveCategoryValue(route.params?.category || "", categories));
      setPage(1);
    }
  }, [categories, route.params?.category]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const homepageResponse = await api.get("/api/content/homepage").catch(() => null);
        const homepageCategories = Array.isArray(homepageResponse?.data?.categories)
          ? homepageResponse.data.categories.map(normalizeCategoryOption).filter(Boolean)
          : [];

        if (homepageCategories.length) {
          if (!active) return;
          setCategories([
            { label: "All", value: "" },
            ...homepageCategories,
          ]);
          return;
        }
      } catch {
        // continue to products fallback
      }

      try {
        const { data } = await api.get("/api/products/categories");
        if (!active) return;

        const nextCategories = (Array.isArray(data) ? data : data?.categories || [])
          .map(normalizeCategoryOption)
          .filter(Boolean);

        setCategories([
          { label: "All", value: "" },
          ...nextCategories,
        ]);
      } catch {
        if (active) {
          setCategories(DEFAULT_CATEGORY_OPTIONS);
        }
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setCategory((current) => resolveCategoryValue(current, categories));
  }, [categories]);

  useEffect(() => {
    if (!showAdvancedFilters) return undefined;

    let active = true;
    const controller = new AbortController();

    async function loadFacetOptions() {
      setFacetLoading(true);
      try {
        const brandSet = new Set();
        const colorSet = new Set();
        const sizeSet = new Set();

        let nextPage = 1;
        let totalPages = 1;

        while (active && nextPage <= totalPages && nextPage <= MAX_FACET_SCAN_PAGES) {
          const params = {
            page: nextPage,
            limit: 100,
            sort: "title",
            sortBy: "title",
            order: "asc",
          };

          const { data } = await api.get("/api/products", {
            params,
            signal: controller.signal,
          });

          const list = Array.isArray(data) ? data : data?.products || [];
          collectFacetValues(list, brandSet, colorSet, sizeSet);

          totalPages = Math.max(1, Number(data?.pages || 1));
          nextPage += 1;
        }

        if (!active) return;

        setFacetOptions({
          brands: sortStrings(Array.from(brandSet)),
          colors: sortStrings(Array.from(colorSet)),
          sizes: sortStrings(Array.from(sizeSet)),
        });
      } catch (error) {
        if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
          console.error("Could not preload filter options", error);
        }
      } finally {
        if (active) setFacetLoading(false);
      }
    }

    loadFacetOptions();

    return () => {
      active = false;
      controller.abort();
    };
  }, [showAdvancedFilters]);

  const loadProducts = useCallback(
    async ({ nextPage = 1, append = false, isRefresh = false } = {}) => {
      if (append) setLoadingMore(true);
      else if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = {
          page: nextPage,
          limit: 12,
          ...buildSortParams(sort),
        };

        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (category) params.category = category;
        if (minPrice.trim()) params.minPrice = minPrice.trim();
        if (maxPrice.trim()) params.maxPrice = maxPrice.trim();
        if (minRating) params.minRating = minRating;
        if (inStockOnly) params.inStock = "1";
        if (selectedBrands.length) params.brands = selectedBrands.join(",");
        if (selectedColors.length) params.colors = selectedColors.join(",");
        if (selectedSizes.length) params.sizes = selectedSizes.join(",");

        const { data } = await api.get("/api/products", { params });
        const nextProducts = Array.isArray(data) ? data : data?.products || [];

        setProducts((current) =>
          append ? [...current, ...nextProducts] : nextProducts
        );
        setPage(Number(data?.page || nextPage));
        setPages(Number(data?.pages || 1));

        setFacetOptions((current) => {
          const brandSet = new Set(current.brands);
          const colorSet = new Set(current.colors);
          const sizeSet = new Set(current.sizes);

          collectFacetValues(nextProducts, brandSet, colorSet, sizeSet);

          return {
            brands: sortStrings(Array.from(brandSet)),
            colors: sortStrings(Array.from(colorSet)),
            sizes: sortStrings(Array.from(sizeSet)),
          };
        });
      } catch (error) {
        if (!append) setProducts([]);
        showToast(getApiErrorMessage(error, "Could not load products."), "error");
      } finally {
        if (append) setLoadingMore(false);
        else if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [
      category,
      inStockOnly,
      maxPrice,
      minPrice,
      minRating,
      searchQuery,
      selectedBrands,
      selectedColors,
      selectedSizes,
      showToast,
      sort,
    ]
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

  const selectedCategoryLabel = useMemo(() => {
    const match = categories.find((entry) => entry.value === category);
    return match?.label || (category ? category.replace(/-/g, " ") : "All Products");
  }, [categories, category]);

  const combinedFacetOptions = useMemo(() => {
    const brandSet = new Set(facetOptions.brands);
    const colorSet = new Set(facetOptions.colors);
    const sizeSet = new Set(facetOptions.sizes);

    collectFacetValues(products, brandSet, colorSet, sizeSet);
    selectedBrands.forEach((entry) => brandSet.add(entry));
    selectedColors.forEach((entry) => colorSet.add(entry));
    selectedSizes.forEach((entry) => sizeSet.add(entry));

    return {
      brands: sortStrings(Array.from(brandSet)),
      colors: sortStrings(Array.from(colorSet)),
      sizes: sortStrings(Array.from(sizeSet)),
    };
  }, [facetOptions, products, selectedBrands, selectedColors, selectedSizes]);

  const advancedFilterCount = useMemo(
    () =>
      (minPrice ? 1 : 0) +
      (maxPrice ? 1 : 0) +
      (minRating ? 1 : 0) +
      (inStockOnly ? 1 : 0) +
      selectedBrands.length +
      selectedColors.length +
      selectedSizes.length,
    [
      inStockOnly,
      maxPrice,
      minPrice,
      minRating,
      selectedBrands.length,
      selectedColors.length,
      selectedSizes.length,
    ]
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (minPrice) chips.push({ type: "minPrice", value: minPrice, label: `Min Rs ${minPrice}` });
    if (maxPrice) chips.push({ type: "maxPrice", value: maxPrice, label: `Max Rs ${maxPrice}` });
    if (minRating) chips.push({ type: "minRating", value: minRating, label: `${minRating}+ stars` });
    if (inStockOnly) chips.push({ type: "stock", value: "1", label: "In Stock" });
    selectedBrands.forEach((entry) =>
      chips.push({ type: "brand", value: entry, label: `Brand: ${entry}` })
    );
    selectedColors.forEach((entry) =>
      chips.push({ type: "color", value: entry, label: `Color: ${entry}` })
    );
    selectedSizes.forEach((entry) =>
      chips.push({ type: "size", value: entry, label: `Size: ${entry}` })
    );

    return chips;
  }, [inStockOnly, maxPrice, minPrice, minRating, selectedBrands, selectedColors, selectedSizes]);

  const clearAdvancedFilters = useCallback(() => {
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setInStockOnly(false);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPage(1);
  }, []);

  const removeFilterChip = useCallback((chip) => {
    switch (chip.type) {
      case "minPrice":
        setMinPrice("");
        break;
      case "maxPrice":
        setMaxPrice("");
        break;
      case "minRating":
        setMinRating("");
        break;
      case "stock":
        setInStockOnly(false);
        break;
      case "brand":
        setSelectedBrands((current) => current.filter((entry) => entry !== chip.value));
        break;
      case "color":
        setSelectedColors((current) => current.filter((entry) => entry !== chip.value));
        break;
      case "size":
        setSelectedSizes((current) => current.filter((entry) => entry !== chip.value));
        break;
      default:
        break;
    }

    setPage(1);
  }, []);

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <View style={styles.searchCard}>
          <Text style={styles.eyebrow}>Catalogue</Text>
          <Text style={styles.title}>{selectedCategoryLabel || "All Products"}</Text>
          <Text style={styles.subtitle}>
            Refined pieces across festive and everyday silhouettes.
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={() => {
                setSearchQuery(searchInput.trim());
                setPage(1);
              }}
              placeholder="Search products"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <Pressable
              onPress={() => {
                setSearchQuery(searchInput.trim());
                setPage(1);
              }}
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
              const active = entry.value === category;
              return (
                <Pressable
                  key={entry.value || entry.label}
                  onPress={() => {
                    setCategory(entry.value);
                    setPage(1);
                  }}
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? styles.chipTextActive : null,
                    ]}
                  >
                    {entry.label}
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
                  onPress={() => {
                    setSort(option.value);
                    setPage(1);
                  }}
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

          <View style={styles.filterToggleRow}>
            <Pressable
              onPress={() => setShowAdvancedFilters((current) => !current)}
              style={[
                styles.filterToggleButton,
                showAdvancedFilters ? styles.filterToggleButtonActive : null,
              ]}
            >
              <Text
                style={[
                  styles.filterToggleText,
                  showAdvancedFilters ? styles.filterToggleTextActive : null,
                ]}
              >
                Filters{advancedFilterCount ? ` (${advancedFilterCount})` : ""}
              </Text>
            </Pressable>
            {advancedFilterCount ? (
              <Pressable onPress={clearAdvancedFilters} style={styles.filterClearButton}>
                <Text style={styles.filterClearText}>Clear All</Text>
              </Pressable>
            ) : null}
          </View>

          {showAdvancedFilters ? (
            <View style={styles.advancedFiltersCard}>
              <View style={styles.priceInputsRow}>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.filterSectionLabel}>Min Price</Text>
                  <TextInput
                    value={minPrice}
                    onChangeText={(value) => {
                      setMinPrice(value.replace(/[^0-9]/g, ""));
                      setPage(1);
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    style={styles.priceInput}
                  />
                </View>

                <View style={styles.priceInputWrap}>
                  <Text style={styles.filterSectionLabel}>Max Price</Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={(value) => {
                      setMaxPrice(value.replace(/[^0-9]/g, ""));
                      setPage(1);
                    }}
                    keyboardType="number-pad"
                    placeholder="5000"
                    placeholderTextColor={colors.muted}
                    style={styles.priceInput}
                  />
                </View>
              </View>

              <View style={styles.ratingBlock}>
                <Text style={styles.filterSectionLabel}>Minimum Rating</Text>
                <View style={styles.filterOptionWrap}>
                  {RATING_OPTIONS.map((entry) => {
                    const active = entry.value === minRating;
                    return (
                      <Pressable
                        key={entry.label}
                        onPress={() => {
                          setMinRating(entry.value);
                          setPage(1);
                        }}
                        style={[
                          styles.filterOptionChip,
                          active ? styles.filterOptionChipActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            active ? styles.filterOptionTextActive : null,
                          ]}
                        >
                          {entry.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.stockRow}>
                <View>
                  <Text style={styles.filterSectionLabel}>Availability</Text>
                  <Text style={styles.filterSectionHint}>Only show products ready to buy.</Text>
                </View>
                <Switch
                  value={inStockOnly}
                  onValueChange={(value) => {
                    setInStockOnly(value);
                    setPage(1);
                  }}
                  trackColor={{ false: "#D8C8BB", true: colors.accentSoft }}
                  thumbColor={inStockOnly ? colors.accentStrong : colors.card}
                />
              </View>

              <FilterSection
                title="Brands"
                loading={facetLoading}
                options={combinedFacetOptions.brands}
                selected={selectedBrands}
                onToggle={(value) => {
                  setSelectedBrands((current) => toggleListValue(current, value));
                  setPage(1);
                }}
              />
              <FilterSection
                title="Colors"
                loading={facetLoading}
                options={combinedFacetOptions.colors}
                selected={selectedColors}
                onToggle={(value) => {
                  setSelectedColors((current) => toggleListValue(current, value));
                  setPage(1);
                }}
              />
              <FilterSection
                title="Sizes"
                loading={facetLoading}
                options={combinedFacetOptions.sizes}
                selected={selectedSizes}
                onToggle={(value) => {
                  setSelectedSizes((current) => toggleListValue(current, value));
                  setPage(1);
                }}
              />
            </View>
          ) : null}

          {activeFilterChips.length ? (
            <View style={styles.activeChipWrap}>
              {activeFilterChips.map((chip) => (
                <Pressable
                  key={`${chip.type}-${chip.value}`}
                  onPress={() => removeFilterChip(chip)}
                  style={styles.activeChip}
                >
                  <Text style={styles.activeChipText}>{chip.label}</Text>
                  <Text style={styles.activeChipText}>x</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    ),
    [
      activeFilterChips,
      advancedFilterCount,
      categories,
      category,
      clearAdvancedFilters,
      combinedFacetOptions.brands,
      combinedFacetOptions.colors,
      combinedFacetOptions.sizes,
      facetLoading,
      inStockOnly,
      maxPrice,
      minPrice,
      minRating,
      removeFilterChip,
      searchInput,
      selectedBrands,
      selectedCategoryLabel,
      selectedColors,
      selectedSizes,
      showAdvancedFilters,
      sort,
    ]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeaderShell}>
        <MobileHeader />
      </View>

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
    </View>
  );
}

function FilterSection({ title, options = [], selected = [], onToggle, loading = false }) {
  return (
    <View style={styles.filterSectionBlock}>
      <Text style={styles.filterSectionLabel}>{title}</Text>
      {loading && options.length === 0 ? (
        <Text style={styles.filterSectionHint}>Loading options...</Text>
      ) : options.length ? (
        <View style={styles.filterOptionWrap}>
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <Pressable
                key={option}
                onPress={() => onToggle(option)}
                style={[
                  styles.filterOptionChip,
                  active ? styles.filterOptionChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    active ? styles.filterOptionTextActive : null,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.filterSectionHint}>No options available.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  stickyHeaderShell: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    zIndex: 5,
  },
  listContent: {
    backgroundColor: colors.background,
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
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
  filterToggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  filterToggleButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterToggleButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  filterToggleText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  filterToggleTextActive: {
    color: colors.accentStrong,
  },
  filterClearButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  filterClearText: {
    color: colors.accentStrong,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  advancedFiltersCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  priceInputsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  priceInputWrap: {
    flex: 1,
  },
  priceInput: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.body,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ratingBlock: {
    gap: 10,
  },
  stockRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterSectionBlock: {
    gap: 10,
  },
  filterSectionLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  filterSectionHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  filterOptionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterOptionChip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterOptionChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterOptionText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  filterOptionTextActive: {
    color: colors.white,
  },
  activeChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.lg,
  },
  activeChip: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeChipText: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
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
