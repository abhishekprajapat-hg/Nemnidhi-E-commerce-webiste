import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import { showToast } from "../utils/toast";

const SHOP_LINKS = [
  { label: "Sarees", category: "Sarees" },
  { label: "Lehengas", category: "Lehenga" },
  { label: "Kurta Sets", category: "Kurta" },
  { label: "Western", category: "Western" },
  { label: "Jeans", category: "Jeans" },
  { label: "Tops", category: "Tops" },
];

const COLLECTION_LINKS = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Most Loved", href: "/products?sort=-rating" },
  { label: "Festive Edit", href: "/products?category=Banarasi" },
];

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, setTheme } = useTheme();
  const cartItems = useSelector((state) => state.cart.items || []);
  const reduxUser = useSelector((state) => state.auth?.user || null);

  const [user, setUser] = useState(reduxUser);
  const [shopOpen, setShopOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const accountRef = useRef(null);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [cartItems]
  );

  const firstName = useMemo(() => {
    if (user?.name) return user.name.split(" ")[0];
    return "Account";
  }, [user]);

  useEffect(() => {
    if (reduxUser) {
      setUser(reduxUser);
      return;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser || null);
    } catch {
      setUser(null);
    }
  }, [reduxUser]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setShopOpen(false);
        setAccountOpen(false);
      }
    }
    function onClickOutside(event) {
      if (!accountRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  useEffect(() => {
    setShopOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
    } catch {
      // ignore storage failures
    }
    try {
      dispatch({ type: "auth/setUser", payload: null });
    } catch {
      // ignore redux failures
    }
    showToast("Logged out successfully");
    setAccountOpen(false);
    navigate("/");
  };

  const navItemClass = ({ isActive }) =>
    `rounded-full px-3 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] transition ${
      isActive
        ? "text-[var(--nm-accent-strong)] dark:text-[var(--nm-accent)]"
        : "text-[var(--nm-muted)] hover:text-[var(--nm-text)]"
    }`;

  const mobileNavLinks = [
    {
      label: "Home",
      href: "/",
      icon: "fa-house",
      matches: (pathname) => pathname === "/",
    },
    {
      label: "Shop",
      href: "/products",
      icon: "fa-bag-shopping",
      matches: (pathname) =>
        pathname === "/products" ||
        pathname.startsWith("/product/") ||
        pathname === "/new-arrivals" ||
        pathname === "/cart" ||
        pathname === "/checkout" ||
        pathname.startsWith("/order/success/"),
    },
    {
      label: "About",
      icon: "fa-circle-info",
      href: "/about",
      matches: (pathname) => pathname === "/about",
    },
    {
      label: "Contact",
      icon: "fa-phone",
      href: "/contact",
      matches: (pathname) => pathname === "/contact",
    },
    {
      label: "Profile",
      href: user ? "/profile" : "/login",
      icon: "fa-circle-user",
      matches: (pathname) =>
        pathname === "/profile" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/verify-otp",
    },
  ];

  const MotionDiv = motion.div;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--nm-border)] bg-[color:color-mix(in_srgb,var(--nm-surface)_82%,transparent)] backdrop-blur-xl">
      <div className="nm-shell py-2.5 sm:py-3">
        <div className="nm-panel relative flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5 sm:py-3">
          <Link to="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nm-accent-soft)] text-[var(--nm-accent-strong)] sm:h-10 sm:w-10">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 3l6 4.5v9L12 21l-6-4.5v-9L12 3z" />
                <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M9 11.5h6M9 14.5h6" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="nm-display truncate whitespace-nowrap text-[clamp(1.6rem,5.5vw,2rem)] font-semibold leading-none tracking-[0.05em]">
                NEMNIDHI
              </div>
              <p className="hidden text-[0.6rem] uppercase tracking-[0.16em] text-[var(--nm-muted)] md:block">
                Modern Ethnic Atelier
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.href} to={item.href} className={navItemClass}>
                {item.label}
              </NavLink>
            ))}

            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] transition ${
                    isActive || shopOpen
                      ? "text-[var(--nm-accent-strong)] dark:text-[var(--nm-accent)]"
                      : "text-[var(--nm-muted)] hover:text-[var(--nm-text)]"
                  }`
                }
              >
                Shop
              </NavLink>

              <AnimatePresence>
                {shopOpen && (
                  <MotionDiv
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 top-full mt-3 w-[38rem] -translate-x-1/2 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-6 shadow-2xl"
                  >
                    <div className="grid grid-cols-3 gap-6 text-sm">
                      <div>
                        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
                          Categories
                        </p>
                        <ul className="space-y-2">
                          {SHOP_LINKS.map((item) => (
                            <li key={item.category}>
                              <Link
                                to={`/products?category=${encodeURIComponent(item.category)}`}
                                className="text-[var(--nm-text)] transition hover:text-[var(--nm-accent)]"
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
                          Curated For You
                        </p>
                        <ul className="space-y-2">
                          {COLLECTION_LINKS.map((item) => (
                            <li key={item.href}>
                              <Link
                                to={item.href}
                                className="text-[var(--nm-text)] transition hover:text-[var(--nm-accent)]"
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link
                        to="/new-arrivals"
                        className="group relative overflow-hidden rounded-2xl border border-[var(--nm-border)] p-4"
                      >
                        <img
                          src="/images/download.jpg"
                          alt="New Arrivals"
                          className="h-32 w-full rounded-xl object-cover transition duration-300 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.src = "/placeholder.png";
                          }}
                        />
                        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.2em] text-[var(--nm-muted)]">
                          Spotlight
                        </p>
                        <p className="nm-display mt-1 text-2xl font-semibold leading-tight">
                          New Arrival Edit
                        </p>
                      </Link>
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--nm-border)] text-[var(--nm-text)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)] sm:hidden"
              aria-label="Toggle theme"
            >
              <i
                className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} text-sm`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="hidden min-h-[2.5rem] items-center rounded-full border border-[var(--nm-border)] px-3 text-xs font-semibold uppercase tracking-[0.16em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)] sm:inline-flex"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <div ref={accountRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border border-[var(--nm-border)] px-3 text-xs font-semibold uppercase tracking-[0.16em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
              >
                {firstName}
                <svg
                  className={`h-3 w-3 transition ${accountOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <MotionDiv
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-2 shadow-xl"
                  >
                    {user ? (
                      <>
                        <Link
                          to="/profile"
                          className="block rounded-xl px-3 py-2 text-sm transition hover:bg-[var(--nm-accent-soft)]"
                          onClick={() => setAccountOpen(false)}
                        >
                          My Account
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block rounded-xl px-3 py-2 text-sm transition hover:bg-[var(--nm-accent-soft)]"
                          onClick={() => setAccountOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          className="mt-1 block rounded-xl px-3 py-2 text-sm transition hover:bg-[var(--nm-accent-soft)]"
                          onClick={() => setAccountOpen(false)}
                        >
                          Register
                        </Link>
                      </>
                    )}
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/cart"
              className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--nm-border)] px-3 text-xs font-semibold uppercase tracking-[0.16em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
              aria-label="Open cart"
            >
              Bag
              {cartCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--nm-accent)] px-1 text-[10px] text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
      </header>

      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-[90] border-t border-[var(--nm-border)] bg-[color:color-mix(in_srgb,var(--nm-surface)_96%,transparent)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 items-center px-3 pb-1 pt-1.5">
          {mobileNavLinks.map((item) => {
            const isActive = item.matches(location.pathname);
            const isProfile = item.label === "Profile";

            return (
              <Link
                key={item.href}
                to={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex min-w-0 items-center justify-center py-2.5 transition ${
                  isActive
                    ? "text-[var(--nm-text)]"
                    : "text-[var(--nm-muted)] hover:text-[var(--nm-text)]"
                }`}
              >
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[1.28rem] transition ${
                    isProfile
                      ? isActive
                        ? "ring-2 ring-[var(--nm-text)] ring-offset-2 ring-offset-[var(--nm-surface)]"
                        : "ring-1 ring-[var(--nm-border)]"
                      : ""
                  }`}
                >
                  <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                </span>
                <span className="sr-only">{item.label}</span>
                <span
                  className={`absolute bottom-0 h-1 w-1 rounded-full bg-[var(--nm-text)] transition ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
