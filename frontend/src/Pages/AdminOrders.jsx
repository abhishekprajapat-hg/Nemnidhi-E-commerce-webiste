import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import useOrders from "../hooks/useOrders";
import OrdersFilters from "../components/admin/OrdersFilters";
import OrdersTable from "../components/admin/OrdersTable";
import { showToast } from "../utils/toast";

const DEBOUNCE_MS = 280;
const REFRESH_COOLDOWN_MS = 5000;

export default function AdminOrders() {
  const [appliedFilters, setAppliedFilters] = useState({
    q: "",
    status: "",
    page: 1,
    limit: 20,
    sort: "-createdAt",
  });
  const [draft, setDraft] = useState(appliedFilters);

  const debounceRef = useRef(null);
  const refreshCooldownRef = useRef(0);
  const mountedRef = useRef(true);

  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { orders, loading, facets, pageInfo, refresh } = useOrders(appliedFilters);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    setDraft(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedFilters((prev) => ({
        ...prev,
        ...draft,
        page: prev.page === draft.page ? draft.page : 1,
      }));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft]);

  const onFiltersChange = useCallback((next) => {
    setDraft((prev) => ({ ...prev, ...next }));
  }, []);

  const applyFiltersNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAppliedFilters((prev) => ({ ...prev, ...draft, page: 1 }));
  }, [draft]);

  const handlePageChange = useCallback((newPage) => {
    setAppliedFilters((prev) => ({ ...prev, page: newPage }));
    setDraft((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (refreshCooldownRef.current && now - refreshCooldownRef.current < REFRESH_COOLDOWN_MS) {
      showToast("Please wait before refreshing again", "info");
      return;
    }

    refreshCooldownRef.current = now;
    setIsRefreshing(true);
    try {
      await refresh();
      if (!mountedRef.current) return;
      setLastRefreshedAt(new Date());
      showToast("Orders refreshed");
    } catch (err) {
      showToast(err?.message || "Failed to refresh orders", "error");
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
      setTimeout(() => {
        refreshCooldownRef.current = 0;
      }, REFRESH_COOLDOWN_MS);
    }
  }, [refresh]);

  const filtersSummary = useMemo(() => {
    const parts = [];
    if (appliedFilters.q) parts.push(`q="${appliedFilters.q}"`);
    if (appliedFilters.status) parts.push(`status=${appliedFilters.status}`);
    parts.push(`page=${appliedFilters.page}`);
    return parts.join(" | ");
  }, [appliedFilters]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <OrdersFilters
          value={draft}
          onChange={onFiltersChange}
          facets={facets}
          onApply={applyFiltersNow}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--nm-muted)]">{filtersSummary}</p>

          <div className="flex items-center gap-3">
            {lastRefreshedAt && (
              <p className="text-xs text-[var(--nm-muted)]">
                Last: {lastRefreshedAt.toLocaleTimeString()}
              </p>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <OrdersTable
          orders={orders}
          loading={loading}
          pageInfo={pageInfo}
          onPageChange={handlePageChange}
        />
      </div>
    </AdminLayout>
  );
}
