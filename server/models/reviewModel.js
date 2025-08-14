// server/models/reviewModel.js
import db from "../database/connection.js";

const DUP = "ER_DUP_ENTRY";

/* --------------------- Reads --------------------- */

/** Liste des avis d’un produit (paginé + tri) */
export async function listReviewsByProduct(
  productId,
  { limit = 20, offset = 0, sort = "newest" } = {}
) {
  let orderBy = "r.created_at DESC";
  if (sort === "rating_desc") orderBy = "r.rating DESC, r.created_at DESC";
  if (sort === "rating_asc") orderBy = "r.rating ASC, r.created_at DESC";

  const [rows] = await db.query(
    `
    SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at,
           u.username
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
    `,
    [productId, Number(limit), Number(offset)]
  );
  return rows;
}

/** Avis d’un utilisateur sur un produit (s’il existe) */
export async function getUserReviewForProduct(productId, userId) {
  const [rows] = await db.query(
    `SELECT id, product_id, user_id, rating, comment, created_at
     FROM reviews WHERE product_id = ? AND user_id = ? LIMIT 1`,
    [productId, userId]
  );
  return rows[0] || null;
}

/** Détail d’un avis par id */
export async function getReviewById(id) {
  const [rows] = await db.query(
    `SELECT id, product_id, user_id, rating, comment, created_at
     FROM reviews WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/** Résumé des notes d’un produit */
export async function getProductRatingSummary(productId) {
  const [[agg]] = await db.query(
    `
    SELECT
      COUNT(*) AS count,
      ROUND(AVG(rating), 2) AS avg_rating,
      SUM(rating = 5) AS r5,
      SUM(rating = 4) AS r4,
      SUM(rating = 3) AS r3,
      SUM(rating = 2) AS r2,
      SUM(rating = 1) AS r1
    FROM reviews
    WHERE product_id = ?
    `,
    [productId]
  );
  return {
    count: Number(agg.count || 0),
    avg_rating: agg.avg_rating ? Number(agg.avg_rating) : 0,
    breakdown: {
      5: Number(agg.r5 || 0),
      4: Number(agg.r4 || 0),
      3: Number(agg.r3 || 0),
      2: Number(agg.r2 || 0),
      1: Number(agg.r1 || 0),
    },
  };
}

/* --------------------- Writes --------------------- */

/** Créer un avis (erreur si l’utilisateur a déjà noté ce produit) */
export async function createReview({ product_id, user_id, rating, comment = "" }) {
  const r = Math.min(5, Math.max(1, Number(rating || 0))); // clamp 1..5
  try {
    const [res] = await db.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [product_id, user_id, r, comment]
    );
    return { id: res.insertId };
  } catch (err) {
    if (err.code === DUP) throw new Error("already_reviewed");
    throw err;
  }
}

/** Upsert pratique: crée ou met à jour l’avis de l’utilisateur pour ce produit */
export async function upsertUserReview({ product_id, user_id, rating, comment = "" }) {
  const r = Math.min(5, Math.max(1, Number(rating || 0)));
  const [res] = await db.query(
    `INSERT INTO reviews (product_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP`,
    [product_id, user_id, r, comment]
  );
  // si insertId == 0 -> update; MySQL renvoie affectedRows 2 pour update via ON DUP KEY
  return { affectedRows: res.affectedRows, insertId: res.insertId || null };
}

/** Mettre à jour un avis par id (rating/comment partiels) */
export async function updateReview(id, { rating, comment }) {
  const sets = [];
  const params = [];
  if (rating !== undefined) {
    const r = Math.min(5, Math.max(1, Number(rating)));
    sets.push("rating = ?");
    params.push(r);
  }
  if (comment !== undefined) {
    sets.push("comment = ?");
    params.push(comment);
  }
  if (!sets.length) return { affectedRows: 0 };

  params.push(id);
  const [res] = await db.query(
    `UPDATE reviews SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
  return { affectedRows: res.affectedRows };
}

/** Supprimer un avis par id */
export async function deleteReview(id) {
  const [res] = await db.query(`DELETE FROM reviews WHERE id = ?`, [id]);
  return { affectedRows: res.affectedRows };
}

/** Supprimer l’avis d’un utilisateur pour un produit */
export async function deleteUserReview(productId, userId) {
  const [res] = await db.query(
    `DELETE FROM reviews WHERE product_id = ? AND user_id = ?`,
    [productId, userId]
  );
  return { affectedRows: res.affectedRows };
}
