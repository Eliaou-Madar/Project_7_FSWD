import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { cartService } from "../../services/cart.service";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { userId } = useParams();
  if (!product) return null;

  const id = product.id ?? product.product_id ?? product.sku;
  const productSizeId =
    product.product_size_id ?? product.size_id ?? product.sizeId ?? id;

  const name = product.name ?? product.title ?? "Unnamed";
  const price = product.price ?? product.unit_price ?? null;
  const img =
    product.image ??
    product.image_url ??
    (Array.isArray(product.images) && product.images.length ? product.images[0] : null);

  const [qty, setQty] = useState(1);
  const href = userId ? `/users/${userId}/products/${id}` : `./${id}`;

  const inc = () => setQty((q) => Math.min(99, q + 1));
  const dec = () => setQty((q) => Math.max(1, q - 1));

  const onAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const sizeIdInt = Number(productSizeId);
    const isValidSizeId = Number.isInteger(sizeIdInt) && sizeIdInt > 0;
    if (!isValidSizeId) {
      console.error("Invalid product_size_id", { productSizeId });
      alert("Invalid product size id");
      return;
    }

    try {
      console.log("Add to cart click", { product_size_id: sizeIdInt, qty });
      await cartService.add(sizeIdInt, qty); // POST /api/cart/items (auth requis)
      addToCart({ ...product, id }, qty);    // MAJ locale
    } catch (err) {
      console.error("cart add failed", err?.response?.status, err?.response?.data || err);
      alert("Failed to add to cart");
    }
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <Link to={href} style={{ color: "inherit", textDecoration: "none" }}>
        {img ? (
          <img
            src={img}
            alt={name}
            style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          <div style={{ width: "100%", height: 160, borderRadius: 8, background: "#f2f2f2" }} />
        )}
        <h3 style={{ margin: "8px 0 4px" }}>{name}</h3>
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <strong>{price != null ? `${price} €` : "—"}</strong>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button type="button" onClick={dec} aria-label="Decrease" style={{ width: 28 }}>
            -
          </button>
          <input
            value={qty}
            onChange={(e) => {
              const v = Math.max(1, Math.min(99, Number(e.target.value) || 1));
              setQty(v);
            }}
            inputMode="numeric"
            style={{ width: 40, textAlign: "center" }}
          />
          <button type="button" onClick={inc} aria-label="Increase" style={{ width: 28 }}>
            +
          </button>

          <button type="button" onClick={onAdd}>Add</button>
        </div>
      </div>
    </div>
  );
}
