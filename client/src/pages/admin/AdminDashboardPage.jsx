import React from "react";
import { Link } from "react-router-dom";

export default function AdminDashboardPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Admin Dashboard</h1>
      <p>Manage products, orders and promotions.</p>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          marginTop: 12,
        }}
      >
        <Link to="/admin/products" className="card-link">
          <div className="card" style={cardStyle}>Products</div>
        </Link>
        <Link to="/admin/orders" className="card-link">
          <div className="card" style={cardStyle}>Orders</div>
        </Link>
        <Link to="/admin/promos" className="card-link">
          <div className="card" style={cardStyle}>Promotions</div>
        </Link>
      </div>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 16,
  fontWeight: 600,
  textAlign: "center",
  background: "#fff",
};
