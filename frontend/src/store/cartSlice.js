// src/store/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { showToast } from '../utils/toast';

// --- Helpers ----------------------------------------------------------------
const LEGACY_CART_KEY = 'cartItems';
const GUEST_OWNER = 'guest';

const normalizeOwnerId = (ownerId) => {
  const raw = String(ownerId || '').trim();
  return raw || GUEST_OWNER;
};

const storageKeyForOwner = (ownerId) => `cartItems:${normalizeOwnerId(ownerId)}`;

const getStoredUserId = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?._id || user?.id || user?.email || null;
  } catch {
    return null;
  }
};

const parseCartJson = (raw) => {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
};

const loadCartForOwner = (ownerId) => {
  try {
    const scopedKey = storageKeyForOwner(ownerId);
    const scopedRaw = localStorage.getItem(scopedKey);
    if (scopedRaw) return parseCartJson(scopedRaw);

    // Backwards compatibility: migrate old cartItems to guest bucket once.
    if (normalizeOwnerId(ownerId) === GUEST_OWNER) {
      const legacyRaw = localStorage.getItem(LEGACY_CART_KEY);
      if (legacyRaw) {
        const migrated = parseCartJson(legacyRaw);
        localStorage.setItem(storageKeyForOwner(GUEST_OWNER), JSON.stringify(migrated));
        localStorage.removeItem(LEGACY_CART_KEY);
        return migrated;
      }
    }
  } catch (e) {
    console.warn('Failed to load cart from storage, falling back to empty', e);
  }
  return [];
};

/**
 * Returns true if cart item `a` matches key `b`.
 * Priority:
 * 1) If b.sku exists -> match by product + sku
 * 2) Else match by product + (size if provided) + (color if provided)
 */
const matches = (a = {}, b = {}) => {
  if (!a || !b) return false;
  if (b.sku) {
    return a.product === b.product && (a.sku || '') === b.sku;
  }
  if (b.size && b.color) {
    return a.product === b.product && a.size === b.size && a.color === b.color;
  }
  if (b.size) {
    return a.product === b.product && a.size === b.size;
  }
  if (b.color) {
    return a.product === b.product && a.color === b.color;
  }
  // fallback: only product id matches
  return a.product === b.product;
};

const findIndex = (cartItems, key) => cartItems.findIndex((it) => matches(it, key));

/**
 * Make a lightweight snapshot suitable for localStorage:
 * - remove very large fields (data: URLs)
 * - keep essential fields to reconstruct cart
 */
const makeLightweightCart = (cartItems) =>
  (cartItems || []).map((it) => {
    const lightweight = {
      product: it.product,
      title: it.title,
      price: it.price,
      qty: it.qty,
      size: it.size,
      color: it.color,
      sku: it.sku,
      countInStock: it.countInStock,
    };
    // include small image urls only if they look like normal http(s) urls and short
    if (it.image && typeof it.image === 'string' && it.image.length < 2000 && !it.image.startsWith('data:')) {
      lightweight.image = it.image;
    }
    return lightweight;
  });

/**
 * Save to localStorage with graceful fallback in case of QuotaExceededError.
 * Attempts in order:
 *  1) Save full cart (if small)
 *  2) Save lightweight cart (no base64 images)
 *  3) Save minimal cart (product, qty, sku)
 */
const saveCartToStorage = (cartItems, ownerId) => {
  const storageKey = storageKeyForOwner(ownerId);
  try {
    // Try saving full cart first
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
    return;
  } catch (err) {
    // If quota exceeded, attempt fallbacks
    try {
      const light = makeLightweightCart(cartItems);
      localStorage.setItem(storageKey, JSON.stringify(light));
      showToast('Cart saved in compact form (large fields removed).', 'info');
      return;
    } catch (err2) {
      try {
        // last resort: minimal
        const minimal = (cartItems || []).map((it) => ({
          product: it.product,
          qty: it.qty,
          sku: it.sku,
        }));
        localStorage.setItem(storageKey, JSON.stringify(minimal));
        showToast('Cart saved (minimal). Some item details not persisted.', 'info');
        return;
      } catch (err3) {
        // cannot save at all - warn in console and show toast
        console.warn('Failed to persist cart to localStorage (quota)', err3);
        showToast('Unable to save cart locally — local storage full.', 'error');
      }
    }
  }
};

// --- Initial state ---------------------------------------------------------

