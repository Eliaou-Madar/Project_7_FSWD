// server/models/promotionModel.js
import db from "../database/connection.js";

/* ------------------ READ ------------------ */

/** Liste des promotions actives (en cours) */
export async function getActivePromotions() {
  const [rows] = await db.query(
    `SELECT id, title, description, discount_percent, start_date, end_date, created_at
     FROM promotions
     WHERE NOW() BETWEEN start_date AND end_date
     ORDER BY start_date ASC`
  );
  return rows;
}

/** Liste paginée/totale */
export async function listPromotions({ limit = 20, offset = 0, sort = "newest" } = {}) {
  let orderBy = "created_at DESC";
  if (sort === "start_date") orderBy = "start_date ASC";
  if (sort === "end_date") orderBy = "end_date DESC";

  const [rows] = await db.query(
    `SELECT id, title, description, discount_percent, start_date, end_date, created_at
     FROM promotions
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );
  return rows;
}

/** Détail d’une promotion par ID */
export async function getPromotionById(id) {
  const [rows] = await db.query(
    `SELECT id, title, description, discount_percent, start_date, end_date, created_at
     FROM promotions
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/** Vérifie si un produit a une promo active (si tu ajoutes table de liaison plus tard) */
export async function getPromotionForProduct(productId) {
  const [rows] = await db.query(
    `SELECT p.*
     FROM promotions p
     JOIN product_promotions pp ON pp.promotion_id = p.id
     WHERE pp.product_id = ?
       AND NOW() BETWEEN p.start_date AND p.end_date
     LIMIT 1`,
    [productId]
  );
  return rows[0] || null;
}

/* ------------------ WRITE ------------------ */

/** Créer une promotion */
export async function createPromotion({ title, description = "", discount_percent, start_date, end_date }) {
  const [res] = await db.query(
    `INSERT INTO promotions (title, description, discount_percent, start_date, end_date)
     VALUES (?, ?, ?, ?, ?)`,
    [title, description, discount_percent, start_date, end_date]
  );
  return { id: res.insertId };
}

/** Mettre à jour une promotion */
export async function updatePromotion(id, { title, description, discount_percent, start_date, end_date }) {
  const sets = [];
  const params = [];

  if (title !== undefined) {
    sets.push("title = ?");
    params.push(title);
  }
  if (description !== undefined) {
    sets.push("description = ?");
    params.push(description);
  }
  if (discount_percent !== undefined) {
    sets.push("discount_percent = ?");
    params.push(discount_percent);
  }
  if (start_date !== undefined) {
    sets.push("start_date = ?");
    params.push(start_date);
  }
  if (end_date !== undefined) {
    sets.push("end_date = ?");
    params.push(end_date);
  }

  if (!sets.length) return { affectedRows: 0 };

  params.push(id);
  const [res] = await db.query(
    `UPDATE promotions SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
  return { affectedRows: res.affectedRows };
}

/** Supprimer une promotion */
export async function deletePromotion(id) {
  const [res] = await db.query(`DELETE FROM promotions WHERE id = ?`, [id]);
  return { affectedRows: res.affectedRows };
}

/** Supprimer toutes les promotions expirées */
export async function deleteExpiredPromotions() {
  const [res] = await db.query(
    `DELETE FROM promotions WHERE end_date < NOW()`
  );
  return { affectedRows: res.affectedRows };
}
