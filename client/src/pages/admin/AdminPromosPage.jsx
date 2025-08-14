import React, { useEffect, useState } from "react";
// ⚠️ Service optionnel à créer si tu gères des promos:
// promosService = { list, create, update, remove } → /api/admin/promos
import { promosService } from "../../services/promos.service";

export default function AdminPromosPage() {
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", type: "percent", value: 10, active: true });

  const load = async () => {
    const data = await promosService.list();
    setItems(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editing) await promosService.update(editing.id, form);
    else await promosService.create(form);
    setCreating(false);
    setEditing(null);
    setForm({ code: "", type: "percent", value: 10, active: true });
    await load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this promo?")) return;
    await promosService.remove(id);
    await load();
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Admin · Promotions</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => { setCreating(true); setEditing(null); }}>
          + New promo
        </button>
      </div>

      {(creating || editing) && (
        <form onSubmit={submit} style={{ display: "grid", gap: 8, border: "1px solid #eee", padding: 12, borderRadius: 10, marginBottom: 12 }}>
          <input
            placeholder="CODE"
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            required
          />
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed (€)</option>
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Value"
            value={form.value}
            onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))}
            required
          />
          <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={!!form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
            />
            Active
          </label>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => { setCreating(false); setEditing(null); }}>
              Cancel
            </button>
            <button type="submit">{editing ? "Save changes" : "Create promo"}</button>
          </div>
        </form>
      )}

      {!items.length ? (
        <p>No promotions.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((p) => (
            <div
              key={p.id}
              style={{ border: "1px solid #eee", borderRadius: 10, padding: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{p.code}</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  {p.type === "percent" ? `${p.value}%` : `${p.value} €`} · {p.active ? "Active" : "Inactive"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditing(p); setCreating(false); setForm({ code: p.code, type: p.type, value: p.value, active: !!p.active }); }}>
                  Edit
                </button>
                <button onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
