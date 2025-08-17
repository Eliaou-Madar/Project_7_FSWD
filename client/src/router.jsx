// src/router.jsx
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

// Pages (publiques)
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

// Pages (appli)
import HomePage from "./pages/HomePage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";

// Admin
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import AdminPromosPage from "./pages/admin/AdminPromosPage.jsx";

// Guards
import PrivateRoute from "./components/Auth/PrivateRoute.jsx";
import AdminRoute from "./components/Admin/AdminRoute.jsx";
import PrivateAppLayout from "./components/Layout/PrivateAppLayout.jsx";




export default function Router() {
  return (
    <Routes>
      {/* Racine -> /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />


      {/* Espace protégé, préfixe users/:userId/* */}
      <Route
        path="/users/:userId/*"
        element={
          <PrivateRoute>
             <PrivateAppLayout />
          </PrivateRoute>
        }
      >
        {/* Outlet */}
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="orders" element={<OrdersPage />} />

        {/* Sous-espace admin */}
        <Route
          path="admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="promos" element={<AdminPromosPage />} />
        </Route>
      </Route>

      {/* 404 -> /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
