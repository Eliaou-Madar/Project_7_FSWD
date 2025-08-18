// client/src/components/Products/ProductDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import { productsService } from "../../services/products.service";

/* Helpers image */
const DATA_URI_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
const PROJECT_FALLBACK = "/img/placeholder.jpg";

function cleanUrl(u) {
  if (!u) return null;
  let s = String(u).trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "").replace(/\\/g, "/");
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  if (!s.startsWith("/")) s = "/" + s;
  return s;
}
function mainImage(product) {
  if (product?.url) return product.url;
  if (product?.image) return product.image;
  const imgs = product?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const f = imgs[0];
    if (typeof f === "string") return f;
    if (f && typeof f === "object") return f.url || f.src || f.path || null;
  }
  return null;
}

/* Tailles */
function mapSizeRow(s) {
  const id = Number(s.product_size_id ?? s.size_id ?? s.id ?? s.ps_id ?? s.psid ?? NaN);
  if (!Number.isInteger(id) || id <= 0) return null;

  const labelRaw = s.size_label ?? s.label ?? s.size ?? s.name ?? s.value ?? id;
  const label = String(labelRaw);

  const stockRaw =
    s.stock_qty ?? s.stock ?? s.qty ?? s.quantity ?? s.qty_in_stock ?? s.in_stock ?? null;

  let stock = null;
  if (stockRaw !== null && stockRaw !== undefined) {
    const n = Number(stockRaw);
    stock = Number.isFinite(n) ? n : null;
  }
  if (stock === null && (s.available === true || s.is_available === true)) {
    stock = 999; // “dispo” inconnu => on considère dispo
  }

  return { id, label, stock };
}
function normalizeSizesFromProduct(product) {
  const raw = Array.isArray(product?.sizes) ? product.sizes : [];
  return raw.map(mapSizeRow).filter(Boolean);
}

export default function ProductDetail({ product }) {
  const { add: addCart, setQty, items } = useCart();
  if (!product) return null;

  const productId = Number(product.id);
  if (!Number.isInteger(productId) || productId <= 0) return null;

  const brand = product.brand ?? product.maker ?? "";
  const name = product.name ?? product.title ?? "Unnamed";
  const price = useMemo(() => {
    const p = product.price ?? product.unit_price ?? null;
    return typeof p === "string" ? Number(p) : p;
  }, [product]);

  // Image principale
  const candidate = cleanUrl(mainImage(product)) || PROJECT_FALLBACK;
  const [displaySrc, setDisplaySrc] = useState(candidate);
  useEffect(() => setDisplaySrc(candidate), [candidate]);

  // Tailles (depuis le produit, avec lazy-load si nécessaire)
  const initialSizes = useMemo(() => normalizeSizesFromProduct(product), [product]);
  const [sizes, setSizes] = useState(initialSizes);

  useEffect(() => {
    let alive = true;
    async function fetchFull() {
      if (sizes.length > 0) return;
      try {
        const full = await productsService.getById(productId);
        const mapped = normalizeSizesFromProduct(full);
        if (alive && mapped.length) setSizes(mapped);
      } catch (e) {
        console.warn("getById failed (sizes)", e);
      }
    }
    fetchFull();
    return () => { alive = false; };
  }, [productId, sizes.length]);

  const defaultSizeId =
    sizes.find((s) => (s.stock ?? 1) > 0)?.id ?? sizes[0]?.id ?? null;
  const [selectedSizeId, setSelectedSizeId] = useState(defaultSizeId);
  useEffect(() => { setSelectedSizeId(defaultSizeId); }, [defaultSizeId]);

  // Quantité
  const [qty, setQtyLocal] = useState(1);
  const inc = () => setQtyLocal((q) => Math.min(99, q + 1));
  const dec = () => setQtyLocal((q) => Math.max(1, q - 1));

  // Galerie secondaire
  const gallery = Array.isArray(product.images) ? product.images.slice(1) : [];

  const onAdd = async () => {
    const n = Math.max(1, Number(qty) || 1);
    const sizeId = Number(selectedSizeId);
    if (!Number.isInteger(sizeId) || sizeId <= 0) {
      alert("Choisis une taille valide.");
      return;
    }
    try {
      // ✅ Backend attend product_size_id
      await addCart(sizeId, n);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        // déjà présent → incrément
        const existing = items.find((it) => Number(it.id) === sizeId);
        const nextQty = (existing?.qty ?? 0) + n;
        await setQty(sizeId, nextQty);
      } else {
        console.error("cart add failed", status, err?.response?.data || err);
        alert("Impossible d'ajouter au panier.");
      }
    }
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr" }}>
      {/* Image */}
      <div>
        <img
          src={displaySrc || DATA_URI_PIXEL}
          alt={name}
          style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 12 }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PROJECT_FALLBACK;
          }}
        />
        {gallery.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {gallery.map((g, i) => {
              const src = typeof g === "string" ? cleanUrl(g) : cleanUrl(g?.url || g?.src || g?.path);
              return (
                <img
                  key={i}
                  src={src || DATA_URI_PIXEL}
                  alt={`${name} ${i + 2}`}
                  width={96}
                  height={96}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DATA_URI_PIXEL; }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Détails */}
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{name}</h1>
        {brand ? <div style={{ opacity: 0.85 }}>Marque : <strong>{brand}</strong></div> : null}
        {product.description ? <p style={{ opacity: 0.9 }}>{product.description}</p> : null}
        <strong style={{ fontSize: 22 }}>{price != null ? `${price} €` : "—"}</strong>

        {/* Sélecteur de taille + stock */}
        {sizes.length > 0 ? (
          <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
            <label style={{ fontSize: 14, opacity: 0.9 }}>Taille</label>
            <select
              value={selectedSizeId ?? ""}
              onChange={(e) => setSelectedSizeId(Number(e.target.value) || null)}
              style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", maxWidth: 240 }}
            >
              {sizes.map((s) => {
                const out = (s.stock ?? 1) <= 0;
                return (
                  <option key={s.id} value={s.id} disabled={out}>
                    {s.label} {out ? "(épuisé)" : s.stock != null ? `(stock: ${s.stock})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <div style={{ marginTop: 6, fontSize: 12, color: "#a00" }}>
            Chargement des tailles…
          </div>
        )}

        {/* Quantité + Add */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <label htmlFor="qty">Qté</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button type="button" onClick={dec} style={{ width: 28 }}>-</button>
            <input
              id="qty"
              type="number"
              min={1}
              max={99}
              value={qty}
              onChange={(e) => setQtyLocal(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
              style={{ width: 80, textAlign: "center" }}
            />
            <button type="button" onClick={inc} style={{ width: 28 }}>+</button>
          </div>
          <button
            onClick={onAdd}
            disabled={price == null || !selectedSizeId || sizes.length === 0}
            style={{ marginLeft: 8 }}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
