// client/src/pages/admin/AdminProductsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { productsService } from "../../services/products.service";
import ProductForm from "../../components/Admin/ProductForm.jsx";
import "../../styles/admin.css";
import "./AdminProductsPage.css";

/* --- helpers image comme ProductPage --- */
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

function pickImageUrl(product) {
  if (product?.url) return product.url;
  const imgs = product?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const first = imgs[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.url || first.src || first.path || null;
  }
  if (product?.image) return product.image;
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

function AdminThumb({ product, size = 80 }) {
  const raw = useMemo(() => pickImageUrl(product), [product]);
  const candidates = useMemo(() => buildCandidates(raw), [raw]);
  const [src, setSrc] = useState(DATA_URI_PIXEL);

  useEffect(() => {
    let alive = true;
    preloadFirstWorking(candidates).then((ok) => {
      if (alive) setSrc(ok);
    });
    return () => {
      alive = false;
    };
  }, [candidates]);

  return (
    <img
      key={src}
      src={src}
      alt={product?.name || "Product"}
      width={size}
      height={size}
      className="img-thumb"
      style={{ objectFit: "cover", borderRadius: 8 }}
    />
  );
}

/* --- Page Admin --- */
export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await productsService.list(query);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (form) => {
    try {
      await productsService.create(form);
      setCreating(false);
      await load(q);
    } catch (e) {
      alert(e?.message || "Create failed");
    }
  };

  const onUpdate = async (id, form) => {
    try {
      await productsService.update(id, form);
      setEditing(null);
      await load(q);
    } catch (e) {
      alert(e?.message || "Update failed");
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productsService.remove(id);
      await load(q);
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  const search = (e) => {
    e.preventDefault();
    load(q.trim());
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Admin · Products</h1>
        <form onSubmit={search} className="search-form spacer products-search">
          <input
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" className="btn">Search</button>
        </form>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          + New product
        </button>
      </header>

      {creating && (
        <div className="panel" style={{ marginTop: 12 }}>
          <ProductForm
            onCancel={() => setCreating(false)}
            onSubmit={(fd) => onCreate(fd)}
          />
        </div>
      )}
      {editing && (
        <div className="panel" style={{ marginTop: 12 }}>
          <ProductForm
            initialValues={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(fd) =>
              onUpdate(editing.id ?? editing.product_id ?? editing._id, fd)
            }
          />
        </div>
      )}

      {loading && <p className="status-loading">Loading…</p>}
      {!!error && <p className="status-error">{error}</p>}
      {!loading && !error && !items.length && <p className="status-empty">No products.</p>}

      {!loading && !error && !!items.length && (
        <div className="products-list">
          {items.map((p) => {
            const id = p.id ?? p.product_id ?? p._id;
            return (
              <div key={id} className="product-card">
                <AdminThumb product={p} />
                <div>
                  <div className="product-title">{p.name}</div>
                  <div className="product-meta">
                    {p.brand ? `${p.brand} · ` : ""}{p.price} €
                    {p.sku ? ` · SKU: ${p.sku}` : ""} {p.is_limited ? " · Limited" : ""}
                  </div>
                </div>
                <div className="actions">
                  <button className="btn" onClick={() => setEditing({ ...p, id })}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => onDelete(id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
