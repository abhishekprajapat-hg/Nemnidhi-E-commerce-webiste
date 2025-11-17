// src/utils/toast.js
export function showToast(message, opts = {}) {
  const event = new CustomEvent('app:toast', {
    detail: {
      message,
      duration: opts.duration ?? 3000,
      id: Date.now() + Math.random()
    }
  });
  window.dispatchEvent(event);
}
