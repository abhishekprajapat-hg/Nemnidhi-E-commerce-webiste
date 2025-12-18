// App.jsx (optimized)
import React, { Suspense, lazy, useMemo } from "react";
import { Routes, Route, useLocation, Outlet } from "react-router-dom";

// Lazy-load user pages
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

// Shared components
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToastContainer from "./components/ToastContainer";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatbotWidget from "./components/chatbot/ChatbotWidget"; // chatbot import

// Suspense wrapper
const RouteSuspense = ({ children }) => (
  <Suspense
    fallback={
      <div className="w-full h-40 flex items-center justify-center">
        <div className="text-sm">Loading…</div>
      </div>
    }
  >
    {children}
  </Suspense>
);

function AdminOutlet() {
  return <Outlet />;
}

export default function App() {
  const location = useLocation();

  const isAdminRoute = useMemo(
    () => location.pathname.startsWith("/admin"),
    [location.pathname]
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Public Navbar/Topbar */}
      {!isAdminRoute && <Header />}

      <main className="flex-1">
        <ScrollToTop />

        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <RouteSuspense>
                <Home />
              </RouteSuspense>
            }
          />
          <Route
            path="/products"
            element={
              <RouteSuspense>
                <ProductsPage />
              </RouteSuspense>
            }
          />
          <Route
            path="/product/:id"
            element={
              <RouteSuspense>
                <ProductDetails />
              </RouteSuspense>
            }
          />

          <Route
            path="/contact"
            element={
              <RouteSuspense>
                <Contact />
              </RouteSuspense>
            }
          />

          <Route
            path="/policies"
            element={
              <RouteSuspense>
                <PoliciesPage />
              </RouteSuspense>
            }
          />

          <Route
            path="/order/success/:id"
            element={
              <RouteSuspense>
                <OrderSuccess />
              </RouteSuspense>
            }
          />

          {/* Auth */}
          <Route
            path="/register"
            element={
              <RouteSuspense>
                <RegisterPage />
              </RouteSuspense>
            }
          />
          <Route
            path="/login"
            element={
              <RouteSuspense>
                <LoginPage />
              </RouteSuspense>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <RouteSuspense>
                <VerifyOtp />
              </RouteSuspense>
            }
          />

          {/* Protected routes */}
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

          {/* Admin Login */}
          <Route
            path="/admin/login"
            element={
              <RouteSuspense>
                <AdminLogin />
              </RouteSuspense>
            }
          />

          {/* Admin Area */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute admin>
                <AdminOutlet />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <RouteSuspense>
                  <AdminDashboard />
                </RouteSuspense>
              }
            />
            <Route
              path="orders"
              element={
                <RouteSuspense>
                  <AdminOrders />
                </RouteSuspense>
              }
            />
            <Route
              path="order/:id"
              element={
                <RouteSuspense>
                  <AdminOrderDetail />
                </RouteSuspense>
              }
            />
            <Route
              path="products"
              element={
                <RouteSuspense>
                  <AdminProducts />
                </RouteSuspense>
              }
            />
            <Route
              path="product/:id"
              element={
                <RouteSuspense>
                  <AdminProductEdit />
                </RouteSuspense>
              }
            />
            <Route
              path="homepage"
              element={
                <RouteSuspense>
                  <AdminHomepageEditor />
                </RouteSuspense>
              }
            />
          </Route>

          {/* 404 fallback */}
          <Route
            path="*"
            element={<div className="p-8 text-center">404 — Page not found</div>}
          />
        </Routes>
      </main>

      <ToastContainer />

      {/* FLOATING CHATBOT — HIDE ON ADMIN ROUTES */}
      {!isAdminRoute && <ChatbotWidget />}

      {!isAdminRoute && <Footer />}
    </div>
  );
}