const initialState = {
  ownerId: normalizeOwnerId(getStoredUserId()),
  items: [],
};

initialState.items = loadCartForOwner(initialState.ownerId);

// --- Slice -----------------------------------------------------------------

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * Add to cart (or increment existing). Payload should include:
     * { product, title, price, qty, sku?, size?, color?, countInStock }
     */
    addToCart: (state, action) => {
      const newItem = { ...action.payload, qty: action.payload.qty || 1 };

      // Find existing matching item (sku preferred)
      const idx = findIndex(state.items, newItem);
      if (idx >= 0) {
        const exist = state.items[idx];
        const newQty = exist.qty + newItem.qty;

        // determine available stock: prefer exist.countInStock, else newItem.countInStock
        const available = Number(exist.countInStock ?? newItem.countInStock ?? 0);

        if (newQty > available) {
          showToast(
            `Cannot add more. Only ${available} ${
              available === 1 ? 'item' : 'items'
            } available.`,
            'error'
          );
          return;
        }

        // update qty (and keep other props from exist, but allow price/image override)
        state.items[idx] = {
          ...exist,
          qty: newQty,
          price: newItem.price ?? exist.price,
          image: newItem.image ?? exist.image,
          countInStock: available,
        };
      } else {
        // New item: ensure qty <= stock
        const available = Number(newItem.countInStock ?? 0);
        if (newItem.qty > available) {
          showToast(
            `Cannot add ${newItem.qty}. Only ${available} ${
              available === 1 ? 'item' : 'items'
            } available.`,
            'error'
          );
          return;
        }

        // push normalized item
        const toPush = {
          product: newItem.product,
          title: newItem.title,
          price: newItem.price,
          qty: newItem.qty,
          image: newItem.image,
          size: newItem.size,
          color: newItem.color,
          sku: newItem.sku,
          countInStock: available,
        };
        state.items = [...state.items, toPush];
      }

      // persist (with fallbacks)
      saveCartToStorage(state.items, state.ownerId);
    },

    /**
     * Remove one quantity of the specified "key" item.
     * Payload: { product, sku?, size?, color? }
     */
    removeFromCart: (state, action) => {
      const key = action.payload;
      const idx = findIndex(state.items, key);
      if (idx === -1) return;

      const exist = state.items[idx];
      if (exist.qty <= 1) {
        // remove entirely
        state.items = state.items.filter((_, i) => i !== idx);
      } else {
        state.items[idx] = { ...exist, qty: exist.qty - 1 };
      }

      saveCartToStorage(state.items, state.ownerId);
    },

    /**
     * Remove the entire item line regardless of qty.
     * Payload: { product, sku?, size?, color? }
     */
    clearItemFromCart: (state, action) => {
      const key = action.payload;
      state.items = state.items.filter((it) => !matches(it, key));
      saveCartToStorage(state.items, state.ownerId);
    },

    /**
     * Replace item quantity (useful for cart page direct qty edits).
     * Payload: { product, sku?, size?, color?, qty }
     */
    setItemQty: (state, action) => {
      const { qty, ...key } = action.payload;
      if (typeof qty !== 'number' || qty < 0) return;
      const idx = findIndex(state.items, key);
      if (idx === -1) return;

      const exist = state.items[idx];
      const available = Number(exist.countInStock ?? 0);

      if (qty === 0) {
        state.items = state.items.filter((_, i) => i !== idx);
      } else if (qty > available) {
        showToast(`Only ${available} items available`, 'error');
        return;
      } else {
        state.items[idx] = { ...exist, qty };
      }
      saveCartToStorage(state.items, state.ownerId);
    },

    /**
     * Clears the whole cart.
     */
    clearCart: (state) => {
      state.items = [];
      try {
        localStorage.removeItem(storageKeyForOwner(state.ownerId));
      } catch (e) {
        console.warn('Failed to remove cart from storage', e);
      }
    },

    /**
     * Switch cart context when logged in user changes.
     * This prevents cart leakage across accounts.
     */
    syncCartOwner: (state, action) => {
      const nextOwnerId = normalizeOwnerId(action.payload);
      if (state.ownerId === nextOwnerId) return;
      state.ownerId = nextOwnerId;
      state.items = loadCartForOwner(nextOwnerId);
    },
  },
});

export const { addToCart, removeFromCart, clearItemFromCart, clearCart, setItemQty, syncCartOwner } =
  cartSlice.actions;

export default cartSlice.reducer;
