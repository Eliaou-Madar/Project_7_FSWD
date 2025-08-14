import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { ordersService } from "../services/orders.service";
import CheckoutForm from "../components/Checkout/CheckoutForm.jsx";

export default function CheckoutPage() {
  const { cart, clear } = useCart();
  const [status, setStatus] = useState({ type: "", msg: "" });

  const handleCheckout = async (formData) => {
    try {
      await ordersService.checkout({
        cartId: cart.id,
        shipping: formData.shipping,
        payment: formData.payment,
      });
      await clear();
      setStatus({ type: "success", msg: "Order placed successfully ✅" });
    } catch {
      setStatus({ type: "error", msg: "Checkout failed ❌" });
    }
  };

  if (!cart?.items?.length) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Checkout</h1>
      {status.msg && (
        <div
          style={{
            margin: "12px 0",
            padding: "10px 12px",
            borderRadius: 8,
            background: status.type === "success" ? "#e8f7ee" : "#fee",
            color: status.type === "success" ? "#0a7a3b" : "#a20000",
          }}
        >
          {status.msg}
        </div>
      )}
      <CheckoutForm total={cart.total} onSubmit={handleCheckout} />
    </div>
  );
}
