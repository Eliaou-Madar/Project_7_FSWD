import React from "react";

export default function OrderList({ orders = [], activeId, onSelect }) {
  if (!orders.length) return <p>No orders yet.</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
      {orders.map((o) => (
        <li
          key={o.id}
          onClick={() => onSelect?.(o.id)}
          style={{
            border: "1px solid #eee",
            borderRadius: 10,
            padding: 12,
            marginBottom: 10,
            cursor: "pointer",
            background: activeId === o.id ? "#f6f9ff" : "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Order #{o.id}</strong>
            <span>{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 14, opacity: 0.9 }}>
            <span>Status: <b>{o.status || "pending"}</b></span>
            <span>•</span>
            <span>Total: <b>{o.total != null ? `${o.total} €` : "-"}</b></span>
          </div>
        </li>
      ))}
    </ul>
  );
}
