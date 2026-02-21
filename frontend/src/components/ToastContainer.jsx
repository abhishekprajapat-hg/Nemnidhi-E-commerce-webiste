import React, { useEffect, useState } from "react";

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      const nextToast = event.detail;
      setToasts((prev) => [...prev, nextToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== nextToast.id));
      }, nextToast.duration);
    };

    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-50 flex w-[min(100%,22rem)] flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-chat-bubble rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-3 text-sm shadow-lg"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
