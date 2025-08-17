import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { cartService } from "../services/cart.service";

const CartContext = createContext(null);
CartContext.displayName = "CartContext";

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null); // debug
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // Trouve le vrai payload où se trouvent les items, quelle que soit la profondeur
  const extractPayload = useCallback((res) => {
    // on tolère res | {data} | {status,data} | {status,message,data}
    const a = res?.data ?? res;
    // certains renvoient { data: { data: {...} } }
    const b = a?.data ?? a;
    // les items peuvent être sous b.items, b.cart?.items, b.payload?.items, etc.
    const payload = b?.items ? b
                  : b?.cart?.items ? b.cart
                  : b?.payload?.items ? b.payload
                  : b;
    return payload || {};
  }, []);

  const normalize = useCallback((payload) => {
    const rawItems = Array.isArray(payload?.items) ? payload.items : [];
    const items = rawItems.map((it) => {
      const qty = Number(it.quantity ?? it.qty ?? 1);
      const price = Number(it.price ?? it.unit_price ?? it.product?.price ?? 0);
      return {
        id: it.product_size_id ?? it.id ?? it.key, // unique (taille)
        qty,
        subtotal: price * qty,
        product: {
          id: it.product_id ?? it.product?.id,
          name: it.product_name ?? it.product?.name ?? "Product",
          price,
          image: it.image_url ?? it.product?.image ?? it.product?.image_url ?? "",
          size: it.size_label ?? it.product?.size_label ?? it.size ?? null,
        },
      };
    });
    const total =
      Number(payload.total) ||
      items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
    return { items, total };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cartService.get(); // GET /api/cart
      console.log("[Cart] /api/cart raw ->", res);
      setLastResponse(res); // pour affichage debug
      const payload = extractPayload(res);
      const mapped = normalize(payload);
      if (mounted.current) setCart(mapped);
    } catch (e) {
      console.error("[Cart] GET /api/cart failed", e);
      // ne pas écraser le panier sur erreur
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [extractPayload, normalize]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (product_size_id, qty = 1) => {
    await cartService.add(product_size_id, qty);
    await refresh();
  }, [refresh]);

  const setQty = useCallback(async (product_size_id, qty) => {
    await cartService.setQty(product_size_id, qty);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (product_size_id) => {
    await cartService.remove(product_size_id);
    await refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    await cartService.clear();
    await refresh();
  }, [refresh]);

  const value = useMemo(() => ({
    cart,
    items: cart.items,
    total: cart.total,
    loading,
    lastResponse, // debug
    refresh,
    add, setQty, remove, clear,
  }), [cart, loading, lastResponse, refresh, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
