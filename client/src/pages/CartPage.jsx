// src/pages/CartPage.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext";
import CartItem from "../components/Cart/CartItem";
import "./CartPage.css";

export default function CartPage() {
  const { user } = useContext(AuthContext);
  const isAuthed = !!user;
  const base = isAuthed ? `/users/${user.id}` : "";
  const toCheckout = isAuthed ? `${base}/checkout` : "/login";

  const navigate = useNavigate();
  const location = useLocation();

  const { items, total = 0, clear, loading, refresh, lastResponse } = useCart();
  const [showDebug, setShowDebug] = useState(false);

  // Refresh au montage + quand l’onglet reprend le focus
  useEffect(() => {
    refresh?.();
    const onFocus = () => refresh?.();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // Evite les NaN et formate total
  const totalFormatted = useMemo(() => Number(total || 0).toFixed(2), [total]);

  const goCheckout = () => {
    if (!isAuthed) {
      // sauvegarde la destination voulue pour post-login
      const next = "/users/:userId/checkout"; // indicatif
      navigate("/login", { replace: true, state: { next, from: location.pathname } });
      return;
    }
    navigate(toCheckout);
  };

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Your Cart</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {!!items.length && (
            <button onClick={clear} disabled={loading}>Clear cart</button>
          )}
        </div>
      </header>

      {showDebug && (
        <pre
          style={{
            background: "#0f0f10",
            color: "#eee",
            padding: 12,
            borderRadius: 8,
            overflow: "auto",
            maxHeight: 220,
            marginTop: 12,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
{JSON.stringify(lastResponse ?? { items, total }, null, 2)}
        </pre>
      )}

      {loading ? (
        <p style={{ marginTop: 12 }}>Loading…</p>
      ) : !items?.length ? (
        <div style={{ marginTop: 12 }}>
          <p>Your cart is empty.</p>
          {/* Lien shop en fonction du mode */}
          {isAuthed ? (
            <Link to={`${base}/products`} style={{ textDecoration: "underline" }}>
              Go shopping →
            </Link>
          ) : (
            <Link to="/login" style={{ textDecoration: "underline" }}>
              Login to start shopping →
            </Link>
          )}
        </div>
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
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 12,
            }}
          >
            <strong>Total: {totalFormatted} €</strong>
            <div style={{ display: "flex", gap: 8 }}>
              {/* Option lien direct si tu préfères */}
              {/* <Link to={toCheckout}><button disabled={loading}>Proceed to Checkout</button></Link> */}
              <button onClick={goCheckout} disabled={loading}>
                Proceed to Checkout
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
