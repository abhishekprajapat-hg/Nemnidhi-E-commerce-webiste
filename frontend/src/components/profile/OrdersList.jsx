import { Link } from "react-router-dom";
import { useState } from "react";
import OrderTimeline from "../../components/profile/OrderTimeline";

export default function OrdersList({ orders, cancelOrder }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!orders?.length) {
    return (
      <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-10 text-center text-sm text-[var(--nm-muted)]">
        No orders found.
      </div>
    );
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
    <div className="space-y-4">
      {orders.map((order) => {
        const orderNumber = order.orderId || `ORD-${String(order._id).slice(-8)}`;
        const canCancel = order.status === "Created" || order.status === "Confirmed";

        const statusStyle =
          order.status === "Delivered"
            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
            : order.status === "Cancelled"
              ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
              : order.status === "Shipped"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";

        return (
          <article
            key={order._id}
            className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)]"
          >
            <header className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--nm-border)] p-5">
              <div>
                <p className="text-sm font-semibold">Order #{orderNumber}</p>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${statusStyle}`}>
                  {order.status}
                </span>
              </div>

              {canCancel && (
                <button
                  onClick={() => cancelOrder(order._id)}
                  className="text-xs font-semibold uppercase tracking-[0.1em] text-red-600 hover:underline"
                >
                  Cancel
                </button>
              )}
            </header>

            <div className="divide-y divide-[var(--nm-border)]">
              {order.orderItems?.map((item, index) => (
                <div key={`${item.product}-${index}`} className="flex items-start gap-4 p-5">
                  <Link to={`/product/${item.product}`} className="shrink-0">
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.title}
                      className="h-20 w-16 rounded-xl border border-[var(--nm-border)] object-cover sm:h-24 sm:w-20"
                      onError={(event) => {
                        event.currentTarget.src = "/placeholder.png";
                      }}
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.product}`} className="line-clamp-2 text-sm font-semibold hover:underline">
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[var(--nm-muted)]">
                      {item.color ? `Color ${item.color}` : ""} {item.size ? `| Size ${item.size}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--nm-muted)]">Qty {item.qty}</p>
                  </div>

                  <div className="text-sm font-semibold">Rs {item.price * item.qty}</div>
                </div>
              ))}
            </div>

            <footer className="space-y-3 border-t border-[var(--nm-border)] p-5">
              <div className="text-sm font-semibold">Order Total: Rs {order.totalPrice}</div>
              <OrderTimeline order={order} />

              {order.status === "Delivered" && (
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-300">
                  Delivered successfully
                </div>
              )}

              {order.status !== "Delivered" && order.tracking?.trackingId && (
                <div className="rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3 text-sm">
                  <p><b>Courier:</b> {order.tracking.courier}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <b>Tracking:</b>
                    <span className="font-mono">{order.tracking.trackingId}</span>
                    <button
                      onClick={() => handleCopy(order.tracking.trackingId, order._id)}
                      className="rounded-full border border-[var(--nm-border)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    >
                      {copiedId === order._id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  {order.tracking.trackingUrl && (
                    <a
                      href={order.tracking.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-[var(--nm-accent-strong)] underline"
                    >
                      Track Shipment
                    </a>
                  )}
                </div>
              )}

              {!order.tracking?.trackingId && order.status !== "Delivered" && (
                <p className="text-xs text-[var(--nm-muted)]">
                  Tracking will appear after shipment.
                </p>
              )}
            </footer>
          </article>
        );
      })}
    </div>
  );
}
