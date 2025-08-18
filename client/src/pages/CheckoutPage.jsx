// src/pages/CheckoutPage.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext";
import { ordersService } from "../services/orders.service";
import { userProfilesService } from "../services/userProfiles.service";
import { promosService } from "../services/promos.service";
import CheckoutForm from "../components/Checkout/CheckoutForm.jsx";

export default function CheckoutPage() {
  const { user } = useContext(AuthContext);
  const userId = user?.id;

  // ⚠️ adapte selon ton CartContext: items/total OU cart complet
  const { items, total, cart, clear } = useCart();
  const cartId = cart?.id ?? cart?.cart_id ?? null;

  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialShipping, setInitialShipping] = useState({
    name: "", street: "", city: "", zipcode: "", country: ""
  });

  // ---- Promo state ----
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, type:'percent|fixed', value, active, ... }
  const [applying, setApplying] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Pré-remplir avec le profil
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!userId) return;
      setLoadingProfile(true);
      try {
        const { user: u, profile: p } = await userProfilesService.getByUserId(userId);
        if (cancel) return;
        setInitialShipping({
          name: p?.full_name || `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim(),
          street: p?.street ?? "",
          city: p?.city ?? "",
          zipcode: p?.zipcode ?? "",
          country: p?.country ?? "",
        });
      } finally {
        if (!cancel) setLoadingProfile(false);
      }
    })();
    return () => { cancel = true; };
  }, [userId]);

  // Totaux
  const subTotal = useMemo(() => Number(total ?? cart?.total ?? 0), [total, cart]);
  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    const val = appliedPromo.type === "fixed"
      ? Number(appliedPromo.value || 0)
      : (subTotal * (Number(appliedPromo.value || 0) / 100));
    // Empêche un total négatif
    return Math.max(0, Math.min(subTotal, Number(val.toFixed(2))));
  }, [appliedPromo, subTotal]);
  const grandTotal = useMemo(() => Number((subTotal - discount).toFixed(2)), [subTotal, discount]);

  // Validation / application du code promo
  const handleApplyPromo = async () => {
    const code = String(promoCode || "").trim().toUpperCase();
    setPromoError("");
    setAppliedPromo(null);
    if (!code) {
      setPromoError("Entre un code promo.");
      return;
    }
    setApplying(true);
    try {
      // On récupère la liste et on cherche ce code
      const promos = await promosService.list(); // map déjà {active, type, value, start_date, end_date...}
      const found = promos.find(p => String(p.code || "").toUpperCase() === code);
      if (!found) {
        setPromoError("Code invalide.");
        return;
      }
      if (!found.active || Number(found.value) <= 0) {
        setPromoError("Code expiré ou inactif.");
        return;
      }
      setAppliedPromo(found);
      setPromoError("");
    } catch (e) {
      console.error("Promo check failed:", e);
      setPromoError("Impossible de vérifier le code pour le moment.");
    } finally {
      setApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError("");
    // on garde le code saisi dans l’input pour réessayer si besoin
  };

  // Création de commande
  const handleCheckout = async ({ shipping, payment }) => {
    setStatus({ type: "", msg: "" });
    setSubmitting(true);
    try {
      const payload = {
        cartId: cartId,
        items: items ?? cart?.items ?? [],
        shipping,
        payment,
        // Infos promo envoyées au back (à ignorer si non géré côté serveur)
        promo: appliedPromo ? {
          code: appliedPromo.code,
          type: appliedPromo.type,
          value: appliedPromo.value,
          discount_amount: discount,
        } : null,
        totals: {
          subtotal: subTotal,
          discount,
          total: grandTotal,
        },
      };

      const res = await ordersService.create(payload);
      const data = res?.data ?? res;
      const orderId = data?.id ?? data?.order?.id ?? data?.data?.id;

      await clear?.();
      setStatus({
        type: "success",
        msg: `Order placed successfully ✅${orderId ? " (#" + orderId + ")" : ""}`,
      });
    } catch (e) {
      console.error("Order create failed:", e);
      setStatus({ type: "error", msg: "Checkout failed ❌" });
    } finally {
      setSubmitting(false);
    }
  };

  const hasItems = (items?.length ?? cart?.items?.length ?? 0) > 0;

  if (!hasItems) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
      <div>
        <h1>Checkout</h1>

        {status.msg && (
          <div
            style={{
              margin: "12px 0",
              padding: "10px 12px",
              borderRadius: 8,
              background: status.type === "success" ? "#e8f7ee" : "#fee",
              color: status.type === "success" ? "#0a7a3b" : "#a20000",
            }}
          >
            {status.msg}
          </div>
        )}

        {loadingProfile ? (
          <p>Loading your profile…</p>
        ) : (
          <CheckoutForm
            // On affiche le total final dans le bouton
            total={grandTotal}
            onSubmit={handleCheckout}
            initialShipping={initialShipping}
            submitting={submitting}
          />
        )}
      </div>

      {/* ---- Résumé de commande + Code promo ---- */}
      <aside
        style={{
          alignSelf: "start",
          position: "sticky",
          top: 16,
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          background: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Order Summary</h2>

        <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
          <Row label="Subtotal" value={`${subTotal.toFixed(2)} €`} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Promo code</div>
            {appliedPromo ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#e8f7ee",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontWeight: 700 }}>{appliedPromo.code}</span>
                <span style={{ opacity: 0.7 }}>
                  {appliedPromo.type === "percent"
                    ? `-${appliedPromo.value}%`
                    : `-${Number(appliedPromo.value).toFixed(2)} €`}
                </span>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "none",
                    color: "#a20000",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code (e.g. SUMMER10)"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={applying}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #111",
                      background: "#111",
                      color: "#fff",
                      cursor: "pointer",
                      minWidth: 96,
                    }}
                  >
                    {applying ? "Checking…" : "Apply"}
                  </button>
                </div>
                {promoError && (
                  <div style={{ color: "#a20000", fontSize: 13, marginTop: 6 }}>{promoError}</div>
                )}
              </>
            )}
          </div>

          <Row
            label="Discount"
            value={discount > 0 ? `- ${discount.toFixed(2)} €` : "—"}
            muted={discount <= 0}
          />
          <Row label="Shipping" value="FREE" />
          <hr style={{ border: 0, borderTop: "1px solid #e5e5e5", margin: "10px 0" }} />
          <Row label="Total (after promo)" value={<strong>{grandTotal.toFixed(2)} €</strong>} />

          {/* Prix sans promo (info) */}
          {discount > 0 && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              (Without promo: {subTotal.toFixed(2)} €)
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, muted = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ opacity: muted ? 0.5 : 1 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
