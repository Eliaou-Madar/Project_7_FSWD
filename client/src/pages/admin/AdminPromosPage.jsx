// src/pages/admin/AdminPromosPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { promosService } from "../../services/promos.service";

// helpers for datetime-local <-> ISO
const toLocalDT = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};
const toISOFromLocal = (val) => (val ? new Date(val).toISOString() : null);

const EMPTY_FORM = {
  code: "",
  type: "percent", // 'percent' | 'fixed'
  value: 10,
  active: true,
  description: "",
  start_date: "", // bound to <input type="datetime-local">
  end_date: "",   // same
};

export default function AdminPromosPage() {
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // {id,...} | null
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await promosService.list(); // GET /api/promotions (admin)
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load promotions.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCreating(true);
  };

  const startEdit = (p) => {
    setCreating(false);
    setEditing(p);
    setForm({
      code: p.code || "",
      type: p.type || "percent",
      value: Number.isFinite(p.value) ? p.value : 0,
      active: !!p.active,
      description: p.description || "",
      start_date: toLocalDT(p.start_date),
      end_date: toLocalDT(p.end_date),
    });
  };

  const resetForm = () => {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const payload = {
      ...form,
      start_date: toISOFromLocal(form.start_date),
      end_date: toISOFromLocal(form.end_date),
    };

    try {
      if (editing) {
        await promosService.update(editing.id, payload); // PUT /api/promotions/:id
      } else {
        await promosService.create(payload);             // POST /api/promotions
      }
      resetForm();
      await load();
    } catch (e) {
      console.error(e);
      setErr("Failed to save promotion.");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this promo?")) return;
    try {
      await promosService.remove(id); // DELETE /api/promotions/:id
      await load();
    } catch (e) {
      console.error(e);
      setErr("Failed to delete promotion.");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Admin · Promotions</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button onClick={startCreate}>+ New promo</button>
        {err && <span style={{ color: "crimson", marginLeft: 8 }}>{err}</span>}
      </div>

      {(creating || editing) && (
        <form
          onSubmit={submit}
          style={{
            display: "grid",
            gap: 8,
            border: "1px solid #eee",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center" }}>
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
          </div>

          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            style={{ resize: "vertical" }}
          />

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <label style={{ display: "grid", gap: 4 }}>
              <span>Start date (optional)</span>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span>End date (optional)</span>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              />
            </label>
          </div>

          <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={!!form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
            />
            Active (if dates empty, we’ll auto-fill on server/service)
          </label>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={resetForm}>Cancel</button>
            <button type="submit">{editing ? "Save changes" : "Create promo"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : !items.length ? (
        <p>No promotions.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 10,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, display: "flex", gap: 8, alignItems: "center" }}>
                  <span>{p.code}</span>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: p.active ? "#e8f7ee" : "#f5e9e9",
                      color: p.active ? "#1f7a3a" : "#8c2b2b",
                    }}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                  {p.type === "percent" ? `${p.value}%` : `${p.value} €`}
                  {p.start_date || p.end_date ? (
                    <>
                      {" · "}
                      {p.start_date ? `from ${new Date(p.start_date).toLocaleString()}` : ""}
                      {p.end_date ? ` to ${new Date(p.end_date).toLocaleString()}` : ""}
                    </>
                  ) : null}
                </div>
                {p.description ? (
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{p.description}</div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => startEdit(p)}>Edit</button>
                <button onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
