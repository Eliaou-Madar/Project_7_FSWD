// client/src/pages/ReviewsPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import ReviewsSection from "../components/Reviews/ReviewsSection.jsx";

export default function ReviewsPage() {
  const { productId } = useParams(); // route: /products/:productId/reviews
  if (!productId) return <p>Missing product id.</p>;
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Avis du produit #{productId}</h2>
      <ReviewsSection productId={Number(productId)} />
    </div>
  );
}
