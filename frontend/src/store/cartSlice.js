import { createSlice } from '@reduxjs/toolkit';
import { showToast } from '../utils/toast'; // Assuming you have this utility

// Helper to find a unique item
const findUniqueItem = (cartItems, itemToFind) => {
  return cartItems.find(
    (x) =>
      x.product === itemToFind.product &&
      // Only check size/color if they exist on the item
      (!itemToFind.size || x.size === itemToFind.size) &&
      (!itemToFind.color || x.color === itemToFind.color)
  );
};

// Helper to save to localStorage
const saveCartToStorage = (cartItems) => {
  localStorage.setItem('cartItems', JSON.stringify(cartItems));
};

const initialState = {
  // Your original code used 'items', so we will stick to that.
  items: JSON.parse(localStorage.getItem('cartItems') || '[]'),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * Handles adding a new item OR incrementing the quantity of an existing item.
     * Payload: The full item object { product, title, price, ... }
     */
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existItem = findUniqueItem(state.items, newItem);

      if (existItem) {
        // Item already exists, increment quantity
        const newQty = existItem.qty + (newItem.qty || 1); // Use payload qty or default to 1
        if (newQty > existItem.countInStock) {
          showToast('Cannot add more. Item is out of stock', 'error');
          return; // Don't update
        }

        state.items = state.items.map((x) =>
          findUniqueItem([x], newItem) ? { ...x, qty: newQty } : x
        );
      } else {
        // New item, add it to the cart
        state.items = [...state.items, { ...newItem, qty: newItem.qty || 1 }];
      }

      saveCartToStorage(state.items);
    },

    /**
     * Handles decrementing the quantity, and removes
     * the item if the quantity becomes 0.
     * Payload: A "key" object { product, size, color }
     */
    removeFromCart: (state, action) => {
      const itemToDecrease = action.payload;
      const existItem = findUniqueItem(state.items, itemToDecrease);

      if (!existItem) return; // Item not found

      if (existItem.qty === 1) {
        // Last item, remove it from the cart entirely
        state.items = state.items.filter(
          (x) => !findUniqueItem([x], itemToDecrease)
        );
      } else {
        // Item exists, just decrement quantity
        state.items = state.items.map((x) =>
          findUniqueItem([x], itemToDecrease) ? { ...x, qty: x.qty - 1 } : x
        );
      }

      saveCartToStorage(state.items);
    },

    /**
     * Removes an item from the cart completely, regardless of quantity.
     * Used by the "Remove" button in the cart.
     * Payload: A "key" object { product, size, color }
     */
    clearItemFromCart: (state, action) => {
      const itemToRemove = action.payload;
      state.items = state.items.filter(
        (x) => !findUniqueItem([x], itemToRemove)
      );
      saveCartToStorage(state.items);
    },

    /**
     * Clears the entire cart.
     */
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cartItems');
    },
  },
});

// We removed 'updateQty' because 'addToCart' and 'removeFromCart' handle it better
export const { addToCart, removeFromCart, clearItemFromCart, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;