import React, { useState } from "react";

export default function CheckoutForm({ total, onSubmit }) {
  const [shipping, setShipping] = useState({
    name: "",
    street: "",
    city: "",
    zipcode: "",
    country: "",
  });
  const [payment, setPayment] = useState({
    method: "card",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ shipping, payment });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: 16, maxWidth: 500 }}
    >
      <h2>Shipping Information</h2>
      <input
        name="name"
        placeholder="Full name"
        value={shipping.name}
        onChange={handleShippingChange}
        required
      />
      <input
        name="street"
        placeholder="Street address"
        value={shipping.street}
        onChange={handleShippingChange}
        required
      />
      <input
        name="city"
        placeholder="City"
        value={shipping.city}
        onChange={handleShippingChange}
        required
      />
      <input
        name="zipcode"
        placeholder="Zipcode"
        value={shipping.zipcode}
        onChange={handleShippingChange}
        required
      />
      <input
        name="country"
        placeholder="Country"
        value={shipping.country}
        onChange={handleShippingChange}
        required
      />

      <h2>Payment</h2>
      <select
        name="method"
        value={payment.method}
        onChange={handlePaymentChange}
      >
        <option value="card">Credit/Debit Card</option>
        <option value="paypal">PayPal</option>
      </select>

      {payment.method === "card" && (
        <>
          <input
            name="cardNumber"
            placeholder="Card number"
            value={payment.cardNumber}
            onChange={handlePaymentChange}
            required
          />
          <input
            name="expiry"
            placeholder="MM/YY"
            value={payment.expiry}
            onChange={handlePaymentChange}
            required
          />
          <input
            name="cvc"
            placeholder="CVC"
            value={payment.cvc}
            onChange={handlePaymentChange}
            required
          />
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Total: {total} €</strong>
        <button type="submit">Place order</button>
      </div>
    </form>
  );
}
