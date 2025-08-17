// src/components/Cart/CartItem.jsx
import React, { useState } from "react";
import { useCart } from "../../context/CartContext";

export default function CartItem({ item }) {
  if (!item) return null;

  const { setQty, remove } = useCart(); // ✅ utilise le contexte qui refresh
  const key = item.id ?? item.key ?? item.product_size_id;
  const p = item.product || {};
  const [localQty, setLocalQty] = useState(Number(item.qty ?? 1));
  const [pending, setPending] = useState(false);

  const name = p.name ?? "Product";
  const price = Number(p.price ?? 0);
  const image = p.image || "";
  const size = p.size ?? null;
  const subtotal = (price * localQty).toFixed(2);

  const applyQty = async (nextQty) => {
    const q = Math.max(1, Math.min(99, Number(nextQty) || 1));
    setLocalQty(q);                 // petit optimisme visuel
    setPending(true);
    try {
      await setQty(key, q);         // 👉 API + refresh auto
    } finally {
      setPending(false);
    }
  };

  const inc = () => applyQty(localQty + 1);
  const dec = () => applyQty(localQty - 1);

  const onRemove = async () => {
    setPending(true);
    try {
      await remove(key);            // 👉 API + refresh auto
    } finally {
      setPending(false);
    }
  };

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
        opacity: pending ? 0.6 : 1,
      }}
    >
      {image ? (
        <img src={image} alt={name} width={72} height={72} style={{ objectFit: "cover", borderRadius: 8 }} />
      ) : (
        <div style={{ width: 72, height: 72, borderRadius: 8, background: "#f2f2f2" }} />
      )}

      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontWeight: 600 }}>
          {name} {size ? <span style={{ opacity: 0.7 }}>(size {size})</span> : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{price.toFixed(2)} €</strong>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button type="button" onClick={dec} disabled={pending || localQty <= 1} style={{ width: 28 }}>-</button>
            <input
              value={localQty}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) setLocalQty(Math.max(1, Math.min(99, v)));
              }}
              onBlur={() => applyQty(localQty)}
              inputMode="numeric"
              style={{ width: 40, textAlign: "center" }}
              disabled={pending}
            />
            <button type="button" onClick={inc} disabled={pending} style={{ width: 28 }}>+</button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
        <strong>{subtotal} €</strong>
        <button onClick={onRemove} disabled={pending}>Remove</button>
      </div>
    </div>
  );
}
