import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { productsService } from "../../services/products.service";
import "./ProductCard.css";

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

function firstImage(product) {
  if (product?.url) return product.url;
  const imgs = product?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const f = imgs[0];
    if (typeof f === "string") return f;
    if (f && typeof f === "object") return f.url || f.src || f.path || null;
  }
  return null;
}

function mapSizeRow(s) {
  const id = Number(s.product_size_id ?? s.size_id ?? s.id ?? s.ps_id ?? s.psid ?? NaN);
  if (!Number.isInteger(id) || id <= 0) return null;
  const labelRaw = s.size_label ?? s.label ?? s.size ?? s.name ?? s.value ?? id;
  const label = String(labelRaw);
  const stockRaw = s.stock_qty ?? s.stock ?? s.qty ?? s.quantity ?? s.qty_in_stock ?? s.in_stock ?? null;
  let stock = null;
  if (stockRaw !== null && stockRaw !== undefined) {
    const n = Number(stockRaw);
    stock = Number.isFinite(n) ? n : null;
  }
  if (stock === null && (s.available === true || s.is_available === true)) stock = 999;
  return { id, label, stock };
}

function normalizeSizesFromProduct(product) {
  const raw = Array.isArray(product?.sizes) ? product.sizes : [];
  return raw.map(mapSizeRow).filter(Boolean);
}

export default function ProductCard({ product, to }) {
  const { add: addCart, setQty, items } = useCart();
  if (!product) return null;

  const productId = Number(product.id);
  if (!Number.isInteger(productId) || productId <= 0) return null;

  const brand = product.brand ?? product.maker ?? "";
  const name = product.name ?? product.title ?? "Unnamed";

  const basePrice = useMemo(() => {
    const p = product.price ?? product.unit_price ?? null;
    return typeof p === "string" ? Number(p) : p;
  }, [product]);

  const candidate = cleanUrl(firstImage(product)) || PROJECT_FALLBACK;
  const [src, setSrc] = useState(candidate);
  useEffect(() => setSrc(candidate), [candidate]);

  const initialSizes = useMemo(() => normalizeSizesFromProduct(product), [product]);
  const [sizes, setSizes] = useState(initialSizes);

  useEffect(() => {
    let alive = true;
    async function fetchSizes() {
      if (sizes.length > 0) return;
      try {
        const full = await productsService.getById(productId);
        const mapped = normalizeSizesFromProduct(full);
        if (alive && mapped.length) setSizes(mapped);
      } catch (e) {
        console.warn("getById failed, sizes unknown", e);
      }
    }
    fetchSizes();
    return () => { alive = false; };
  }, [productId, sizes.length]);

  const defaultSizeId = sizes.find((s) => (s.stock ?? 1) > 0)?.id ?? sizes[0]?.id ?? null;
  const [selectedSizeId, setSelectedSizeId] = useState(defaultSizeId);
  useEffect(() => { setSelectedSizeId(defaultSizeId); }, [defaultSizeId]);

  const [qty, setQtyLocal] = useState(1);
  const inc = () => setQtyLocal((q) => Math.min(99, q + 1));
  const dec = () => setQtyLocal((q) => Math.max(1, q - 1));

  const priceText = basePrice != null ? `${basePrice} €` : "—";

  // ✅ utilise l'URL passée par le parent (sécurisé)
  const href = to || `/products/${productId}`;

  const onAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sizeId = Number(selectedSizeId);
    if (!Number.isInteger(sizeId) || sizeId <= 0) {
      alert("Choisis une taille valide.");
      return;
    }
    try {
      await addCart(sizeId, qty);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        const existing = items.find((it) => Number(it.id) === sizeId);
        const nextQty = (existing?.qty ?? 0) + qty;
        await setQty(sizeId, nextQty);
      } else {
        console.error("cart add failed", status, err?.response?.data || err);
        alert("Impossible d'ajouter au panier.");
      }
    }
  };

  return (
    <div className="pc-card">
      <Link to={href} className="pc-link">
        <img
          className="pc-img"
          src={src || DATA_URI_PIXEL}
          alt={name}
          loading="lazy"
          onError={() => setSrc(PROJECT_FALLBACK)}
        />
        <h3 className="pc-title">{name}</h3>
        {brand ? <div className="pc-brand">{brand}</div> : null}
      </Link>

      {sizes.length > 0 ? (
        <div className="pc-sizes">
          <label>Size</label>
          <select
            className="pdp-select pc-select"
            value={selectedSizeId ?? ""}
            onChange={(e) => setSelectedSizeId(Number(e.target.value) || null)}
          >
            {sizes.map((s) => {
              const out = (s.stock ?? 1) <= 0;
              return (
                <option key={s.id} value={s.id} disabled={out}>
                  {s.label} {out ? "(out of stock)" : s.stock != null ? `(stock: ${s.stock})` : ""}
                </option>
              );
            })}
          </select>
        </div>
      ) : (
        <div className="pc-sizes-loading">Loading sizes…</div>
      )}

      <div className="pc-foot">
        <strong className="pc-price">{priceText}</strong>
        <div className="pc-qty-group">
          <button type="button" className="pc-btn pc-btn-icon" onClick={dec}>−</button>
          <input
            className="pc-qty-input"
            type="number"
            min={1}
            max={99}
            value={qty}
            onChange={(e) => setQtyLocal(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          />
          <button type="button" className="pc-btn pc-btn-icon" onClick={inc}>+</button>
          <button
            type="button"
            className="pc-btn pc-add"
            onClick={onAdd}
            disabled={basePrice == null || !selectedSizeId || sizes.length === 0}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
