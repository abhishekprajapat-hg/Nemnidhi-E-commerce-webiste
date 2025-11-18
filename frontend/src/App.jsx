// src/App.jsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header";
import ToastContainer from "./components/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import OrderSuccess from "./Pages/OrderSuccess";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
// pages (use consistent "Pages" folder)
import Home from "./Pages/Home";
import ProductsPage from "./Pages/ProductPage";   // ✅ listing
import ProductDetails from "./Pages/ProductDetails";
import CartPage from "./Pages/CartPage";
import CheckoutPage from "./Pages/CheckoutPage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import ProfilePage from "./Pages/ProfilePage";
import AboutPage from "./Pages/AboutPage";

// admin pages
import AdminLogin from "./Pages/AdminLogin";
import AdminOrderDetail from "./Pages/AdminOrderDetail";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminOrders from "./Pages/AdminOrders";
import AdminProducts from "./Pages/AdminProducts";
import AdminProductEdit from "./Pages/AdminProductEdit";
import AdminHomepageEditor from "./Pages/AdminHomePageEditor";


export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Header />}

      <main className="flex-1">
          <ScrollToTop />
        <Routes>
          {/* public */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsPage />} /> {/* list */}
          <Route path="/product/:id" element={<ProductDetails />} /> {/* detail */}
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

          {/* fallback */}
          <Route path="*" element={<div className="p-8 text-center">404 — Page not found</div>} />
        </Routes>
      </main>
      <ToastContainer />
      {!isAdminRoute && <Footer />}
    </div>
  );
}
