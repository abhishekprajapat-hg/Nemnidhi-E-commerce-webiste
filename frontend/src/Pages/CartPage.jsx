import React, { useMemo, useCallback } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { removeFromCart, addToCart, clearItemFromCart } from "../store/cartSlice";
import { showToast } from "../utils/toast";

const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING = 99;

const CartItem = React.memo(function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:p-5">
      <div className="flex gap-4">
        <Link
          to={`/product/${item.product}`}
          className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-[var(--nm-bg-elevated)] sm:h-32 sm:w-28"
        >
          <img
            src={item.image || "/placeholder.png"}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = "/placeholder.png";
            }}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/product/${item.product}`} className="line-clamp-2 text-base font-semibold hover:underline">
            {item.title}
          </Link>

          <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[var(--nm-muted)]">
            {item.size ? `Size ${item.size}` : "Standard"}{item.color ? ` | ${item.color}` : ""}
          </p>

          <p className="mt-1 text-sm text-[var(--nm-muted)]">Unit: Rs {Number(item.price).toFixed(2)}</p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-1">
              <button
                onClick={() => onDecrease(item)}
                className="h-8 w-8 rounded-full text-lg font-semibold transition hover:bg-[var(--nm-accent-soft)]"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
              <button
                onClick={() => onIncrease(item)}
                disabled={item.qty >= item.countInStock}
                className="h-8 w-8 rounded-full text-lg font-semibold transition hover:bg-[var(--nm-accent-soft)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            <button
              onClick={() => onRemove(item)}
              className="text-xs font-semibold uppercase tracking-[0.11em] text-red-600 transition hover:underline"
            >
              Remove
            </button>
          </div>
        </div>

        <div className="text-right text-base font-semibold">Rs {(item.price * item.qty).toFixed(2)}</div>
      </div>
    </article>
  );
});

export default function CartPage() {
  const items = useSelector((state) => state.cart.items || [], shallowEqual);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [items]
  );
  const shippingPrice = useMemo(
    () => (total >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING),
    [total]
  );
  const totalWithShipping = useMemo(() => Number((total + shippingPrice).toFixed(2)), [total, shippingPrice]);

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
        showToast("Item is out of stock", "error");
        return;
      }
      dispatch(addToCart({ ...item, qty: 1 }));
    },
    [dispatch]
  );

  const handleDecrease = useCallback(
    (item) => {
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
    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    navigate("/checkout");
  }, [items.length, navigate]);

  return (
    <div className="nm-shell py-8 sm:py-10">
      <div className="mb-7 flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">Shopping Bag</p>
          <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">Your Cart</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <section>
          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-14 text-center">
              <h2 className="text-xl font-semibold">Your cart is empty</h2>
              <p className="mt-2 text-sm text-[var(--nm-muted)]">Add products to continue.</p>
              <Link to="/products" className="nm-btn-primary mt-5 text-sm">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={`${item.product}-${item.size}-${item.color}`}
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </section>

        <aside>
          <div className="sticky top-24 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-[var(--nm-muted)]">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-[var(--nm-text)]">Rs {total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--nm-muted)]">
                <span>Shipping</span>
                <span className="font-semibold text-[var(--nm-text)]">
                  {shippingPrice === 0 ? "Free" : `Rs ${shippingPrice}`}
                </span>
              </div>
              {shippingPrice === 0 && (
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--nm-success)]">
                  Free shipping unlocked
                </p>
              )}
              <div className="border-t border-[var(--nm-border)] pt-3">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>Rs {totalWithShipping.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={proceedToCheckout}
              disabled={items.length === 0}
              className="nm-btn-primary mt-6 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              Proceed to Checkout
            </button>

            <p className="mt-3 text-xs text-[var(--nm-muted)]">
              Need help? Contact us for exchange and delivery support.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
