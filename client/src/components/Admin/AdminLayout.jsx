import React from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";

export default function AdminLayout() {
  const { userId } = useParams();
  const base = `/users/${userId}/admin`;
  const mkTo = (sub) => `${base}/${sub}`;

  return (
    <div style={wrap}>
      <aside style={aside}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Admin</h2>
        <nav style={{ display: "grid", gap: 6, marginTop: 12 }}>
          <AdminLink to={mkTo("orders")}    label="Orders" />
          <AdminLink to={mkTo("products")}  label="Products" />
          <AdminLink to={mkTo("promos")}    label="Promotions" />
        </nav>
      </aside>
      <main style={main}>
        <Outlet />
      </main>
    </div>
  );
}

function AdminLink({ to, label, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      style={({ isActive }) => ({
        padding: "8px 10px",
        borderRadius: 8,
        textDecoration: "none",
        color: isActive ? "#0b5" : "#111",
        background: isActive ? "rgba(0,187,85,0.08)" : "transparent",
        border: isActive ? "1px solid rgba(0,187,85,0.35)" : "1px solid #eee",
        fontWeight: 600,
      })}
    >
      {label}
    </NavLink>
  );
}

const wrap = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  gap: 16,
  padding: 16,
  alignItems: "start",
};
const aside = {
  position: "sticky",
  top: 0,
  alignSelf: "start",
  display: "grid",
  gap: 10,
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 12,
  background: "#fff",
};
const main = { minHeight: "60vh" };
