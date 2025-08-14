// server/models/productImageModel.js
import db from "../database/connection.js";

export async function listImages(productId) {
  const [rows] = await db.query(
    `SELECT id, url FROM product_images WHERE product_id = ? ORDER BY id ASC`,
    [productId]
  );
  return rows;
}

export async function addImage(productId, url) {
  const [res] = await db.query(
    `INSERT INTO product_images (product_id, url) VALUES (?, ?)`,
    [productId, url]
  );
  return { id: res.insertId };
}

export async function deleteImage(id) {
  const [res] = await db.query(`DELETE FROM product_images WHERE id = ?`, [id]);
  return { affectedRows: res.affectedRows };
}
