// server/models/productSizeModel.js
import db from "../database/connection.js";

export async function listSizes(productId) {
  const [rows] = await db.query(
    `SELECT id, size_label, stock_qty FROM product_sizes WHERE product_id = ? ORDER BY id ASC`,
    [productId]
  );
  return rows;
}

export async function addSize(productId, { label, stock = 0 }) {
  const [res] = await db.query(
    `INSERT INTO product_sizes (product_id, size_label, stock_qty) VALUES (?, ?, ?)`,
    [productId, label, stock]
  );
  return { id: res.insertId };
}

export async function updateSize(id, { label, stock }) {
  const sets = [], params = [];
  if (label !== undefined) { sets.push("size_label = ?"); params.push(label); }
  if (stock !== undefined) { sets.push("stock_qty = ?"); params.push(Number(stock)); }
  if (!sets.length) return { affectedRows: 0 };
  params.push(id);
  const [res] = await db.query(`UPDATE product_sizes SET ${sets.join(", ")} WHERE id = ?`, params);
  return { affectedRows: res.affectedRows };
}

export async function deleteSize(id) {
  const [res] = await db.query(`DELETE FROM product_sizes WHERE id = ?`, [id]);
  return { affectedRows: res.affectedRows };
}
