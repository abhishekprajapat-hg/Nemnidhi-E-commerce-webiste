import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

// Icons
const IconOverview = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconOrders = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const IconProducts = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const IconCreate = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
// ⭐️ Naya Icon
const IconContent = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>; 

function NavLink({ to, children, icon }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? 'bg-gray-100 text-gray-900 font-medium dark:bg-zinc-700 dark:text-white'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-zinc-700'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const user = useSelector((s) => s.auth?.user || JSON.parse(localStorage.getItem('user') || 'null'));
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const pageTitle = useMemo(() => {
    if (pathname === '/admin') return 'Overview';
    if (pathname.startsWith('/admin/orders')) return 'Orders';
    if (pathname.startsWith('/admin/order/')) return 'Order Details';
    if (pathname.startsWith('/admin/products')) return 'Products';
    if (pathname.startsWith('/admin/product/')) return 'Product Details';
    if (pathname === '/admin/create-product') return 'Create Product';
    // ⭐️ Naya Title
    if (pathname === '/admin/homepage') return 'Homepage Editor';
    return 'Admin';
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    if (drawerOpen) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('touchstart', onDocClick);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  if (!user) {
    // navigate('/login'); // Recommended
    return null;
  }

  const sidebarLinks = (
    <>
      <NavLink to="/admin" icon={<IconOverview />}>Overview</NavLink>
      <NavLink to="/admin/orders" icon={<IconOrders />}>Orders</NavLink>
      <NavLink to="/admin/products" icon={<IconProducts />}>Products</NavLink>
      <NavLink to="/admin/create-product" icon={<IconCreate />}>Create Product</NavLink>
      {/* ⭐️ Naya Link */}
      <NavLink to="/admin/homepage" icon={<IconContent />}>Homepage Editor</NavLink>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-black">
      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-all ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
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
          className="absolute left-0 top-0 h-full w-72 bg-white text-black dark:bg-zinc-800 dark:text-white"
          role="dialog"
          aria-modal="true"
        >
          <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
            <div className="text-lg font-bold font-serif dark:text-white">NEMNIDHI</div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <nav className="p-4 space-y-1 flex-1">
            {sidebarLinks}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Signed in as</div>
            <div className="text-sm font-medium dark:text-white">{user?.name || user?.email}</div>
          </div>
        </motion.aside>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col flex-shrink-0 dark:bg-zinc-800 dark:border-zinc-700">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-700">
          <div className="text-lg font-bold font-serif dark:text-white">NEMNIDHI</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Admin Dashboard</div>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {sidebarLinks}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">Signed in as</div>
          <div className="text-sm font-medium dark:text-white">{user?.name || user?.email}</div>
        </div>
      </aside>

      <main className="flex-1">
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40 dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDrawerOpen(true)}
              className="text-sm lg:hidden px-2 py-1 bg-gray-100 rounded-md dark:bg-zinc-700 dark:text-gray-300"
            >
              Menu
            </button>
            <h2 className="text-lg font-semibold dark:text-white">{pageTitle}</h2>
          </div>
        </header>

        <div className="p-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}