import { Link } from "react-router-dom";
import { useState } from "react";
import OrderTimeline from "../../components/profile/OrderTimeline";

export default function OrdersList({ orders, cancelOrder }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!orders?.length) {
    return <p className="text-sm text-gray-500">No orders found.</p>;
  }

  const handleCopy = async (text, orderId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      alert("Failed to copy");
    }
  };

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const orderNumber =
          order.orderId || `ORD-${String(order._id).slice(-8)}`;

        const canCancel =
          order.status === "Created" || order.status === "Confirmed";

        const statusStyle =
          order.status === "Delivered"
            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
            : order.status === "Cancelled"
            ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
            : order.status === "Shipped"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300";

        return (
          <div
            key={order._id}
            className="rounded-xl border bg-white shadow-sm dark:bg-zinc-800 dark:border-zinc-700"
          >
            {/* ================= Header ================= */}
            <div className="flex justify-between items-start p-5 border-b dark:border-zinc-700">
              <div>
                <p className="font-semibold dark:text-white">
                  Order #{orderNumber}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusStyle}`}
                >
                  {order.status}
                </span>
              </div>

              {canCancel && (
                <button
                  onClick={() => cancelOrder(order._id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* ================= Products ================= */}
            <div className="divide-y dark:divide-zinc-700">
              {order.orderItems?.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-5 items-start">
                  <Link to={`/product/${item.product}`} className="shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 rounded object-cover border"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png";
                      }}
                    />
                  </Link>

                  <div className="flex-1">
                    <Link
                      to={`/product/${item.product}`}
                      className="font-medium dark:text-white hover:underline"
                    >
                      {item.title}
                    </Link>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.color && <>Color: {item.color}</>}
                      {item.size && <> &nbsp;|&nbsp; Size: {item.size}</>}
                    </p>

                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                      Qty: {item.qty}
                    </p>
                  </div>

                  <div className="text-sm font-medium dark:text-white">
                    ₹{item.price * item.qty}
                  </div>
                </div>
              ))}
            </div>

            {/* ================= Footer ================= */}
            <div className="p-5 border-t dark:border-zinc-700 space-y-4">
              <div className="text-sm font-semibold dark:text-gray-200">
                Order Total: ₹{order.totalPrice}
              </div>

              <OrderTimeline order={order} />

              {/* Delivered */}
              {order.status === "Delivered" && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-300">
                  ✅ Order delivered successfully
                </div>
              )}

              {/* Tracking */}
              {order.status !== "Delivered" && order.tracking?.trackingId && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-zinc-900">
                  <p>
                    <b>Courier:</b> {order.tracking.courier}
                  </p>

                  <div className="flex items-center gap-2">
                    <b>Tracking No:</b>
                    <span className="font-mono">
                      {order.tracking.trackingId}
                    </span>

                    <button
                      onClick={() =>
                        handleCopy(
                          order.tracking.trackingId,
                          order._id
                        )
                      }
                      className="text-xs px-2 py-0.5 rounded border hover:bg-gray-100 dark:hover:bg-zinc-800"
                    >
                      {copiedId === order._id ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {order.tracking.trackingUrl && (
                    <a
                      href={order.tracking.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-blue-600 hover:underline"
                    >
                      Track Shipment →
                    </a>
                  )}
                </div>
              )}

              {!order.tracking?.trackingId &&
                order.status !== "Delivered" && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    📦 Tracking will be available once your order is shipped.
                  </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
