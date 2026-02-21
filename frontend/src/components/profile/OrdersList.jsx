import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import OrderTimeline from "../../components/profile/OrderTimeline";

const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
};

const getStatusStyle = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "delivered") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (normalized === "cancelled") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";
  }
  if (normalized === "shipped" || normalized === "out for delivery") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300";
  }
  return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
};

export default function OrdersList({ orders, cancelOrder }) {
  const [copiedId, setCopiedId] = useState(null);

  const sortedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return [...orders].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [orders]);

  if (!sortedOrders.length) {
    return (
      <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-6 py-12 text-center text-sm text-[var(--nm-muted)]">
        No orders found yet.
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
      {sortedOrders.map((order) => {
        const orderNumber = order.orderId || `ORD-${String(order._id).slice(-8)}`;
        const normalizedStatus = String(order.status || "").toLowerCase();
        const canCancel = normalizedStatus === "created" || normalizedStatus === "confirmed";
        const orderDate = formatDate(order.createdAt);
        const itemCount = Array.isArray(order.orderItems) ? order.orderItems.length : 0;
        const statusStyle = getStatusStyle(order.status);

        return (
          <article key={order._id} className="overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-surface)]">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Order</p>
                <p className="mt-1 text-sm font-semibold">#{orderNumber}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--nm-muted)]">
                  {orderDate ? <span>{orderDate}</span> : null}
                  <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${statusStyle}`}>
                  {order.status}
                </span>
                <span className="rounded-full border border-[var(--nm-border)] px-2.5 py-1 text-xs font-semibold">
                  {formatCurrency(order.totalPrice)}
                </span>
                {canCancel ? (
                  <button
                    onClick={() => cancelOrder(order._id)}
                    type="button"
                    className="rounded-full border border-rose-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-rose-600 transition hover:bg-rose-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </header>

            <div className="divide-y divide-[var(--nm-border)]">
              {(order.orderItems || []).map((item, index) => {
                const productId = item?.product?._id || item?.product;
                const lineTotal = Number(item?.price || 0) * Number(item?.qty || 0);

                return (
                  <div key={`${productId || "item"}-${index}`} className="flex items-start gap-4 p-5">
                    <Link to={`/product/${productId}`} className="shrink-0">
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.title || "product"}
                        className="h-20 w-16 rounded-xl border border-[var(--nm-border)] object-cover sm:h-24 sm:w-20"
                        onError={(event) => {
                          event.currentTarget.src = "/placeholder.png";
                        }}
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${productId}`} className="line-clamp-2 text-sm font-semibold hover:underline">
                        {item.title}
                      </Link>
                      <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[var(--nm-muted)]">
                        {item.color ? `Color ${item.color}` : ""}
                        {item.color && item.size ? " | " : ""}
                        {item.size ? `Size ${item.size}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-[var(--nm-muted)]">Qty {item.qty}</p>
                    </div>

                    <div className="text-sm font-semibold">{formatCurrency(lineTotal)}</div>
                  </div>
                );
              })}
            </div>

            <footer className="space-y-3 border-t border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
              <OrderTimeline order={order} />

              {order.status === "Delivered" ? (
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Delivered successfully
                </div>
              ) : null}

              {order.status !== "Delivered" && order.tracking?.trackingId ? (
                <div className="rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3 text-sm">
                  <p>
                    <b>Courier:</b> {order.tracking.courier || "Pending"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <b>Tracking:</b>
                    <span className="font-mono">{order.tracking.trackingId}</span>
                    <button
                      onClick={() => handleCopy(order.tracking.trackingId, order._id)}
                      type="button"
                      className="rounded-full border border-[var(--nm-border)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    >
                      {copiedId === order._id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  {order.tracking.trackingUrl ? (
                    <a
                      href={order.tracking.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-[var(--nm-accent-strong)] underline"
                    >
                      Track Shipment
                    </a>
                  ) : null}
                </div>
              ) : null}

              {!order.tracking?.trackingId && order.status !== "Delivered" ? (
                <p className="text-xs text-[var(--nm-muted)]">Tracking will appear after shipment.</p>
              ) : null}
            </footer>
          </article>
        );
      })}
    </div>
  );
}
