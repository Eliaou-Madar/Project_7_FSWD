import React, { useEffect, useState } from "react";
import { ordersService } from "../services/orders.service";
import OrderList from "../components/Orders/OrderList.jsx";
import OrderDetail from "../components/Orders/OrderDetail.jsx";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      try {
        const data = await ordersService.list(); // [{id, status, total, createdAt, ...}]
        setOrders(data || []);
        if (data?.length) setActiveId(data[0].id);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
      <section>
        <h1>My Orders</h1>
        {loading ? <p>Loading…</p> : (
          <OrderList
            orders={orders}
            activeId={activeId}
            onSelect={(id) => setActiveId(id)}
          />
        )}
      </section>

      <section>
        {activeId ? (
          <OrderDetail orderId={activeId} />
        ) : (
          <p>Select an order to see details</p>
        )}
      </section>
    </div>
  );
}
