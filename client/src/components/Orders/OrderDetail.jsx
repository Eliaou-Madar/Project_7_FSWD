import React, { useEffect, useState } from "react";
import { ordersService } from "../../services/orders.service";

/**
 * Props:
 * - orderId: string|number (obligatoire)
 * (Optionnel) - fallback: noeud à afficher si erreur/chargement
 */
export default function OrderDetail({ orderId, fallback = null }) {
  const [order, setOrder] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let alive = true;
    const fetchOrder = async () => {
      setState({ loading: true, error: "" });
      try {
        const data = await ordersService.get(orderId);
        if (alive) setOrder(data);
      } catch (e) {
        if (alive) setState({ loading: false, error: "Failed to load order" });
      } finally {
        if (alive) setState((s) => ({ ...s, loading: false }));
      }
    };
    if (orderId) fetchOrder();
    return () => { alive = false; };
  }, [orderId]);

  if (state.loading) return fallback ?? <p>Loading order…</p>;
  if (state.error || !order) return fallback ?? <p>{state.error || "Order not found."}</p>;

  const items = order.items || [];
  const shipping = order.shipping || {};
  const payment = order.payment || {};

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0 }}>Order #{order.id}</h2>
        <span style={{ fontSize: 14, opacity: 0.75 }}>
          {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
        </span>
      </header>

      <p style={{ marginTop: 6 }}>Status: <b>{order.status || "pending"}</b></p>

      <h3>Items</h3>
      {items.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr auto",
                gap: 12,
                alignItems: "center",
                border: "1px solid #f1f1f1",
                borderRadius: 10,
                padding: 8,
              }}
            >
              <img
                src={it.product?.image}
                alt={it.product?.name}
                width={64}
                height={64}
                style={{ objectFit: "cover", borderRadius: 8 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>{it.product?.name}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Qty: {it.qty} · Price: {it.product?.price} €
                </div>
              </div>
              <div style={{ fontWeight: 700 }}>
                {it.subtotal != null ? `${it.subtotal} €` : (it.qty * (it.product?.price || 0)).toFixed(2) + " €"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No items.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <section>
          <h3>Shipping</h3>
          <div style={{ fontSize: 14 }}>
            <div>{shipping.name}</div>
            <div>{shipping.street}</div>
            <div>{shipping.city} {shipping.zipcode}</div>
            <div>{shipping.country}</div>
          </div>
        </section>

        <section>
          <h3>Payment</h3>
          <div style={{ fontSize: 14 }}>
            <div>Method: {payment.method || "-"}</div>
            <div>Paid: {payment.paid ? "Yes" : "No"}</div>
            <div>Amount: {order.total != null ? `${order.total} €` : "-"}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
