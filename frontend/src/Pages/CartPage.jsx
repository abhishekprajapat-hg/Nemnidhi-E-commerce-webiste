import React, { useMemo, useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { removeFromCart, addToCart, clearItemFromCart } from '../store/cartSlice';
import { Link, useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

// Constants
const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING = 99;

// Memoized item to avoid re-renders when unrelated state changes
const CartItem = React.memo(function CartItem({ i, onIncrease, onDecrease, onRemove }) {
  return (
    <div
      key={`${i.product}-${i.size}-${i.color}`}
      className="flex gap-4 p-4 border rounded-lg items-start dark:border-zinc-700 dark:bg-zinc-800"
    >
      <Link
        to={`/product/${i.product}`}
        className="shrink-0 w-28 h-32 rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-700"
      >
        <img
          src={i.image || '/placeholder.png'}
          alt={i.title}
          className="object-cover w-full h-full"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder.png';
          }}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${i.product}`}
          className="block text-lg font-semibold text-gray-900 dark:text-white hover:underline"
        >
          {i.title}
        </Link>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {i.size && (
            <span className="mr-3">
              Size:{' '}
              <strong className="text-gray-700 dark:text-gray-200">{i.size}</strong>
            </span>
          )}
          {i.color && (
            <span>
              Color:{' '}
              <strong style={{ textTransform: 'capitalize' }} className="text-gray-700 dark:text-gray-200">
                {i.color}
              </strong>
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Unit Price: ₹{Number(i.price).toFixed(2)}</div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center border rounded-md h-10 dark:border-zinc-700">
            <button
              onClick={() => onDecrease(i)}
              className="px-4 h-full text-lg font-semibold text-gray-700 hover:bg-gray-50 rounded-l-md dark:text-gray-300 dark:hover:bg-zinc-700/50"
            >
              -
            </button>
            <span className="px-4 text-base font-semibold dark:text-white">{i.qty}</span>
            <button
              onClick={() => onIncrease(i)}
              disabled={i.qty >= i.countInStock}
              className="px-4 h-full text-lg font-semibold text-gray-700 hover:bg-gray-50 rounded-r-md disabled:opacity-50 dark:text-gray-300 dark:hover:bg-zinc-700/50"
            >
              +
            </button>
          </div>

          <button onClick={() => onRemove(i)} className="text-sm text-red-600 hover:underline">
            Remove
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 min-w-[100px]">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">₹{(i.price * i.qty).toFixed(2)}</div>
      </div>
    </div>
  );
});

export default function CartPage() {
  // selector kept shallowEqual to avoid unnecessary rerenders
  const items = useSelector((s) => s.cart.items || [], shallowEqual);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const total = useMemo(
    () => (items || []).reduce((a, c) => a + Number(c.price || 0) * Number(c.qty || 0), 0),
    [items]
  );

  const itemCount = useMemo(() => (items || []).reduce((a, c) => a + Number(c.qty || 0), 0), [items]);

  // SHIPPING
  const shippingPrice = useMemo(() => (total >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING), [total]);
  const totalWithShipping = useMemo(() => +(total + shippingPrice).toFixed(2), [total, shippingPrice]);

  // Handlers wrapped in useCallback to keep stable references
  const handleRemove = useCallback(
    (item) => {
      dispatch(
        clearItemFromCart({
          product: item.product,
          size: item.size,
          color: item.color,
        })
      );
      showToast(`${item.title} removed from cart`);
    },
    [dispatch]
  );

  const handleIncrease = useCallback(
    (item) => {
      if (item.qty + 1 > item.countInStock) {
        showToast('Item is out of stock', 'error');
        return;
      }
      dispatch(addToCart({ ...item, qty: 1 }));
    },
    [dispatch]
  );

  const handleDecrease = useCallback(
    (item) => {
      // removeFromCart should decrement by 1 (as per your slice)
      dispatch(
        removeFromCart({
          product: item.product,
          size: item.size,
          color: item.color,
        })
      );
    },
    [dispatch]
  );

  const proceedToCheckout = useCallback(() => {
    if ((items || []).length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    navigate('/checkout');
  }, [items, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items list */}
        <div className="lg:col-span-8">
          {items.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center dark:border-zinc-700">
              <div className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Your cart is empty</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Looks like you haven't added anything yet.</p>
              <Link to="/products" className="inline-block px-6 py-3 bg-black text-white rounded-md hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((i) => (
                <CartItem
                  key={`${i.product}-${i.size}-${i.color}`}
                  i={i}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-xl border p-6 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>
                    Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
                  </span>
                  <span className="font-medium dark:text-white">₹{total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-700 dark:text-gray-300 items-center">
                  <span>Shipping</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium dark:text-white">{shippingPrice === 0 ? 'Free' : `₹${shippingPrice}`}</span>
                    {shippingPrice === 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Free for orders ₹{FREE_SHIPPING_THRESHOLD}+
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                  <label htmlFor="promo" className="text-sm font-medium dark:text-gray-300">Have a promo code?</label>
                  <div className="flex gap-2 mt-2">
                    <input id="promo" name="promo" className="flex-1 border rounded-md px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-white" placeholder="Enter code" />
                    <button className="px-4 py-2 border rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600">Apply</button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-extrabold text-gray-900 dark:text-white">₹{totalWithShipping.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={proceedToCheckout}
                className={`mt-6 w-full px-4 py-3 rounded-md text-white font-semibold ${items.length ? 'bg-black hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200' : 'bg-gray-300 cursor-not-allowed'}`}
                disabled={items.length === 0}
              >
                Proceed to Checkout
              </button>
            </div>

            <div className="rounded-lg border p-4 text-sm text-gray-600 bg-gray-50 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700">
              <div className="font-medium mb-2 dark:text-gray-300">Need help?</div>
              <div className="mb-2">Contact our support for order edits & returns.</div>
              <Link to="/customer-service" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">Customer Service</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
