// client/src/components/Reviews/ReviewItem.jsx
import React from "react";
import RatingStars from "./RatingStars.jsx";

const formatDateOnly = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" });
};

export default function ReviewItem({ review }) {
  if (!review) return null;
  const user = review.username || `User #${review.user_id}`;
  const date = review.created_at || review.createdAt;
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <strong>{user}</strong>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{formatDateOnly(date)}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <RatingStars value={review.rating} size={18} />
      </div>
      {review.comment ? <p style={{ marginTop: 8 }}>{review.comment}</p> : null}
    </div>
  );
}
