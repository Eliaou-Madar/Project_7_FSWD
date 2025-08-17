// client/src/components/Products/ProductCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { cartService } from "../../services/cart.service";

function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return null;
}

// Fallback final garanti (pixel 1x1 PNG en data URI)
const DATA_URI_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

// Facultatif: fallback projet (si tu as bien ce fichier)
const PROJECT_FALLBACK = "/img/placeholder.jpg";

// Nettoie et normalise une URL
function cleanUrl(u) {
  if (!u) return null;
  let s = String(u).trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "").replace(/\\/g, "/");
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  if (!s.startsWith("/")) s = "/" + s;
  return s;
}

// Récupère l'URL d'image depuis product: url | images[0] | images[0].url
function pickImageUrl(product) {
  if (product?.url) return product.url;
  const imgs = product?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const first = imgs[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.url || first.src || first.path || null;
  }
  return null;
}

// Essaie les variantes de l'URL: relative/absolue
function buildCandidates(raw) {
  const cleaned = cleanUrl(raw);
  const list = [];
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (cleaned) {
    // 1) telle quelle (ex: /img/shoes/1.jpg)
    list.push(cleaned);

    // 2) absolue (http://localhost:5173/img/shoes/1.jpg)
    if (origin) list.push(new URL(cleaned, origin).href);

    // 3) sans slash initial (img/shoes/1.jpg)
    const noSlash = cleaned.startsWith("/") ? cleaned.slice(1) : cleaned;
    list.push(noSlash);

    // 4) absolue sans slash initial
    if (origin) list.push(new URL(noSlash, origin + "/").href);
  }

  // 5) fallback projet (si présent), sinon data URI
  list.push(PROJECT_FALLBACK);
  list.push(DATA_URI_PIXEL);

  // supprime doublons
  return Array.from(new Set(list));
}

// Précharge une liste d'URLs et renvoie la 1ère qui charge
function preloadFirstWorking(urls) {
  return new Promise((resolve) => {
    let i = 0;
    const tryNext = () => {
      if (i >= urls.length) return resolve(DATA_URI_PIXEL);
      const testUrl = urls[i++];
      const img = new Image();
      img.onload = () => resolve(testUrl);
      img.onerror = () => tryNext();
      img.src = testUrl;
    };
    tryNext();
  });
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  if (!product) return null;

  const id = firstDefined(product.id, product.product_id, product.sku);
  if (!id) return null;

  const productSizeId = firstDefined(product.product_size_id, product.size_id, product.sizeId, id);
  const name = firstDefined(product.name, product.title, "Unnamed");
  const price = useMemo(() => {
    const p = firstDefined(product.price, product.unit_price, null);
    return typeof p === "string" ? Number(p) : p;
  }, [product]);

  // Candidat principal depuis product (d'après ton log: images[0] = "/img/shoes/1.jpg")
  const rawCandidate = useMemo(() => pickImageUrl(product), [product]);
  const candidates = useMemo(() => buildCandidates(rawCandidate), [rawCandidate]);

  const [displaySrc, setDisplaySrc] = useState(DATA_URI_PIXEL);

  useEffect(() => {
    let alive = true;
    if (import.meta.env.DEV) {
      console.log("---- ProductCard image debug ----");
      console.log("product.id        =", id);
      console.log("raw candidate     =", rawCandidate);
      console.log("candidates to try =", candidates);
    }
    preloadFirstWorking(candidates).then((ok) => {
      if (alive) {
        if (import.meta.env.DEV) console.log("✅ picked image src =", ok);
        setDisplaySrc(ok);
      }
    });
    return () => {
      alive = false;
    };
  }, [id, rawCandidate, candidates]);

  const [qty, setQty] = useState(1);
  const href = `/products/${id}`;
  const inc = () => setQty((q) => Math.min(99, q + 1));
  const dec = () => setQty((q) => Math.max(1, q - 1));

  const onAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sizeIdInt = Number(productSizeId);
    if (!Number.isInteger(sizeIdInt) || sizeIdInt <= 0) {
      console.error("Invalid product_size_id", { productSizeId });
      alert("Invalid product size id");
      return;
    }
    try {
      await cartService.add(sizeIdInt, qty);
      addToCart({ ...product, id }, qty);
    } catch (err) {
      console.error("cart add failed", err?.response?.status, err?.response?.data || err);
     
    }
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <Link to={href} style={{ color: "inherit", textDecoration: "none" }}>
        <img
          key={displaySrc /* force re-render si src change */}
          src={displaySrc}
          alt={name}
          loading="lazy"
          style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }}
        />
        <h3 style={{ margin: "8px 0 4px" }}>{name}</h3>
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <strong>{price != null ? `${price} €` : "—"}</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button type="button" onClick={dec} style={{ width: 28 }}>-</button>
          <input
            type="number"
            min={1}
            max={99}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            style={{ width: 48, textAlign: "center" }}
          />
          <button type="button" onClick={inc} style={{ width: 28 }}>+</button>
          <button type="button" onClick={onAdd} disabled={price == null}>Add</button>
        </div>
      </div>
    </div>
  );
}
