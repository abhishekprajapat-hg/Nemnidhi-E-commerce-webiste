import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge, Th, Td, Skeleton, PaginationControls } from "../ui/atoms";

const shortId = (id) => {
  try {
    return `#${String(id).slice(-6)}`;
  } catch {
    return "--";
  }
};

function OrdersTableInner({ orders = [], loading = false, pageInfo = {}, onPageChange }) {
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
    []
  );

  const displayedCountText = useMemo(
    () => `Showing ${Array.isArray(orders) ? orders.length : 0} of ${pageInfo?.total || 0}`,
    [orders, pageInfo?.total]
  );

  const rows = useMemo(() => {
    if (loading) {
      return Array.from({ length: 10 }).map((_, i) => (
        <tr key={`skeleton-${i}`} className="animate-pulse">
          <Td><Skeleton w="w-16" /></Td>
          <Td><Skeleton w="w-32" /></Td>
          <Td align="right"><Skeleton w="w-12" /></Td>
          <Td><Skeleton w="w-16" /></Td>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-28" /></Td>
          <Td><Skeleton w="w-10" /></Td>
        </tr>
      ));
    }

    if (!orders || orders.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="p-10 text-center text-sm text-[var(--nm-muted)]">
            No orders found for these filters.
          </td>
        </tr>
      );
    }

    return orders.map((order) => {
      const id = order?._id || "";
      const created = order?.createdAt ? new Date(order.createdAt) : null;
      const total = Number(order?.totalPrice || 0);
      const tone =
        (order?.status || "").toLowerCase() === "cancelled"
          ? "red"
          : order?.isDelivered || (order?.status || "").toLowerCase() === "delivered"
            ? "green"
            : "yellow";

      return (
        <tr key={id || Math.random()} className="transition hover:bg-[var(--nm-bg-elevated)]/60">
          <Td>
            {id ? (
              <Link
                to={`/admin/order/${id}`}
                className="font-semibold text-[var(--nm-accent-strong)] hover:underline"
              >
                {shortId(id)}
              </Link>
            ) : (
              "--"
            )}
          </Td>

          <Td>{order?.user?.email || order?.shippingAddress?.fullName || "--"}</Td>
          <Td align="right">{currencyFormatter.format(total).replace(/\u00A0/, " ")}</Td>
          <Td>{order?.paymentMethod || "--"}</Td>
          <Td>
            <Badge tone={tone}>{order?.status || (order?.isDelivered ? "Delivered" : "Created")}</Badge>
          </Td>
          <Td>{created ? created.toLocaleString() : "--"}</Td>
          <Td className="text-center">
            {id ? (
              <Link
                to={`/admin/order/${id}`}
                className="font-semibold text-[var(--nm-accent-strong)] hover:underline"
              >
                View
              </Link>
            ) : (
              "--"
            )}
          </Td>
        </tr>
      );
    });
  }, [orders, loading, currencyFormatter]);

  return (
    <div className="flex-1">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="text-sm text-[var(--nm-muted)]">{displayedCountText}</div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--nm-surface)] text-[var(--nm-muted)]">
            <tr>
              <Th>Order ID</Th>
              <Th>Customer</Th>
              <Th align="right">Total</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--nm-border)]">{rows}</tbody>
        </table>
      </div>

      {!loading && pageInfo?.pages > 1 && (
        <PaginationControls
          currentPage={pageInfo.page}
          totalPages={pageInfo.pages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default React.memo(OrdersTableInner);
