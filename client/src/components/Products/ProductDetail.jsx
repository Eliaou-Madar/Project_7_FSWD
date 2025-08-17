// client/src/components/Products/ProductDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";

// --- mêmes helpers/constantes que dans ProductCard ---
function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return null;
}

const DATA_URI_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

const PROJECT_FALLBACK = "/img/placeholder.jpg";

function cleanUrl(u) {
  if (!u) return null;
  let s = String(u)
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .replace(/\\/g, "/");
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  if (!s.startsWith("/")) s = "/" + s;
  return s;
}

function pickImageUrl(product) {
  if (product?.url) return product.url;
  if (product?.image) return product.image;
  const imgs = product?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const first = imgs[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.url || first.src || first.path || null;
  }
  return null;
}

function buildCandidates(raw) {
  const cleaned = cleanUrl(raw);
  const list = [];
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (cleaned) {
    list.push(cleaned);
    if (origin) list.push(new URL(cleaned, origin).href);

    const noSlash = cleaned.startsWith("/") ? cleaned.slice(1) : cleaned;
    list.push(noSlash);
    if (origin) list.push(new URL(noSlash, origin + "/").href);
  }

  list.push(PROJECT_FALLBACK);
  list.push(DATA_URI_PIXEL);

  return Array.from(new Set(list));
}

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
// --- fin helpers ---

export default function ProductDetail({ product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const name = firstDefined(product.name, product.title, "Unnamed");
  const price =
    typeof product.price === "string" ? Number(product.price) : firstDefined(product.price, null);

  // Même pipeline que ProductCard pour l’image principale
  const rawCandidate = useMemo(() => pickImageUrl(product), [product]);
  const candidates = useMemo(() => buildCandidates(rawCandidate), [rawCandidate]);
  const [displaySrc, setDisplaySrc] = useState(DATA_URI_PIXEL);

  useEffect(() => {
    let alive = true;
    preloadFirstWorking(candidates).then((ok) => {
      if (alive) setDisplaySrc(ok);
    });
    return () => {
      alive = false;
    };
  }, [candidates]);

  const onAdd = async () => {
    const n = Math.max(1, Number(qty) || 1);
    await add(product.id, n);
  };

  // Petits thumbs : on normalise + fallback simple via onError
  const gallery = Array.isArray(product.images) ? product.images.slice(1) : [];

  return (
    <div style={{ padding: 16, display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
      <div>
        <img
          key={displaySrc}
          src={displaySrc}
          alt={name}
          style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 12 }}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{name}</h1>
        {product.description ? <p style={{ opacity: 0.9 }}>{product.description}</p> : null}
        <strong style={{ fontSize: 22 }}>{price != null ? `${price} €` : "—"}</strong>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label htmlFor="qty">Qty</label>
          <input
            id="qty"
            type="number"
            min={1}
            max={99}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            style={{ width: 80 }}
          />
          <button onClick={onAdd} disabled={price == null}>
            Add to cart
          </button>
        </div>

        {gallery.length > 0 && (
          <section>
            <h3>Gallery</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {gallery.map((g, i) => {
                const src =
                  typeof g === "string" ? cleanUrl(g) : cleanUrl(g?.url || g?.src || g?.path);
                return (
                  <img
                    key={i}
                    src={src || DATA_URI_PIXEL}
                    alt={`${name} ${i + 2}`}
                    width={96}
                    height={96}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DATA_URI_PIXEL;
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
