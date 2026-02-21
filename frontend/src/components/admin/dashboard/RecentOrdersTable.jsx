import React from "react";
import Badge from "../../ui/Badge";
import { Skeleton, Th, Td } from "../../ui/TableHelpers";

const getStatusTone = (order) => {
  const status = String(order?.status || "").toLowerCase();
  if (status === "cancelled") return "red";
  if (order?.isDelivered || status === "delivered") return "green";
  return "amber";
};

const formatDateTime = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

export default function RecentOrdersTable({ loading = false, recentOrders = [], onView = () => {} }) {
  const rows = loading ? Array.from({ length: 6 }) : recentOrders;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)]">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-[var(--nm-border)] bg-[var(--nm-bg-elevated)]/70">
          <tr>
            <Th>ID</Th>
            <Th>Date</Th>
            <Th align="right">Total</Th>
            <Th>Status</Th>
            <Th>Customer</Th>
            <Th align="right">Action</Th>
          </tr>
        </thead>

        <tbody>
          {rows.map((order, idx) => (
            <tr
              key={order?._id || idx}
              className="border-b border-[var(--nm-border)]/70 last:border-b-0 transition hover:bg-[var(--nm-accent-soft)]/25"
            >
              <Td>{loading ? <Skeleton w="w-24" /> : `#${String(order._id).slice(-6)}`}</Td>
              <Td>{loading ? <Skeleton w="w-28" /> : formatDateTime(order.createdAt)}</Td>
              <Td align="right">{loading ? <Skeleton w="w-20" /> : `Rs ${Number(order.totalPrice || 0).toFixed(2)}`}</Td>
              <Td>
                {loading ? (
                  <Skeleton w="w-20" h="h-6" rounded />
                ) : (
                  <Badge tone={getStatusTone(order)}>
                    {order.status || (order.isDelivered ? "Delivered" : "Created")}
                  </Badge>
                )}
              </Td>
              <Td>{loading ? <Skeleton w="w-24" /> : (order.shippingAddress?.fullName || order.user?.name || "-")}</Td>
              <Td align="right">
                {loading ? (
                  <Skeleton w="w-14" />
                ) : (
                  <button
                    onClick={() => onView(order._id)}
                    className="rounded-full border border-[var(--nm-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
                  >
                    View
                  </button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
