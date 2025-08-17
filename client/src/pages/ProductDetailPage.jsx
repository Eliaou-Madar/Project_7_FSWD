// client/src/pages/ProductDetailPage.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductDetail from "../components/Products/ProductDetail.jsx";
import { productsService } from "../services/products.service";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    setErr("");
    setProduct(null);

    productsService
      .getById(id)
      .then((p) => {
        if (!ignore) setProduct(p);
      })
      .catch((e) => {
        if (!ignore) setErr(String(e.message || e));
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (err) return <div style={{ color: "crimson" }}>Erreur: {err}</div>;
  if (!product) return <div>Loading…</div>;
  return <ProductDetail product={product} />;
}
