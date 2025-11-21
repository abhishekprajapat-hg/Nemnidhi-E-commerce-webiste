import React from "react";
import Badge from "../../ui/Badge";
import { Skeleton, Th, Td } from "../../ui/TableHelpers";

export default function RecentOrdersTable({ loading = false, recentOrders = [], onView = () => {} }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 dark:bg-zinc-700 dark:text-gray-400">
          <tr>
            <Th>ID</Th>
            <Th>Date</Th>
            <Th align="right">Total</Th>
            <Th>Status</Th>
            <Th>Customer</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
          {(loading ? Array.from({ length: 6 }) : recentOrders).map((o, idx) => (
            <tr key={o?._id || idx} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
              <Td>{loading ? <Skeleton w="w-24" /> : `#${String(o._id).slice(-6)}`}</Td>
              <Td>{loading ? <Skeleton w="w-28" /> : new Date(o.createdAt).toLocaleString()}</Td>
              <Td align="right">{loading ? <Skeleton w="w-16" /> : `₹${Number(o.totalPrice || 0).toFixed(2)}`}</Td>
              <Td>
                {loading ? (
                  <Skeleton w="w-16" />
                ) : (
                  <Badge
                    tone={
                      (o.status || "").toLowerCase() === "cancelled"
                        ? "red"
                        : o.isDelivered || (o.status || "").toLowerCase() === "delivered"
                        ? "green"
                        : "yellow"
                    }
                  >
                    {o.status || (o.isDelivered ? "Delivered" : "Created")}
                  </Badge>
                )}
              </Td>
              <Td>{loading ? <Skeleton w="w-24" /> : (o.shippingAddress?.fullName || o.user?.name || "—")}</Td>
              <Td align="right">
                {loading ? (
                  <Skeleton w="w-14" />
                ) : (
                  <button
                    onClick={() => onView(o._id)}
                    className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-700 hover:bg-gray-100"
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
