// src/pages/admin/AdminOrdersPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { ordersService } from "../../services/orders.service";
import OrderManagement from "../../components/Admin/OrderManagement.jsx";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalize = (rows) =>
    rows.map((o) => ({
      ...o,
      // normalise created_at -> createdAt
      createdAt: o.createdAt ?? o.created_at ?? null,
    }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await ordersService.list(); // GET /api/admin/orders
      const rows = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setOrders(normalize(rows));
    } catch (e) {
      console.error("AdminOrdersPage load error:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await ordersService.updateStatus(id, status); // PATCH /api/admin/orders/:id
      await load();
    } catch (e) {
      console.error("updateStatus error:", e);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Admin · Orders</h1>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <OrderManagement orders={orders} onUpdateStatus={updateStatus} />
      )}
    </div>
  );
}
