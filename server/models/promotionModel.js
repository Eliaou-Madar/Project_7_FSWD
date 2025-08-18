// server/models/promotionModel.js
import db from "../database/connection.js";

/**
 * On renvoie les colonnes RÉELLES (code, discount_type, discount_value, …)
 * + des ALIAS de compatibilité (title, discount_percent) pour tout ancien code.
 *
 * NOTE: start_date / end_date sont désormais stockées en TEXTE (ISO string).
 * Pour les comparaisons (active/inactive), on convertit au vol avec STR_TO_DATE.
 */

// Convertit une ISO "YYYY-MM-DDTHH:MM:SS(.ms)Z" en DATETIME via SQL
// - supprime le suffixe ".xxx" si présent
// - remplace 'T' par ' ' et retire 'Z'
const SQL_TO_DATETIME = (col) =>
  `STR_TO_DATE(REPLACE(REPLACE(SUBSTRING_INDEX(${col}, '.', 1), 'T', ' '), 'Z', ''), '%Y-%m-%d %H:%i:%s')`;

const BASE_SELECT = `
  SELECT
    id,
    code,
    code AS title,                       -- alias compat
    description,
    discount_type,
    discount_value,
    discount_value AS discount_percent,  -- alias compat
    start_date,                          -- TEXTE ISO
    end_date,                            -- TEXTE ISO
    is_active,
    created_at
  FROM promotions
`;

/** Promos actives (comparaison via STR_TO_DATE) */
export async function getActivePromotions() {
  const SQL = `
    ${BASE_SELECT}
    WHERE is_active = 1
      AND (start_date IS NULL OR ${SQL_TO_DATETIME("start_date")} <= NOW())
      AND (end_date   IS NULL OR ${SQL_TO_DATETIME("end_date")}   >= NOW())
    ORDER BY created_at DESC
  `;
  const [rows] = await db.query(SQL);
  return rows;
}

/** Liste admin paginée + tri (tri texte pour dates ; pour tri chronologique, on peut utiliser STR_TO_DATE) */
export async function listPromotions({ limit = 20, offset = 0, sort = "newest" } = {}) {
  // Par défaut: newest
  let orderBy = "created_at DESC";
  if (sort === "start_date") orderBy = `${SQL_TO_DATETIME("start_date")} DESC`;
  else if (sort === "end_date") orderBy = `${SQL_TO_DATETIME("end_date")} DESC`;

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

/** Création (on stocke start_date / end_date tel quel en TEXTE ISO) */
export async function createPromotion({
  code,
  description = null,
  discount_type,
  discount_value,
  start_date = null,   // string ISO, ex: "2025-05-22T00:00:00.000Z"
  end_date = null,     // string ISO
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
      start_date,                   // stocké tel quel (texte)
      end_date,                     // stocké tel quel (texte)
      is_active ? 1 : 0,
    ]
  );
  return { id: r.insertId };
}

/** Mise à jour (on passe les valeurs telles quelles) */
export async function updatePromotion(id, payload = {}) {
  const allowed = [
    "code",
    "description",
    "discount_type",
    "discount_value",
    "start_date",  // texte
    "end_date",    // texte
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
      } else {
        fields.push(`${k} = ?`);
        params.push(payload[k]); // start_date/end_date: texte brut
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

/** Supprimer les expirées (comparaison via STR_TO_DATE) */
export async function deleteExpiredPromotions() {
  const SQL = `
    DELETE FROM promotions
    WHERE end_date IS NOT NULL
      AND ${SQL_TO_DATETIME("end_date")} < NOW()
  `;
  const [r] = await db.query(SQL);
  return { affectedRows: r.affectedRows };
}
