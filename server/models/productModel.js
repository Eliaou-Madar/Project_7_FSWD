import db from "../database/connection.js";
// --- HOTFIX: empêche "ReferenceError: sizes is not defined"
let sizes = [];


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

/** Tailles par défaut (modifiable) */
const DEFAULT_SIZES = [
  { label: "EU 40", stock: 10 },
  { label: "EU 41", stock: 10 },
  { label: "EU 42", stock: 10 },
  { label: "EU 43", stock: 10 },
  { label: "EU 44", stock: 10 },
  { label: "EU 45", stock: 10 },
];

function normalizeSizes(sizes) {
  // Accepte: ["EU 42", "EU 43"] OU [{label, stock}]
  if (!Array.isArray(sizes) || !sizes.length) return [];
  return sizes
    .map((s) => {
      if (typeof s === "string") return { label: s, stock: 10 };
      if (s && typeof s === "object") {
        const label = String(s.label ?? s.size_label ?? "").trim();
        const stock = Number(s.stock ?? s.stock_qty ?? 0);
        if (!label) return null;
        return { label, stock: Number.isFinite(stock) ? stock : 0 };
      }
      return null;
    })
    .filter(Boolean);
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
/* ----------- Créer un produit (SIMPLE, sans tailles) ----------- */
export async function createProduct({ name, brand, description, price, is_limited = false, images = [] }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.query(
      `INSERT INTO products (name, brand, description, price, is_limited)
       VALUES (?, ?, ?, ?, ?)`,
      [name, brand, description, Number(price), is_limited ? 1 : 0]
    );
    const productId = res.insertId;

    if (Array.isArray(images) && images.length) {
      const values = images.filter(Boolean).map((u) => [productId, String(u)]);
      if (values.length) {
        await conn.query(`INSERT INTO product_images (product_id, url) VALUES ?`, [values]);
      }
    }

    await conn.commit();
    return { id: productId };
  } catch (err) {
    await conn.rollback();
    console.error("[createProduct] error:", err.code || err.message);
    throw err;
  } finally {
    conn.release();
  }
}

export async function replaceProductImages(productId, images = []) {
  const urls = (Array.isArray(images) ? images : []).filter(Boolean);
  await db.query(`DELETE FROM product_images WHERE product_id = ?`, [productId]);
  if (urls.length) {
    const values = urls.map((u) => [productId, u]);
    await db.query(`INSERT INTO product_images (product_id, url) VALUES ?`, [values]);
  }
}

export async function replaceProductSizes(productId, sizes = []) {
  const normalized = normalizeSizes(sizes);
  await db.query(`DELETE FROM product_sizes WHERE product_id = ?`, [productId]);
  if (normalized.length) {
    const values = normalized.map((s) => [productId, s.label, Number(s.stock ?? 0)]);
    await db.query(
      `INSERT INTO product_sizes (product_id, size_label, stock_qty) VALUES ?`,
      [values]
    );
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
  const [res] = await db.query(
    `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
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
