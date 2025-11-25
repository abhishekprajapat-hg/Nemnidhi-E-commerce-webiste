// App.jsx (optimized)
import React, { Suspense, lazy, useMemo } from "react";
import { Routes, Route, useLocation, Outlet } from "react-router-dom";

// Lazy-load pages (same as you had)
const Home = lazy(() => import("./Pages/Home"));
const ProductsPage = lazy(() => import("./Pages/ProductPage"));
const ProductDetails = lazy(() => import("./Pages/ProductDetails"));
const CartPage = lazy(() => import("./Pages/CartPage"));
const CheckoutPage = lazy(() => import("./Pages/CheckoutPage"));
const LoginPage = lazy(() => import("./Pages/LoginPage"));
const RegisterPage = lazy(() => import("./Pages/RegisterPage"));
const ProfilePage = lazy(() => import("./Pages/ProfilePage"));
const AboutPage = lazy(() => import("./Pages/AboutPage"));
const OrderSuccess = lazy(() => import("./Pages/OrderSuccess"));
const VerifyOtp = lazy(() => import("./Pages/VerifyOtp"));
const Contact = lazy(() => import("./Pages/Contact"));
const PoliciesPage = lazy(() => import("./Pages/PoliciesPage"));

// Admin pages
const AdminLogin = lazy(() => import("./Pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./Pages/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./Pages/AdminOrderDetail"));
const AdminProducts = lazy(() => import("./Pages/AdminProducts"));
const AdminProductEdit = lazy(() => import("./Pages/AdminProductEdit"));
const AdminHomepageEditor = lazy(() => import("./Pages/AdminHomePageEditor"));

// Non-lazy shared (leave them non-lazy so they are available immediately)
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToastContainer from "./components/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

/* Small Suspense wrapper so we can give each route its own fallback.
   This avoids showing a big global spinner when navigating between pages. */
const RouteSuspense = ({ children }) => (
  <Suspense fallback={
    <div className="w-full h-40 flex items-center justify-center">
      <div className="text-sm">Loading…</div>
    </div>
  }>
    {children}
  </Suspense>
);

/* AdminOutlet: groups admin routes under one ProtectedRoute
   so Header/Footer toggling logic remains simple (based on path). */
function AdminOutlet() {
  return <Outlet />;
}

export default function App() {
  const location = useLocation();

  // small perf: memoize check
  const isAdminRoute = useMemo(() => location.pathname.startsWith("/admin"), [location.pathname]);

  // Declarative route lists reduce duplication and are easier to maintain
  const publicRoutes = [
    { path: "/", element: Home },
    { path: "/products", element: ProductsPage },
    { path: "/product/:id", element: ProductDetails },
    { path: "/cart", element: CartPage },
    { path: "/login", element: LoginPage },
    { path: "/register", element: RegisterPage },
    { path: "/order/success/:id", element: OrderSuccess },
    { path: "/about", element: AboutPage },
    { path: "/contact", element: Contact },
    { path: "/verify-otp", element: VerifyOtp },
    { path: "/policies", element: PoliciesPage },
  ];

  const protectedRoutes = [
    { path: "/checkout", element: CheckoutPage },
    { path: "/profile", element: ProfilePage },
  ];

  const adminRoutes = [
    { index: true, path: "", element: AdminDashboard }, // /admin
    { path: "orders", element: AdminOrders },
    { path: "order/:id", element: AdminOrderDetail },
    { path: "products", element: AdminProducts },
    { path: "create-product", element: AdminProductEdit },
    { path: "product/:id", element: AdminProductEdit },
    { path: "homepage", element: AdminHomepageEditor },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Footer not shown on admin pages */}
      {!isAdminRoute && <Header />}

      {/* main area */}
      <main className="flex-1">
        <ScrollToTop />

        <Routes>
          {/* Public routes (each route wrapped in small Suspense) */}
          {publicRoutes.map(({ path, element: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <RouteSuspense>
                  <Component />
                </RouteSuspense>
              }
            />
          ))}

          {/* Protected user routes */}
          {protectedRoutes.map(({ path, element: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <Component />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
          ))}

          {/* Admin login (no admin layout / header) */}
          <Route
            path="/admin/login"
            element={
              <RouteSuspense>
                <AdminLogin />
              </RouteSuspense>
            }
          />

          {/* Admin nested routes — single ProtectedRoute wrapper */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute admin>
                <AdminOutlet />
              </ProtectedRoute>
            }
          >
            {adminRoutes.map(({ path = undefined, element: Component, index = false }) => {
              const key = path ?? "admin-index";
              return (
                <Route
                  key={key}
                  index={index}
                  path={path}
                  element={
                    <RouteSuspense>
                      <Component />
                    </RouteSuspense>
                  }
                />
              );
            })}
          </Route>

          {/* fallback 404 */}
          <Route path="*" element={<div className="p-8 text-center">404 — Page not found</div>} />
        </Routes>
      </main>

      <ToastContainer />
      {!isAdminRoute && <Footer />}
    </div>
  );
}
