import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function OrdersList({ orders, cancelOrder }) {
  const navigate = useNavigate();

  const goToFirstProduct = (order) => {
    const first = order?.orderItems?.[0];
    if (!first?.product) return;
    navigate(`/product/${first.product}`);
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      {orders.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          You have no orders yet —{" "}
          <Link to="/products" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const created = new Date(order.createdAt).toLocaleString();
            const total = Number(order.totalPrice || 0).toFixed(2);
            const isCancellable = !order.isDelivered && order.status !== "Cancelled";
            const items = order.orderItems || [];
            const first = items[0];
            const titles = items.map((i) => i.title).filter(Boolean);
            const shown = titles.slice(0, 3);
            const more = Math.max(0, titles.length - shown.length);

            return (
              <div
                key={order._id}
                role="button"
                onClick={() => goToFirstProduct(order)}
                className="group border rounded-lg p-4 hover:shadow-md cursor-pointer transition dark:border-zinc-700 dark:hover:bg-zinc-700/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Order #{order._id.slice(-8)}
                    </div>
                    <div className="font-medium dark:text-white">{created}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                      Total: ₹{total}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        order.status === "Cancelled"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                          : order.isDelivered
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300"
                      }`}
                    >
                      {order.status || (order.isDelivered ? "Delivered" : "Processing")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelOrder(order._id);
                      }}
                      disabled={!isCancellable}
                      className={`text-sm px-3 py-1 rounded border ${
                        isCancellable
                          ? "text-red-600 bg-white hover:bg-red-50 dark:bg-zinc-800 dark:text-red-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
                          : "text-gray-400 bg-gray-50 cursor-not-allowed dark:bg-zinc-700 dark:text-gray-500 dark:border-zinc-700"
                      }`}
                      title={isCancellable ? "Cancel order" : "Cannot cancel"}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  {first?.image ? (
                    <div className="w-14 h-14 rounded bg-gray-100 dark:bg-zinc-700 overflow-hidden shrink-0">
                      <img
                        src={first.image}
                        alt={first.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder.png";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded bg-gray-100 dark:bg-zinc-700 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Items</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {shown.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300"
                        >
                          {t}
                        </span>
                      ))}
                      {more > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300">
                          +{more} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
