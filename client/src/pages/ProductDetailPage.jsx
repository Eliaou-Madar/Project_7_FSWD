import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { productsService } from "../services/products.service";
import ProductDetail from "../components/Products/ProductDetail.jsx";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setState({ loading: true, error: "" });
      try {
        const data = await productsService.get(id);
        if (alive) setProduct(data);
      } catch {
        if (alive) setState({ loading: false, error: "Product not found" });
      } finally {
        if (alive) setState((s) => ({ ...s, loading: false }));
      }
    };
    if (id) run();
    return () => { alive = false; };
  }, [id]);

  if (state.loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (state.error || !product) return <p style={{ padding: 16 }}>{state.error || "Error"}</p>;

  return <ProductDetail product={product} />;
}
