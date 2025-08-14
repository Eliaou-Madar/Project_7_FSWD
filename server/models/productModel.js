// server/models/productModel.js
import db from "../database/connection.js";

/* ----------- Lister les produits avec filtres ----------- */
export async function listProducts({
  search = "",
  brand,
  is_limited,
  minPrice,
  maxPrice,
  limit = 20,
  offset = 0,
  sort = "newest",
} = {}) {
  const where = [];
  const params = [];

  if (search) {
    where.push("(p.name LIKE ? OR p.brand LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (brand) {
    where.push("p.brand = ?");
    params.push(brand);
  }
  if (is_limited !== undefined) {
    where.push("p.is_limited = ?");
    params.push(is_limited ? 1 : 0);
  }
  if (minPrice !== undefined) {
    where.push("p.price >= ?");
    params.push(Number(minPrice));
  }
  if (maxPrice !== undefined) {
    where.push("p.price <= ?");
    params.push(Number(maxPrice));
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  let orderBy = "p.id DESC";
  if (sort === "price_asc") orderBy = "p.price ASC";
  if (sort === "price_desc") orderBy = "p.price DESC";

  const sql = `
    SELECT
      p.id, p.name, p.brand, p.description, p.price, p.is_limited, p.created_at,
      COALESCE(
        (SELECT JSON_ARRAYAGG(pi.url)
           FROM product_images pi
          WHERE pi.product_id = p.id),
        JSON_ARRAY()
      ) AS images,
      COALESCE(
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('label', ps.size_label, 'stock', ps.stock_qty))
           FROM product_sizes ps
          WHERE ps.product_id = p.id),
        JSON_ARRAY()
      ) AS sizes
    FROM products p
    ${whereSQL}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?`;
  const [rows] = await db.query(sql, [...params, Number(limit), Number(offset)]);
  return rows;
}

/* ----------- Obtenir un produit avec images + tailles ----------- */
export async function getProductById(id) {
  const sql = `
    SELECT
      p.id, p.name, p.brand, p.description, p.price, p.is_limited, p.created_at,
      COALESCE(
        (SELECT JSON_ARRAYAGG(pi.url)
           FROM product_images pi
          WHERE pi.product_id = p.id),
        JSON_ARRAY()
      ) AS images,
      COALESCE(
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', ps.id, 'label', ps.size_label, 'stock', ps.stock_qty))
           FROM product_sizes ps
          WHERE ps.product_id = p.id),
        JSON_ARRAY()
      ) AS sizes
    FROM products p
    WHERE p.id = ?
    LIMIT 1`;
  const [rows] = await db.query(sql, [id]);
  return rows[0] || null;
}


/* ----------- Créer un produit (transaction) ----------- */
export async function createProduct({ name, brand, description, price, is_limited = false, images = [], sizes = [] }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.query(
      `INSERT INTO products (name, brand, description, price, is_limited)
       VALUES (?, ?, ?, ?, ?)`,
      [name, brand, description, price, is_limited ? 1 : 0]
    );
    const productId = res.insertId;

    if (images.length) {
      const values = images.map(url => [productId, url]);
      await conn.query(`INSERT INTO product_images (product_id, url) VALUES ?`, [values]);
    }

    if (sizes.length) {
      const values = sizes.map(s => [productId, s.label, s.stock]);
      await conn.query(`INSERT INTO product_sizes (product_id, size_label, stock_qty) VALUES ?`, [values]);
    }

    await conn.commit();
    return { id: productId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ----------- Mettre à jour un produit ----------- */
export async function updateProduct(id, fields) {
  const allowed = ["name", "brand", "description", "price", "is_limited"];
  const updates = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }

  if (!updates.length) return { affectedRows: 0 };

  params.push(id);
  const [res] = await db.query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, params);
  return { affectedRows: res.affectedRows };
}

/* ----------- Supprimer un produit ----------- */
export async function deleteProduct(id) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`DELETE FROM product_images WHERE product_id = ?`, [id]);
    await conn.query(`DELETE FROM product_sizes WHERE product_id = ?`, [id]);
    const [res] = await conn.query(`DELETE FROM products WHERE id = ?`, [id]);

    await conn.commit();
    return { affectedRows: res.affectedRows };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
