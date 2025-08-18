import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductDetail from "../components/Products/ProductDetail.jsx";
import { productsService } from "../services/products.service";
import ReviewsSection from "../components/Reviews/ReviewsSection.jsx";
import "./ProductDetailPage.css";

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

   if (err) return <div className="pdp-status-error">Error: {err}</div>;
  if (!product) return <div className="pdp-status-loading">Loading…</div>;

  return (
    <div className="pdp">
      <div className="pdp-main">
        {/* Tu peux faire en sorte que ProductDetail rende .pdp-gallery + .pdp-info */}
        <ProductDetail product={product} />
      </div>

      <div className="pdp-reviews">
        <ReviewsSection productId={productId} />
      </div>
    </div>
  );
}
