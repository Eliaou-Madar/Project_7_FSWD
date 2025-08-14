import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

export default function ProductCard({ product }) {
  const { add } = useCart();
  if (!product) return null;

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <Link to={`/product/${product.id}`} style={{ color: "inherit", textDecoration: "none" }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }}
        />
        <h3 style={{ margin: "8px 0 4px" }}>{product.name}</h3>
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{product.price} €</strong>
        <button onClick={() => add(product.id, 1)}>Add</button>
      </div>
    </div>
  );
}
