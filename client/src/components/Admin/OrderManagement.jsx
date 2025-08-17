// src/components/Admin/OrderManagement.jsx
import React, { useMemo, useState } from "react";

const STATUSES = ["pending", "paid", "shipped", "delivered", "canceled"];

export default function OrderManagement({ orders = [], onUpdateStatus }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  if (!orders.length) return <p>No orders.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Status filter:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((o) => (
          <div
            key={o.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Order #{o.id}</strong>
                <span style={{ fontSize: 13, opacity: 0.7 }}>
                  {(o.createdAt || o.created_at)
                    ? new Date(o.createdAt || o.created_at).toLocaleString()
                    : ""}
                </span>
              </div>

              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                {/* itemsCount n'existe pas dans la liste admin → affiche "-" si absent */}
                Items: {o.itemsCount ?? "-"} · Total: {o.total ?? "-"} €
              </div>

              <div style={{ marginTop: 4 }}>
                Current status: <b>{o.status || "pending"}</b>
              </div>

              {(o.username || o.email) && (
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {o.username ? `User: ${o.username}` : ""}{" "}
                  {o.email ? `· ${o.email}` : ""}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={o.status || "pending"}
                onChange={(e) => onUpdateStatus?.(o.id, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button onClick={() => onUpdateStatus?.(o.id, "canceled")}>
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
