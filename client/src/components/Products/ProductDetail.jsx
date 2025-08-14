import React, { useState } from "react";
import { useCart } from "../../context/CartContext";

export default function ProductDetail({ product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const onAdd = async () => {
    const n = Math.max(1, Number(qty) || 1);
    await add(product.id, n);
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
      <div>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 12 }}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{product.name}</h1>
        <p style={{ opacity: 0.9 }}>{product.description}</p>
        <strong style={{ fontSize: 22 }}>{product.price} €</strong>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label htmlFor="qty">Qty</label>
          <input
            id="qty"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            style={{ width: 80 }}
          />
          <button onClick={onAdd}>Add to cart</button>
        </div>

        {Array.isArray(product.attributes) && product.attributes.length > 0 && (
          <section>
            <h3>Details</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {product.attributes.map((a, i) => (
                <li key={i}>
                  {a.label ? <strong>{a.label}: </strong> : null}
                  {a.value ?? a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(product.images) && product.images.length > 1 && (
          <section>
            <h3>Gallery</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {product.images.slice(1).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${product.name} ${i + 2}`}
                  width={96}
                  height={96}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
