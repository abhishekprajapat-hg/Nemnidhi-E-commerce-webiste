import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToastContainer from "./components/ToastContainer";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { syncCartOwner } from "./store/cartSlice";

const Home = lazy(() => import("./Pages/Home"));
const NewArrivals = lazy(() => import("./Pages/NewArrivals"));
const ProductsPage = lazy(() => import("./Pages/ProductPage"));
const ProductDetails = lazy(() => import("./Pages/ProductDetails"));
const CartPage = lazy(() => import("./Pages/CartPage"));
const CheckoutPage = lazy(() => import("./Pages/CheckoutPage"));
const LoginPage = lazy(() => import("./Pages/LoginPage"));
const RegisterPage = lazy(() => import("./Pages/RegisterPage"));
const ProfilePage = lazy(() => import("./Pages/ProfilePage"));
const AboutPage = lazy(() => import("./Pages/AboutPage"));
const ContactPage = lazy(() => import("./Pages/Contact"));
const PoliciesPage = lazy(() => import("./Pages/PoliciesPage"));
const OrderSuccess = lazy(() => import("./Pages/OrderSuccess"));
const VerifyOtp = lazy(() => import("./Pages/VerifyOtp"));

const AdminLogin = lazy(() => import("./Pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./Pages/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./Pages/AdminOrderDetail"));
const AdminOrderTracking = lazy(() => import("./Pages/AdminOrderTracking"));
const AdminProducts = lazy(() => import("./Pages/AdminProducts"));
const AdminProductEdit = lazy(() => import("./Pages/AdminProductEdit"));
const AdminHomepageEditor = lazy(() => import("./Pages/AdminHomePageEditor"));

function RouteSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="nm-shell py-16">
          <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-12 text-center text-sm text-[var(--nm-muted)]">
            Loading...
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function AdminOutlet() {
  return <Outlet />;
}

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const authUserId = useSelector(
    (state) => state.auth?.user?._id || state.auth?.user?.id || state.auth?.user?.email || null
  );
  const isAdminRoute = useMemo(() => location.pathname.startsWith("/admin"), [location.pathname]);

  useEffect(() => {
    dispatch(syncCartOwner(authUserId));
  }, [dispatch, authUserId]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-[var(--nm-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
      )}

      {!isAdminRoute && <Header />}

      <main id="main-content" className="flex-1">
        <ScrollToTop />

        <Routes>
          <Route path="/" element={<RouteSuspense><Home /></RouteSuspense>} />
          <Route path="/products" element={<RouteSuspense><ProductsPage /></RouteSuspense>} />
          <Route path="/new-arrivals" element={<RouteSuspense><NewArrivals /></RouteSuspense>} />
          <Route path="/product/:id" element={<RouteSuspense><ProductDetails /></RouteSuspense>} />
          <Route path="/cart" element={<RouteSuspense><CartPage /></RouteSuspense>} />
          <Route path="/contact" element={<RouteSuspense><ContactPage /></RouteSuspense>} />
          <Route path="/about" element={<RouteSuspense><AboutPage /></RouteSuspense>} />
          <Route path="/policies" element={<RouteSuspense><PoliciesPage /></RouteSuspense>} />
          <Route path="/order/success/:id" element={<RouteSuspense><OrderSuccess /></RouteSuspense>} />
          <Route path="/register" element={<RouteSuspense><RegisterPage /></RouteSuspense>} />
          <Route path="/login" element={<RouteSuspense><LoginPage /></RouteSuspense>} />
          <Route path="/verify-otp" element={<RouteSuspense><VerifyOtp /></RouteSuspense>} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <RouteSuspense>
                  <CheckoutPage />
                </RouteSuspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <RouteSuspense>
                  <ProfilePage />
                </RouteSuspense>
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<RouteSuspense><AdminLogin /></RouteSuspense>} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute admin>
                <AdminOutlet />
              </ProtectedRoute>
            }
          >
            <Route index element={<RouteSuspense><AdminDashboard /></RouteSuspense>} />
            <Route path="orders" element={<RouteSuspense><AdminOrders /></RouteSuspense>} />
            <Route path="order/:id" element={<RouteSuspense><AdminOrderDetail /></RouteSuspense>} />
            <Route
              path="order/:id/tracking"
              element={<RouteSuspense><AdminOrderTracking /></RouteSuspense>}
            />
            <Route path="products" element={<RouteSuspense><AdminProducts /></RouteSuspense>} />
            <Route path="product/:id" element={<RouteSuspense><AdminProductEdit /></RouteSuspense>} />
            <Route path="create-product" element={<RouteSuspense><AdminProductEdit /></RouteSuspense>} />
            <Route path="homepage" element={<RouteSuspense><AdminHomepageEditor /></RouteSuspense>} />
          </Route>

          <Route
            path="*"
            element={
              <div className="nm-shell py-16">
                <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-14 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">404</p>
                  <h1 className="nm-display mt-2 text-4xl font-semibold">Page not found</h1>
                </div>
              </div>
            }
          />
        </Routes>
      </main>

      <ToastContainer />
      {!isAdminRoute && <Footer />}
    </div>
  );
}
