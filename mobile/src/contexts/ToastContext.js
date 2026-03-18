import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ToastHost from "../components/ToastHost";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = "info") => {
    if (!message) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({
      id: Date.now(),
      message: String(message),
      type,
    });

    timeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [hideToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
