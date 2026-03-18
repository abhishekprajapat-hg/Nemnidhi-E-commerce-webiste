import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const GUEST_OWNER = "guest";
const CART_PREFIX = "nemnidhi:cart:";
const CartContext = createContext(null);

const normalizeOwnerId = (value) => String(value || "").trim() || GUEST_OWNER;
const storageKeyForOwner = (ownerId) => `${CART_PREFIX}${normalizeOwnerId(ownerId)}`;

const matches = (entry = {}, key = {}) => {
  if (!entry || !key) return false;

  if (key.sku) {
    return entry.product === key.product && String(entry.sku || "") === String(key.sku);
  }

  if (key.size && key.color) {
    return (
      entry.product === key.product &&
      String(entry.size || "") === String(key.size) &&
      String(entry.color || "") === String(key.color)
    );
  }

  if (key.size) {
    return entry.product === key.product && String(entry.size || "") === String(key.size);
  }

  if (key.color) {
    return entry.product === key.product && String(entry.color || "") === String(key.color);
  }

  return entry.product === key.product;
};

const findIndex = (items, key) => items.findIndex((entry) => matches(entry, key));

export const getCartItemKey = (item = {}) =>
  [item.product || "", item.sku || "", item.size || "", item.color || ""].join(":");

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const ownerId = useMemo(
    () => normalizeOwnerId(user?._id || user?.id || user?.email),
    [user?._id, user?.email, user?.id]
  );

  const [items, setItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCart() {
      setCartLoading(true);
      setItems([]);

      try {
        const raw = await AsyncStorage.getItem(storageKeyForOwner(ownerId));
        if (!active) return;

        const parsed = raw ? JSON.parse(raw) : [];
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setCartLoading(false);
      }
    }

    loadCart();

    return () => {
      active = false;
    };
  }, [ownerId]);

  useEffect(() => {
    if (cartLoading) return;

    AsyncStorage.setItem(
      storageKeyForOwner(ownerId),
      JSON.stringify(items)
    ).catch(() => {
      showToast("Could not save your cart locally.", "error");
    });
  }, [cartLoading, items, ownerId, showToast]);

  const addItem = useCallback(
    (payload) => {
      if (!payload?.product) return false;

      let nextSuccess = true;
      let failureMessage = "";

      setItems((current) => {
        const index = findIndex(current, payload);
        const safeQty = Math.max(1, Number(payload.qty || 1));
        const available = Number(payload.countInStock || 0);

        if (index >= 0) {
          const existing = current[index];
          const nextQty = Number(existing.qty || 0) + safeQty;

          if (nextQty > available) {
            nextSuccess = false;
            failureMessage = `Only ${available} item${available === 1 ? "" : "s"} available.`;
            return current;
          }

          return current.map((entry, idx) =>
            idx === index
              ? {
                  ...entry,
                  ...payload,
                  qty: nextQty,
                  countInStock: available,
                }
              : entry
          );
        }

        if (safeQty > available) {
          nextSuccess = false;
          failureMessage = `Only ${available} item${available === 1 ? "" : "s"} available.`;
          return current;
        }

        return [...current, { ...payload, qty: safeQty, countInStock: available }];
      });

      if (!nextSuccess) {
        showToast(failureMessage || "Unable to add this item.", "error");
      }

      return nextSuccess;
    },
    [showToast]
  );

  const setItemQty = useCallback(
    (key, qty) => {
      const nextQty = Number(qty || 0);
      if (nextQty < 0) return;

      setItems((current) => {
        const index = findIndex(current, key);
        if (index < 0) return current;

        const entry = current[index];
        const available = Number(entry.countInStock || 0);

        if (nextQty === 0) {
          return current.filter((_, idx) => idx !== index);
        }

        if (nextQty > available) {
          showToast(`Only ${available} items available.`, "error");
          return current;
        }

        return current.map((item, idx) =>
          idx === index ? { ...item, qty: nextQty } : item
        );
      });
    },
    [showToast]
  );

  const removeOne = useCallback((key) => {
    setItems((current) => {
      const index = findIndex(current, key);
      if (index < 0) return current;

      const entry = current[index];
      if (Number(entry.qty || 0) <= 1) {
        return current.filter((_, idx) => idx !== index);
      }

      return current.map((item, idx) =>
        idx === index ? { ...item, qty: Number(item.qty || 0) - 1 } : item
      );
    });
  }, []);

  const clearItem = useCallback((key) => {
    setItems((current) => current.filter((entry) => !matches(entry, key)));
  }, []);

  const clearCart = useCallback(async () => {
    setItems([]);
    await AsyncStorage.removeItem(storageKeyForOwner(ownerId));
  }, [ownerId]);

  const itemCount = useMemo(
    () => items.reduce((sum, entry) => sum + Number(entry.qty || 0), 0),
    [items]
  );

  const itemsPrice = useMemo(
    () =>
      items.reduce(
        (sum, entry) => sum + Number(entry.price || 0) * Number(entry.qty || 0),
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      ownerId,
      items,
      cartLoading,
      itemCount,
      itemsPrice,
      addItem,
      removeOne,
      setItemQty,
      clearItem,
      clearCart,
    }),
    [
      addItem,
      cartLoading,
      clearCart,
      clearItem,
      itemCount,
      items,
      itemsPrice,
      ownerId,
      removeOne,
      setItemQty,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
