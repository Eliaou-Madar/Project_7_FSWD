// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getItem, setItem, removeItem } from "../utils/storage";

const CartContext = createContext(null);
CartContext.displayName = "CartContext";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Charger le panier depuis le localStorage au démarrage
  useEffect(() => {
    const savedCart = getItem("cart");
    if (savedCart) setCart(savedCart);
  }, []);

  // Sauvegarder le panier à chaque modification
  useEffect(() => {
    setItem("cart", cart);
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    removeItem("cart");
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
