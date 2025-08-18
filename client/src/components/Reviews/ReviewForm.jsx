// client/src/components/Reviews/ReviewForm.jsx
import React, { useState } from "react";
import RatingStars from "./RatingStars.jsx";

export default function ReviewForm({ initial = null, onSubmit, onDeleteMine, submitting = false }) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [comment, setComment] = useState(initial?.comment ?? "");

  const submit = (e) => {
    e.preventDefault();
    const r = Math.max(1, Math.min(5, Number(rating) || 5));
    onSubmit?.({ rating: r, comment: comment.trim() });
  };

  return (
    <form onSubmit={submit} style={{ display:"grid", gap:10, border:"1px solid #eee", borderRadius:10, padding:12 }}>
      <label style={{ display:"grid", gap:6 }}>
        <span>Votre note</span>
        <input
          type="range"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
        <RatingStars value={rating} size={20} />
      </label>

      <label style={{ display:"grid", gap:6 }}>
        <span>Commentaire</span>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre avis…"
          style={{ padding:8, borderRadius:8, border:"1px solid #ddd" }}
        />
      </label>

      <div style={{ display:"flex", gap:8 }}>
        <button type="submit" disabled={submitting}>
          {initial ? "Mettre à jour mon avis" : "Publier mon avis"}
        </button>
        {initial && (
          <button type="button" onClick={onDeleteMine} className="btn-danger" disabled={submitting}>
            Supprimer mon avis
          </button>
        )}
      </div>
    </form>
  );
}
