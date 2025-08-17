// src/pages/CartPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/Cart/CartItem";

export default function CartPage() {
  const { items, total = 0, clear, loading, refresh, lastResponse } = useCart();
  const [showDebug, setShowDebug] = useState(false);

  // 👉 Refresh automatique au montage + quand l'onglet reprend le focus
  useEffect(() => {
    refresh?.();

    const onFocus = () => refresh?.();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Your Cart</h1>
        {!!items.length && (
          <button onClick={clear} style={{ marginLeft: "auto" }} disabled={loading}>
            Clear cart
          </button>
        )}
      </header>

      {showDebug && (
        <pre
          style={{
            background: "#fafafa",
            padding: 12,
            borderRadius: 8,
            overflow: "auto",
            maxHeight: 220,
            marginTop: 12,
          }}
        >
{JSON.stringify(lastResponse, null, 2)}
        </pre>
      )}

      {loading ? (
        <p style={{ marginTop: 12 }}>Loading…</p>
      ) : !items.length ? (
        <p style={{ marginTop: 12 }}>
          Your cart is empty. <Link to="/products">Browse products</Link>
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {items.map((i) => (
              <CartItem key={i.id ?? i.key ?? i.product_size_id} item={i} />
            ))}
          </div>

          <footer
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <strong>Total: {Number(total).toFixed(2)} €</strong>
            <Link to="/checkout">
              <button disabled={loading}>Proceed to Checkout</button>
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
