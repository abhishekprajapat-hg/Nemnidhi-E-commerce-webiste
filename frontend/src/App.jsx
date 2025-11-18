import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// Lazy-load pages for better bundle splitting
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

// Admin pages
const AdminLogin = lazy(() => import("./Pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./Pages/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./Pages/AdminOrderDetail"));
const AdminProducts = lazy(() => import("./Pages/AdminProducts"));
const AdminProductEdit = lazy(() => import("./Pages/AdminProductEdit"));
const AdminHomepageEditor = lazy(() => import("./Pages/AdminHomePageEditor"));

// Non-lazy small shared components (kept regular import to avoid duplicate loads)
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToastContainer from "./components/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Small fallback while lazy components load — replace with your spinner if you have one
function LoadingFallback() {
  return (
    <div className="w-full h-48 flex items-center justify-center">
      <div>Loading...</div>
    </div>
  );
}

export default function App() {
  // NOTE: useLocation requires that App is rendered inside a Router (BrowserRouter/HashRouter).
  // Usually index.jsx wraps <App /> with <BrowserRouter>. If you get "useLocation must be used within a Router"
  // error, ensure index.js is wrapping App in BrowserRouter.
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {/* don't render header/footer on admin pages */}
      {!isAdminRoute && <Header />}

      {/* Suspense wraps the routes that contain lazy-loaded pages */}
      <Suspense fallback={<LoadingFallback />}>
        <main className="flex-1">
          <ScrollToTop />

          <Routes>
            {/* public */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/order/success/:id" element={<OrderSuccess />} />
            <Route path="/about" element={<AboutPage />} />

            {/* protected user pages */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* admin */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute admin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute admin>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/order/:id"
              element={
                <ProtectedRoute admin>
                  <AdminOrderDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/products"
              element={
                <ProtectedRoute admin>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/create-product"
              element={
                <ProtectedRoute admin>
                  <AdminProductEdit />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/homepage"
              element={
                <ProtectedRoute admin>
                  <AdminHomepageEditor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/product/:id"
              element={
                <ProtectedRoute admin>
                  <AdminProductEdit />
                </ProtectedRoute>
              }
            />

            {/* fallback 404 */}
            <Route path="*" element={<div className="p-8 text-center">404 — Page not found</div>} />
          </Routes>
        </main>
      </Suspense>

      <ToastContainer />
      {!isAdminRoute && <Footer />}
    </div>
  );
}
