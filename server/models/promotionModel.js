// server/models/promotionModel.js
import db from "../database/connection.js";
import { toMySQLDate } from "../utils/mysqlDate.js";

/**
 * On renvoie les colonnes RÉELLES (code, discount_type, discount_value, …)
 * + des ALIAS de compatibilité (title, discount_percent) pour tout ancien code.
 */
const BASE_SELECT = `
  SELECT
    id,
    code,
    code AS title,                       -- alias compat
    description,
    discount_type,
    discount_value,
    discount_value AS discount_percent,  -- alias compat
    start_date,
    end_date,
    is_active,
    created_at
  FROM promotions
`;

/** Promos actives */
export async function getActivePromotions() {
  const SQL = `
    ${BASE_SELECT}
    WHERE is_active = 1
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date   IS NULL OR end_date   >= NOW())
    ORDER BY created_at DESC
  `;
  const [rows] = await db.query(SQL);
  return rows;
}

/** Liste admin paginée + tri */
export async function listPromotions({ limit = 20, offset = 0, sort = "newest" } = {}) {
  let orderBy = "created_at DESC";
  if (sort === "start_date") orderBy = "start_date DESC";
  else if (sort === "end_date") orderBy = "end_date DESC";

  const SQL = `
    ${BASE_SELECT}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(SQL, [Number(limit), Number(offset)]);
  return rows;
}

/** Détail */
export async function getPromotionById(id) {
  const SQL = `
    ${BASE_SELECT}
    WHERE id = ?
    LIMIT 1
  `;
  const [[row]] = await db.query(SQL, [Number(id)]);
  return row || null;
}

/** Pas de liaison produit↔promo dans ton schéma → null */
export async function getPromotionForProduct(_productId) {
  return null;
}

/** Création (colonnes RÉELLES) */
export async function createPromotion({
  code,
  description = null,
  discount_type,
  discount_value,
  start_date = null,
  end_date = null,
  is_active = true,
}) {
  const [r] = await db.query(
    `INSERT INTO promotions
      (code, description, discount_type, discount_value, start_date, end_date, is_active)
     VALUES (UPPER(?), ?, ?, ?, ?, ?, ?)`,
    [
      code,
      description,
      discount_type,
      Number(discount_value),
      toMySQLDate(start_date),
      toMySQLDate(end_date),
      is_active ? 1 : 0,
    ]
  );
  return { id: r.insertId };
}

/** Mise à jour (colonnes RÉELLES) */
export async function updatePromotion(id, payload = {}) {
  const allowed = [
    "code",
    "description",
    "discount_type",
    "discount_value",
    "start_date",
    "end_date",
    "is_active",
  ];

  const fields = [];
  const params = [];

  for (const k of allowed) {
    if (payload[k] !== undefined) {
      if (k === "code") {
        fields.push("code = UPPER(?)");
        params.push(payload[k]);
      } else if (k === "discount_value") {
        fields.push("discount_value = ?");
        params.push(Number(payload[k]));
      } else if (k === "is_active") {
        fields.push("is_active = ?");
        params.push(payload[k] ? 1 : 0);
      } else if (k === "start_date" || k === "end_date") {
        fields.push(`${k} = ?`);
        params.push(toMySQLDate(payload[k]));
      } else {
        fields.push(`${k} = ?`);
        params.push(payload[k]);
      }
    }
  }

  if (!fields.length) return { affectedRows: 0 };

  params.push(Number(id));
  const [r] = await db.query(
    `UPDATE promotions SET ${fields.join(", ")} WHERE id = ?`,
    params
  );
  return { affectedRows: r.affectedRows };
}

/** Suppression */
export async function deletePromotion(id) {
  const [r] = await db.query(`DELETE FROM promotions WHERE id = ?`, [Number(id)]);
  return { affectedRows: r.affectedRows };
}

/** Supprimer les expirées */
export async function deleteExpiredPromotions() {
  const [r] = await db.query(
    `DELETE FROM promotions WHERE end_date IS NOT NULL AND end_date < NOW()`
  );
  return { affectedRows: r.affectedRows };
}
