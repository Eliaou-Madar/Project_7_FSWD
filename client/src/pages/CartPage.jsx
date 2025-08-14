import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/Cart/CartItem.jsx";

export default function CartPage() {
  const { cart, remove, clear } = useCart();
  const items = cart?.items || [];
  const total = cart?.total ?? 0;

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Your Cart</h1>
        {!!items.length && (
          <button onClick={clear} style={{ marginLeft: "auto" }}>
            Clear cart
          </button>
        )}
      </header>

      {!items.length ? (
        <p style={{ marginTop: 12 }}>
          Your cart is empty. <Link to="/products">Browse products</Link>
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {items.map((i) => (
              <CartItem
                key={i.id}
                item={i}
                onRemove={() => remove(i.id)}
              />
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
            <strong>Total: {total} €</strong>
            <Link to="/checkout">
              <button>Proceed to Checkout</button>
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
