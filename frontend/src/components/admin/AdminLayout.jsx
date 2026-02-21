import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/create-product", label: "Create Product" },
  { to: "/admin/homepage", label: "Homepage Editor" },
];

function NavLink({ to, label, onClick }) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block rounded-2xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[var(--nm-accent)] text-white"
          : "text-[var(--nm-text)] hover:bg-[var(--nm-accent-soft)] hover:text-[var(--nm-accent-strong)]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const location = useLocation();
  const user = useSelector((state) => state.auth?.user || JSON.parse(localStorage.getItem("user") || "null"));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const pageTitle = useMemo(() => {
    if (location.pathname === "/admin") return "Overview";
    if (location.pathname.startsWith("/admin/orders")) return "Orders";
    if (location.pathname.startsWith("/admin/order/")) return "Order Details";
    if (location.pathname.startsWith("/admin/products")) return "Products";
    if (location.pathname.startsWith("/admin/product/")) return "Product Details";
    if (location.pathname === "/admin/create-product") return "Create Product";
    if (location.pathname === "/admin/homepage") return "Homepage Editor";
    return "Admin";
  }, [location.pathname]);

  useEffect(() => {
    function onDocClick(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setDrawerOpen(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    if (drawerOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--nm-bg)]">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            ref={drawerRef}
            className="h-full w-[86vw] max-w-xs border-r border-[var(--nm-border)] bg-[var(--nm-card)] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5">
              <p className="nm-display text-3xl font-semibold">NEMNIDHI</p>
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--nm-muted)]">Admin Panel</p>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} label={item.label} onClick={() => setDrawerOpen(false)} />
              ))}
            </nav>
            <div className="mt-6 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--nm-muted)]">Signed in as</p>
              <p className="mt-1 text-sm font-semibold">{user?.name || user?.email}</p>
            </div>
          </aside>
        </div>
      )}

      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[16.5rem_1fr]">
        <aside className="hidden border-r border-[var(--nm-border)] bg-[var(--nm-card)] p-5 lg:block">
          <div className="mb-5">
            <Link to="/" className="nm-display text-3xl font-semibold">NEMNIDHI</Link>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--nm-muted)]">Admin Panel</p>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>
          <div className="mt-6 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--nm-muted)]">Signed in as</p>
            <p className="mt-1 text-sm font-semibold">{user?.name || user?.email}</p>
          </div>
        </aside>

        <main>
          <header className="sticky top-0 z-40 border-b border-[var(--nm-border)] bg-[color:color-mix(in_srgb,var(--nm-surface)_88%,transparent)] px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--nm-border)] lg:hidden"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold">{pageTitle}</h2>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6">{children || <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}
