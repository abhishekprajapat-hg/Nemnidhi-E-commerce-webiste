// src/components/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { showToast } from "../utils/toast";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items || []);
  const reduxUser = useSelector((state) => state.auth?.user || null);
  const [user, setUser] = useState(reduxUser);

  const { theme, setTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false); // Mega Menu
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const drawerRef = useRef(null);

  const shopLinkRef = useRef(null); // Shop link
  const dropdownRef = useRef(null); // dropdown DOM
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 980,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const count = cartItems?.reduce((a, c) => a + Number(c.qty || 0), 0) || 0;
  const firstName = user?.name ? user.name.split(" ")[0] : "Account";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (reduxUser) setUser(reduxUser);
    else {
      try {
        const stored = JSON.parse(localStorage.getItem("user"));
        setUser(stored || null);
      } catch {
        setUser(null);
      }
    }
  }, [reduxUser]);

  useEffect(() => {
    function onDocClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    }
    if (drawerOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  // compute fixed dropdown position when opened, and on resize/scroll
  useEffect(() => {
    if (!isShopOpen) return;

    function compute() {
      const link = shopLinkRef.current;
      const dd = dropdownRef.current;
      if (!link || !dd) return;

      const linkRect = link.getBoundingClientRect();
      const ddWidth = Math.min(980, window.innerWidth - 24); // prefer 980px but clamp to viewport
      const desiredCenter = linkRect.left + linkRect.width / 2;
      let leftPx = Math.round(desiredCenter - ddWidth / 2);

      const pad = 12;
      leftPx = Math.max(
        pad,
        Math.min(leftPx, window.innerWidth - ddWidth - pad)
      );

      const topPx = Math.round(linkRect.bottom + 2); // small gap below header row

      setDropdownPos({ top: topPx, left: leftPx, width: ddWidth });
    }

    // compute immediately (dropdownRef exists because we render it in the DOM when isShopOpen)
    compute();

    // recompute on resize/scroll (passive for scroll)
    const onResize = () => compute();
    const onScroll = () => compute();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isShopOpen]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
    } catch {}
    try {
      dispatch({ type: "auth/setUser", payload: null });
    } catch {}
    showToast("Logged out successfully");
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?q=${encodeURIComponent(query)}`);
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  const mainNavLinks = (
    <>
      <Link
        to="/"
        className="text-xs font-normal uppercase tracking-wider text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition hover:underline"
      >
        Home
      </Link>

      <div
        className="relative"
        onMouseEnter={() => setIsShopOpen(true)}
        onMouseLeave={() => setIsShopOpen(false)}
      >
        <Link
          ref={shopLinkRef}
          to="/products"
          className="flex items-center gap-1 text-xs font-normal uppercase tracking-wider text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition hover:underline"
        >
          Shop
        </Link>

        <AnimatePresence>
          {isShopOpen && (
            // NOTE: position fixed so we can line up with viewport coordinates
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="fixed left-0 top-0 z-50"
              style={{
                left: dropdownPos.left,
                top: dropdownPos.top,
                width: dropdownPos.width,
              }}
            >
              {/* dropdown container */}
              <div className="bg-white border-b border-gray-200 shadow-xl dark:bg-zinc-900 dark:border-zinc-800 rounded-b-md">
                <div className="px-6 md:px-10 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Column 1 — FEATURED */}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                        FEATURED
                      </h3>
                      <ul className="space-y-2 text-sm dark:text-gray-300">
                        <li>
                          <Link
                            to="/products?category=Sarees"
                            className="hover:underline"
                          >
                            Sarees
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/products?category=Tops"
                            className="hover:underline"
                          >
                            Tops
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/products?category=Kurtas"
                            className="hover:underline"
                          >
                            Kurtas
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/products?category=Western"
                            className="hover:underline"
                          >
                            Western
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/products?category=Jeans"
                            className="hover:underline"
                          >
                            Jeans
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/products?category=Sweaters"
                            className="hover:underline"
                          >
                            Sweaters
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Column 2 — TRENDING */}
                    <div className="dark:text-gray-300">
                      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 dark:text-white">
                        Collections
                      </h3>
                      <ul className="space-y-2 text-sm ">
                        <li>
                          <Link
                            to="/products?category=Lehenga"
                            className="hover:underline"
                          >
                            Lehengas
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/products?category=Banarasi"
                            className="hover:underline"
                          >
                            Banarasi Sarees
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/products?category=Kurta"
                            className="hover:underline"
                          >
                            Kurta Sets
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/products?filter=new-arrivals"
                            className="hover:underline"
                          >
                            New Arrivals
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Column 3 — IMAGE + CTA */}
                    <div className="flex flex-col items-start">
                      <img
                        src="/images/download.jpg"
                        alt="Featured Look"
                        className="w-full h-auto object-cover rounded-md shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='550' viewBox='0 0 400 550'%3E%3Crect fill='%23f3f4f6' width='100%25' height='100%25'/%3E%3C/text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23999'%3EImage%20Not%20Found%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <Link
                        to="/products?filter=new-arrivals"
                        className="mt-3 text-sm uppercase tracking-wider flex items-center gap-1 hover:underline"
                      >
                        ➜ Explore Fall Edit 003
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link
        to="/about"
        className="text-xs font-normal uppercase tracking-wider text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition hover:underline"
      >
        About
      </Link>
    </>
  );

  // mobile drawer links (same as before)
  const mobileDrawerLinks = (
    <>
      <Link
        to="/"
        onClick={() => setDrawerOpen(false)}
        className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
      >
        Home
      </Link>
      <Link
        to="/products"
        onClick={() => setDrawerOpen(false)}
        className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
      >
        Shop All
      </Link>
      <Link
        to="/about"
        onClick={() => setDrawerOpen(false)}
        className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
      >
        About
      </Link>
      <Link
        to="/customer-service"
        onClick={() => setDrawerOpen(false)}
        className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
      >
        Customer Service
      </Link>

      <div className="pt-3 mt-3 border-t border-gray-200 dark:border-zinc-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center w-full px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
          aria-label="Toggle theme"
        >
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        {user && (
          <>
            <Link
              to="/profile"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center w-full px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
            >
              My Account
            </Link>
            <Link
              to="/orders"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center w-full px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
            >
              My Orders
            </Link>
          </>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-zinc-800 mt-3 pt-3">
        {user ? (
          <button
            onClick={() => {
              handleLogout();
              setDrawerOpen(false);
            }}
            className="flex items-center justify-center w-full px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-red-600 dark:text-red-400"
          >
            Logout
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={() => setDrawerOpen(false)}
              className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 text-center"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setDrawerOpen(false)}
              className="block px-3 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black text-center"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <header className="bg-[#fdf7f7] border-b border-gray-200 text-gray-900 sticky top-0 z-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Mobile Menu Toggle & Logo */}
          <div className="flex items-center gap-4 md:w-1/3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-3">
              <div className="text-xl font-semibold tracking-widest uppercase font-sans dark:text-white">
                NEMNIDHI
              </div>
            </Link>
          </div>

          {/* Center: Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center justify-center gap-8 w-1/3">
            {mainNavLinks}
          </nav>

          {/* Right side: Utility Icons */}
          <div className="flex items-center justify-end gap-4 w-1/3">
            {/* Search bar removed */}

            <button
              onClick={toggleTheme}
              className="hidden sm:inline-flex items-center justify-center w-12 h-9 rounded-full text-xs font-normal uppercase tracking-wider text-gray-700 hover:text-black hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-zinc-800"
              aria-label="Toggle theme"
            >
              {isClient && (theme === "dark" ? "Light" : "Dark")}
            </button>

            {/* Login Dropdown */}
            <div
              className="relative hidden sm:inline-flex"
              onMouseEnter={() => setIsLoginOpen(true)}
              onMouseLeave={() => setIsLoginOpen(false)}
            >
              <Link
                to={user ? "/profile" : "/login"}
                className="flex items-center text-xs font-normal uppercase tracking-wider text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
              >
                <span className="hidden lg:inline">{firstName}</span>{" "}
                <span
                  className={`transition-transform ml-1 ${
                    isLoginOpen ? "rotate-180" : ""
                  }`}
                >
                  v
                </span>
              </Link>

              <motion.div
                initial={false}
                animate={{
                  opacity: isLoginOpen ? 1 : 0,
                  y: isLoginOpen ? 0 : 10,
                }}
                transition={{ duration: 0.18 }}
                className={`absolute top-full right-0 mt-0 bg-white shadow-xl rounded-lg border border-gray-200 w-60 dark:bg-zinc-800 dark:border-zinc-700 ${
                  isLoginOpen ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                {/* login content same as before */}
                {user ? (
                  <div className="p-3 text-sm">
                    <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                      <span className="font-semibold dark:text-white">
                        Hello, {firstName}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsLoginOpen(false)}
                      className="flex items-center py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded px-2"
                    >
                      My Account
                    </Link>
                    <div className="border-t border-gray-100 dark:border-zinc-700 my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-700 rounded px-2"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="p-3 text-sm">
                    <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                      <span className="font-semibold dark:text-white">
                        New customer?
                      </span>
                      <Link
                        to="/register"
                        onClick={() => setIsLoginOpen(false)}
                        className="font-medium text-blue-600 dark:text-yellow-400 hover:underline"
                      >
                        Sign Up
                      </Link>
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setIsLoginOpen(false)}
                      className="flex items-center py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded px-2"
                    >
                      Login
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsLoginOpen(false)}
                      className="flex items-center py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded px-2"
                    >
                      Wishlist
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>

            <Link
              to="/cart"
              className="inline-flex items-center text-xs font-normal uppercase tracking-wider text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              Bag{count > 0 && <span className="ml-1">({count})</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (unchanged) */}
      <div
        className={`fixed inset-0 z-50 transition-all ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!drawerOpen}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: drawerOpen ? 1 : 0 }}
          onClick={() => setDrawerOpen(false)}
          className="absolute inset-0 bg-black/60"
        />
        <motion.aside
          ref={drawerRef}
          initial={{ x: "-100%" }}
          animate={{ x: drawerOpen ? "0%" : "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute left-0 top-0 h-full w-72 bg-white text-black dark:bg-zinc-900 dark:text-white"
          role="dialog"
          aria-modal="true"
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800">
            <div className="text-lg font-semibold tracking-widest uppercase font-sans">
              NEMNIDHI
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <span className="font-bold text-lg">X</span>
            </button>
          </div>

          <nav className="p-4 space-y-2 flex flex-col h-[calc(100%-65px)]">
            <div className="flex-1 space-y-2">{mobileDrawerLinks}</div>
          </nav>
        </motion.aside>
      </div>
    </header>
  );
}
