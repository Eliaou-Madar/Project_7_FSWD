import React from "react";

export default function CartItem({ item, onRemove }) {
  if (!item) return null;
  const { product = {}, qty = 1, subtotal } = item;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "72px 1fr auto",
        gap: 12,
        alignItems: "center",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 10,
      }}
    >
      <img
        src={product.image}
        alt={product.name}
        width={72}
        height={72}
        style={{ objectFit: "cover", borderRadius: 8 }}
      />
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontWeight: 600 }}>{product.name}</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Price: {product.price} € · Qty: {qty}
        </div>
      </div>
      <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
        <strong>{subtotal != null ? `${subtotal} €` : `${(product.price || 0) * qty} €`}</strong>
        <button onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}
