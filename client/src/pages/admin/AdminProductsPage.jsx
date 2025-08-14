import React, { useEffect, useState } from "react";
import { productsService } from "../../services/products.service";
import ProductForm from "../../components/Admin/ProductForm.jsx";

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // product | null
  const [creating, setCreating] = useState(false);

  const load = async (query = "") => {
    setLoading(true);
    try {
      const data = await productsService.list(query);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (form) => {
    await productsService.create(form); // accepte FormData
    setCreating(false);
    await load(q);
  };

  const onUpdate = async (id, form) => {
    await productsService.update(id, form); // accepte FormData ou JSON selon ton API
    setEditing(null);
    await load(q);
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await productsService.remove(id);
    await load(q);
  };

  const search = (e) => { e.preventDefault(); load(q.trim()); };

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Admin · Products</h1>
        <form onSubmit={search} style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <button onClick={() => setCreating(true)}>+ New product</button>
      </header>

      {creating && (
        <div style={{ marginTop: 12 }}>
          <ProductForm
            onCancel={() => setCreating(false)}
            onSubmit={(formData) => onCreate(formData)}
          />
        </div>
      )}

      {editing && (
        <div style={{ marginTop: 12 }}>
          <ProductForm
            initialValues={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(formData) => onUpdate(editing.id, formData)}
          />
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: 12 }}>Loading…</p>
      ) : !items.length ? (
        <p style={{ marginTop: 12 }}>No products.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {items.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 10,
                display: "grid",
                gridTemplateColumns: "80px 1fr auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <img
                src={p.image}
                alt={p.name}
                width={80}
                height={80}
                style={{ objectFit: "cover", borderRadius: 8 }}
              />
              <div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {p.price} € {p.sku ? `· SKU: ${p.sku}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditing(p)}>Edit</button>
                <button onClick={() => onDelete(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
