// /src/Pages/AdminOrders.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import useOrders from "../hooks/useOrders";
import OrdersFilters from "../components/admin/OrdersFilters";
import OrdersTable from "../components/admin/OrdersTable";
import { showToast } from "../utils/toast";

/**
 * AdminOrders (optimized)
 *
 * - Local draft filters to allow immediate UI feedback
 * - Debounced apply of draft -> applied filters (reduces network calls while typing)
 * - Stable callbacks (useCallback) to minimize re-renders downstream
 * - Refresh cooldown to prevent spamming backend
 */

const DEBOUNCE_MS = 280;
const REFRESH_COOLDOWN_MS = 5000;

export default function AdminOrders() {
  // the filters that are actually sent to useOrders
  const [appliedFilters, setAppliedFilters] = useState({
    q: "",
    status: "",
    page: 1,
    limit: 20,
    sort: "-createdAt",
  });

  // local UI draft (fast updates)
  const [draft, setDraft] = useState(appliedFilters);

  // debounce timer ref
  const debounceRef = useRef(null);
  // refresh throttle ref
  const refreshCooldownRef = useRef(0);
  const mountedRef = useRef(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // hook that fetches data based on appliedFilters
  const { orders, loading, facets, pageInfo, refresh } = useOrders(appliedFilters);

  // whenever appliedFilters change, update draft too (keeps UI consistent when page changes externally)
  useEffect(() => {
    setDraft(appliedFilters);
  }, [appliedFilters]);

  // Debounced apply: when draft changes (e.g. typing in search), wait and apply
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // reset page to 1 on new query / filter changes other than page
      setAppliedFilters((prev) => {
        const next = { ...prev, ...draft, page: prev.page === draft.page ? draft.page : 1 };
        // If page changed intentionally (from pagination), keep it
        return next;
      });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // only watch draft keys that represent filter inputs
  }, [draft.q, draft.status, draft.limit, draft.sort, draft.page, draft]); // kept draft included for stability

  // safe wrapper for on-change from OrdersFilters component — updates draft (fast UI)
  const onFiltersChange = useCallback((next) => {
    setDraft((d) => ({ ...d, ...next }));
  }, []);

  // explicit "Apply" if OrdersFilters provides it (useful if you want instant apply)
  const applyFiltersNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAppliedFilters((prev) => ({ ...prev, ...draft, page: 1 }));
  }, [draft]);

  // handle page changes coming from OrdersTable pagination
  const handlePageChange = useCallback((newPage) => {
    setAppliedFilters((prev) => ({ ...prev, page: newPage }));
    // reflect into draft too, so the UI stays in sync
    setDraft((d) => ({ ...d, page: newPage }));
  }, []);

  // refresh wrapper with cooldown to avoid spam
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (refreshCooldownRef.current && now - refreshCooldownRef.current < REFRESH_COOLDOWN_MS) {
      showToast("Please wait before refreshing again", "info");
      return;
    }
    refreshCooldownRef.current = now;
    setIsRefreshing(true);
    try {
      await refresh(); // useOrders.refresh expected to re-fetch
      if (!mountedRef.current) return;
      setLastRefreshedAt(new Date());
      showToast("Orders refreshed");
    } catch (err) {
      showToast(err?.message || "Failed to refresh orders", "error");
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
      // small cooldown timer reset
      setTimeout(() => {
        refreshCooldownRef.current = 0;
      }, REFRESH_COOLDOWN_MS);
    }
  }, [refresh]);

  // derived small memoized values for faster rendering
  const filtersSummary = useMemo(() => {
    const parts = [];
    if (appliedFilters.q) parts.push(`q="${appliedFilters.q}"`);
    if (appliedFilters.status) parts.push(`status=${appliedFilters.status}`);
    parts.push(`page=${appliedFilters.page}`);
    return parts.join(" • ");
  }, [appliedFilters]);

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <OrdersFilters
            value={draft}
            onChange={onFiltersChange}
            facets={facets}
            onApply={applyFiltersNow}
          />

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">{filtersSummary}</div>

            <div className="flex items-center gap-3">
              {lastRefreshedAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                  Last: {lastRefreshedAt.toLocaleTimeString()}
                </div>
              )}

              <button
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className={`px-3 py-1 rounded text-sm ${
                  loading || isRefreshing
                    ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:opacity-90"
                }`}
                title="Refresh orders"
              >
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <OrdersTable
              orders={orders}
              loading={loading}
              pageInfo={pageInfo}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
