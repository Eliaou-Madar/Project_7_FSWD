// server/models/productSizeModel.js
import db from "../database/connection.js";

/* ------------------ Helpers ------------------ */

/** Normalise une entrée de taille.
 *  Accepte "EU 42" ou { label: "EU 42", stock: 10 } ou { size_label, stock_qty }.
 *  Retourne { label: string, stock: number } ou null si invalide.
 */
function normalizeSize(input) {
  if (typeof input === "string") {
    const label = input.trim();
    if (!label) return null;
    return { label, stock: 10 }; // stock par défaut
  }
  if (input && typeof input === "object") {
    const label = String(input.label ?? input.size_label ?? "").trim();
    if (!label) return null;
    const rawStock = input.stock ?? input.stock_qty ?? 0;
    const stock = Number.isFinite(Number(rawStock)) ? Number(rawStock) : 0;
    return { label, stock };
  }
  return null;
}

/** Vérifie si une taille existe déjà pour un produit (par label exact). */
async function sizeExists(productId, label) {
  const [rows] = await db.query(
    `SELECT id FROM product_sizes WHERE product_id = ? AND size_label = ? LIMIT 1`,
    [productId, label]
  );
  return rows.length > 0;
}

/* ------------------ CRUD public ------------------ */

export async function listSizes(productId) {
  const [rows] = await db.query(
    `SELECT id, size_label AS label, stock_qty AS stock
     FROM product_sizes
     WHERE product_id = ?
     ORDER BY id ASC`,
    [productId]
  );
  return rows;
}

/** Ajoute UNE taille, avec contrôle de doublon. */
export async function addSize(productId, { label, stock = 0 }) {
  const norm = normalizeSize({ label, stock });
  if (!norm) throw new Error("invalid_size");
  if (await sizeExists(productId, norm.label)) {
    const err = new Error("size_already_exists");
    err.code = "size_already_exists";
    throw err;
  }
  const [res] = await db.query(
    `INSERT INTO product_sizes (product_id, size_label, stock_qty) VALUES (?, ?, ?)`,
    [productId, norm.label, Number(norm.stock)]
  );
  return { id: res.insertId, product_id: productId, label: norm.label, stock: Number(norm.stock) };
}

/** Met à jour label/stock d'une taille. */
export async function updateSize(id, { label, stock }) {
  const sets = [];
  const params = [];

  if (label !== undefined) {
    const lbl = String(label).trim();
    if (!lbl) throw new Error("invalid_label");
    sets.push("size_label = ?");
    params.push(lbl);
  }
  if (stock !== undefined) {
    const st = Number(stock);
    if (!Number.isFinite(st)) throw new Error("invalid_stock");
    sets.push("stock_qty = ?");
    params.push(st);
  }

  if (!sets.length) return { affectedRows: 0 };

  params.push(id);
  const [res] = await db.query(
    `UPDATE product_sizes SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
  return { affectedRows: res.affectedRows };
}

/** Supprime une taille par id. */
export async function deleteSize(id) {
  const [res] = await db.query(`DELETE FROM product_sizes WHERE id = ?`, [id]);
  return { affectedRows: res.affectedRows };
}

/* ------------------ Batch utils ------------------ */

/** Ajoute plusieurs tailles.
 *  - Accepte ["EU 40", "EU 41"] ou [{label, stock}, ...]
 *  - Ignore silencieusement les doublons déjà présents
 *  - Retourne { inserted: number, skipped: number, details: {added:[], skipped:[]} }
 */
export async function addManySizes(productId, sizes = []) {
  for (const s of sizes) {
    const label = typeof s === "string" ? s : String(s?.label ?? s?.size_label ?? "").trim();
    const stock = Number(typeof s === "string" ? (s.stock ?? 10) : (s.stock ?? s.stock_qty ?? 10));
    if (!label) continue;
    try {
      await db.query(
        `INSERT INTO product_sizes (product_id, size_label, stock_qty)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE size_label = size_label`,
        [productId, label, Number.isFinite(stock) ? stock : 0]
      );
    } catch { /* ignore */ }
  }
}

