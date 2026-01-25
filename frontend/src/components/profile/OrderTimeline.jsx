export default function OrderTimeline({ order }) {
  const steps = [
    {
      key: "placed",
      label: "Order Placed",
      date: order.createdAt,
      done: true,
    },
    {
      key: "shipped",
      label: "Shipped",
      date: order.tracking?.shippedAt,
      done: order.status === "Shipped" || order.status === "Delivered",
    },
    {
      key: "delivered",
      label: "Delivered",
      date: order.deliveredAt,
      done: order.status === "Delivered",
    },
  ];

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-3 dark:text-white">
        📦 Order Status
      </h4>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive =
            step.done &&
            (index === steps.length - 1 ||
              !steps[index + 1]?.done);

          return (
            <div key={step.key} className="flex items-start gap-3">
              {/* Indicator */}
              <div className="flex flex-col items-center">
                <span
                  className={`w-3 h-3 rounded-full ${
                    step.done
                      ? isActive
                        ? "bg-blue-600"
                        : "bg-green-600"
                      : "bg-gray-300"
                  }`}
                />
                {index !== steps.length - 1 && (
                  <span
                    className={`w-px h-8 ${
                      step.done ? "bg-green-400" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div>
                <p
                  className={`text-sm font-medium ${
                    step.done
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>

                {step.date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(step.date).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
