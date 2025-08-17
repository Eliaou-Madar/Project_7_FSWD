import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/Cart/CartItem";

export default function CartPage() {
  const { items, total, clear, loading, refresh, lastResponse } = useCart();
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Your Cart</h1>
        <button onClick={refresh}>Refresh</button>
        <button onClick={() => setShowDebug(s => !s)}>Debug</button>
        {!!items.length && (
          <button onClick={clear} style={{ marginLeft: "auto" }}>
            Clear cart
          </button>
        )}
      </header>

      {showDebug && (
        <pre style={{ background:"#fafafa", padding:12, borderRadius:8, overflow:"auto", maxHeight:220 }}>
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
              <CartItem key={i.id} item={i} />
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
            <strong>Total: {total.toFixed(2)} €</strong>
            <Link to="/checkout">
              <button>Proceed to Checkout</button>
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
