import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductDetail from "../components/Products/ProductDetail.jsx";
import { productsService } from "../services/products.service";
import ReviewsSection from "../components/Reviews/ReviewsSection.jsx";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [err, setErr] = useState("");
  const productId = Number(id);

  useEffect(() => {
    let ignore = false;
    setErr("");
    setProduct(null);

    productsService
      .getById(productId)
      .then((p) => !ignore && setProduct(p))
      .catch((e) => !ignore && setErr(String(e.message || e)));

    return () => { ignore = true; };
  }, [productId]);

  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  if (!product) return <div>Loading…</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 24 }}>
      {/* Détail produit */}
      <ProductDetail product={product} />

      {/* Avis du produit — même page */}
      <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
        <ReviewsSection productId={productId} />
      </div>
    </div>
  );
}
