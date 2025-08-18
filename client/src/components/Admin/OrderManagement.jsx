// src/components/Orders/OrderManagement.jsx
import React, { useMemo, useState } from "react";
import "./OrderManagement.css";

const STATUSES = ["pending", "paid", "shipped", "delivered", "canceled"];

// Affiche uniquement la date (pas l'heure)
const formatDateOnly = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  // JJ/MM/AAAA
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function OrderManagement({ orders = [], onUpdateStatus }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  if (!orders.length) return <p>No orders.</p>;

  return (
    <div className="orders-container">
      <div className="orders-filter">
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

      <div className="orders-list">
        {filtered.map((o) => {
          const created = o.createdAt || o.created_at || null;
          const total =
            typeof o.total === "number"
              ? o.total.toFixed(2)
              : o.total ?? "-";

          return (
            <div key={o.id} className="order-card">
              <div>
                <div className="order-head">
                  <strong>Order #{o.id}</strong>
                  <span className="order-date">
                    {created ? formatDateOnly(created) : ""}
                  </span>
                </div>

                <div className="order-sub">
                  Items: {o.itemsCount ?? "-"} · Total: {total} €
                </div>

                <div className="order-status-line">
                  Current status:{" "}
                  <span className={`order-status ${o.status || "pending"}`}>
                    {o.status || "pending"}
                  </span>
                </div>

                {(o.username || o.email) && (
                  <div className="order-user">
                    {o.username ? `User: ${o.username}` : ""}{" "}
                    {o.email ? `· ${o.email}` : ""}
                  </div>
                )}
              </div>

              <div className="order-actions">
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
                <button
                  className="btn-cancel"
                  onClick={() => onUpdateStatus?.(o.id, "canceled")}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
