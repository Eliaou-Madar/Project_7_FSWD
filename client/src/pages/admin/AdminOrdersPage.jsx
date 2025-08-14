import React, { useEffect, useState } from "react";
import { ordersService } from "../../services/orders.service";
import OrderManagement from "../../components/Admin/OrderManagement.jsx";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      // Même endpoint que côté client, mais tu peux prévoir /api/admin/orders si tu préfères
      const data = await ordersService.list();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    // ⚠️ Ajoute côté service si absent:
    // ordersService.updateStatus = (id, status) => http.patch(`/admin/orders/${id}`, { status })
    await ordersService.updateStatus(id, status);
    await load();
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Admin · Orders</h1>
      {loading ? <p>Loading…</p> : <OrderManagement orders={orders} onUpdateStatus={updateStatus} />}
    </div>
  );
}
