// client/src/components/Reviews/ReviewsSection.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { reviewsService } from "../../services/reviews.service";
import ReviewItem from "./ReviewItem.jsx";
import ReviewForm from "./ReviewForm.jsx";
import RatingStars from "./RatingStars.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function ReviewsSection({ productId }) {
  const { user } = useContext(AuthContext) || {};
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sort, setSort] = useState("newest"); // newest | rating_desc | rating_asc

  const canWrite = Boolean(user?.id);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rows, sum, mine] = await Promise.all([
        reviewsService.listByProduct(productId, { limit: 50, offset: 0, sort }),
        reviewsService.summary(productId),
        canWrite ? reviewsService.getMine(productId).catch(() => null) : Promise.resolve(null),
      ]);
      setList(Array.isArray(rows) ? rows : []);
      setSummary(sum || null);
      setMyReview(mine || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [productId, sort, canWrite]);

  const onSubmit = async ({ rating, comment }) => {
    setSubmitting(true);
    try {
      await reviewsService.upsert(productId, { rating, comment });
      await loadAll();
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteMine = async () => {
    setSubmitting(true);
    try {
      await reviewsService.removeMine(productId);
      await loadAll();
    } finally {
      setSubmitting(false);
    }
  };

  const avg = summary?.avg_rating ?? 0;
  const count = summary?.count ?? 0;

  return (
    <section style={{ marginTop: 24 }}>
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Avis ({count})</h3>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <RatingStars value={avg} />
          <strong>{avg?.toFixed ? avg.toFixed(2) : Number(avg).toFixed(2)}/5</strong>
          <select value={sort} onChange={(e)=>setSort(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="newest">Plus récents</option>
            <option value="rating_desc">Note ↓</option>
            <option value="rating_asc">Note ↑</option>
          </select>
        </div>
      </header>

      {canWrite && (
        <div style={{ marginBottom: 12 }}>
          <ReviewForm initial={myReview} onSubmit={onSubmit} onDeleteMine={onDeleteMine} submitting={submitting} />
        </div>
      )}

      {loading ? (
        <p>Chargement des avis…</p>
      ) : list.length === 0 ? (
        <p>Aucun avis pour le moment.</p>
      ) : (
        <div style={{ display:"grid", gap:10 }}>
          {list.map((r) => <ReviewItem key={r.id} review={r} />)}
        </div>
      )}
    </section>
  );
}
