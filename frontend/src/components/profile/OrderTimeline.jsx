export default function OrderTimeline({ order }) {
  const status = String(order?.status || "").toLowerCase();
  const isDelivered = status === "delivered";
  const isShipped = status === "shipped" || status === "out for delivery" || isDelivered;
  const isCancelled = status === "cancelled";

  const steps = [
    {
      key: "placed",
      label: "Order Placed",
      date: order?.createdAt,
      done: true,
    },
    {
      key: "shipped",
      label: "Shipped",
      date: order?.tracking?.shippedAt,
      done: isShipped,
    },
    {
      key: "delivered",
      label: "Delivered",
      date: order?.deliveredAt,
      done: isDelivered,
    },
  ];

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Order Progress</p>

      <div className="mt-3 space-y-3">
        {steps.map((step, index) => {
          const isActive = step.done && (index === steps.length - 1 || !steps[index + 1]?.done);

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    step.done
                      ? isActive
                        ? "bg-[var(--nm-accent)]"
                        : "bg-emerald-500"
                      : "bg-[var(--nm-border)]"
                  }`}
                />
                {index !== steps.length - 1 ? (
                  <span className={`mt-1 h-7 w-px ${step.done ? "bg-emerald-400" : "bg-[var(--nm-border)]"}`} />
                ) : null}
              </div>

              <div>
                <p className={`text-sm font-medium ${step.done ? "text-[var(--nm-text)]" : "text-[var(--nm-muted)]"}`}>
                  {step.label}
                </p>
                {step.date ? (
                  <p className="text-xs text-[var(--nm-muted)]">
                    {new Date(step.date).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {isCancelled ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-rose-600">Order cancelled</p>
      ) : null}
    </div>
  );
}
