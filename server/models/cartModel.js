// server/models/cartModel.js
import db from "../database/connection.js";

/* ---------- Utils ---------- */
async function getOrCreateCart(userId) {
  // récupère le dernier panier (ou en crée un s’il n’existe pas)
  const [[cart]] = await db.query(
    `SELECT id FROM carts WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
    [userId]
  );
  if (cart) return cart.id;

  const [res] = await db.query(
    `INSERT INTO carts (user_id) VALUES (?)`,
    [userId]
  );
  return res.insertId;
}

/* ---------- Read ---------- */
export async function getCartByUser(userId) {
  const cartId = await getOrCreateCart(userId);

  const [items] = await db.query(
    `
    SELECT 
      ci.product_size_id,
      ci.quantity,
      ps.size_label,
      ps.stock_qty,
      p.id          AS product_id,
      p.name,
      p.brand,
      p.price,
      COALESCE((
        SELECT pi.url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.id ASC LIMIT 1
      ), NULL) AS image
    FROM cart_items ci
    JOIN product_sizes ps ON ps.id = ci.product_size_id
    JOIN products p       ON p.id = ps.product_id
    WHERE ci.cart_id = ?
    ORDER BY ci.id DESC
    `,
    [cartId]
  );

  const subtotal = items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
  return { cart_id: cartId, items, subtotal };
}

export async function countCartItems(userId) {
  const cartId = await getOrCreateCart(userId);
  const [[row]] = await db.query(
    `SELECT COALESCE(SUM(quantity),0) AS qty FROM cart_items WHERE cart_id = ?`,
    [cartId]
  );
  return Number(row.qty || 0);
}

/* ---------- Write ---------- */
export async function addToCart(userId, productSizeId, qty = 1) {
  if (qty <= 0) qty = 1;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const cartId = await getOrCreateCart(userId);

    // vérifier stock
    const [[ps]] = await conn.query(
      `SELECT stock_qty FROM product_sizes WHERE id = ? FOR UPDATE`,
      [productSizeId]
    );
    if (!ps) throw new Error("product_size_not_found");

    // quantité actuelle dans le panier
    const [[cur]] = await conn.query(
      `SELECT quantity FROM cart_items WHERE cart_id = ? AND product_size_id = ?`,
      [cartId, productSizeId]
    );
    const newQty = (cur?.quantity || 0) + qty;

    if (newQty > ps.stock_qty) {
      throw new Error("not_enough_stock");
    }

    if (cur) {
      await conn.query(
        `UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_size_id = ?`,
        [newQty, cartId, productSizeId]
      );
    } else {
      await conn.query(
        `INSERT INTO cart_items (cart_id, product_size_id, quantity) VALUES (?, ?, ?)`,
        [cartId, productSizeId, qty]
      );
    }

    await conn.commit();
    return { cart_id: cartId, product_size_id: productSizeId, quantity: newQty };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function setItemQuantity(userId, productSizeId, qty) {
  if (qty < 0) qty = 0;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const cartId = await getOrCreateCart(userId);

    if (qty === 0) {
      await conn.query(
        `DELETE FROM cart_items WHERE cart_id = ? AND product_size_id = ?`,
        [cartId, productSizeId]
      );
      await conn.commit();
      return { cart_id: cartId, product_size_id: productSizeId, quantity: 0 };
    }

    // check stock
    const [[ps]] = await conn.query(
      `SELECT stock_qty FROM product_sizes WHERE id = ? FOR UPDATE`,
      [productSizeId]
    );
    if (!ps) throw new Error("product_size_not_found");
    if (qty > ps.stock_qty) throw new Error("not_enough_stock");

    const [res] = await conn.query(
      `UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_size_id = ?`,
      [qty, cartId, productSizeId]
    );

    if (res.affectedRows === 0) {
      // si l’item n’existait pas encore → insert
      await conn.query(
        `INSERT INTO cart_items (cart_id, product_size_id, quantity) VALUES (?, ?, ?)`,
        [cartId, productSizeId, qty]
      );
    }

    await conn.commit();
    return { cart_id: cartId, product_size_id: productSizeId, quantity: qty };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function removeFromCart(userId, productSizeId) {
  const cartId = await getOrCreateCart(userId);
  const [res] = await db.query(
    `DELETE FROM cart_items WHERE cart_id = ? AND product_size_id = ?`,
    [cartId, productSizeId]
  );
  return { cart_id: cartId, product_size_id: productSizeId, removed: res.affectedRows > 0 };
}

export async function clearCart(userId) {
  const cartId = await getOrCreateCart(userId);
  await db.query(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
  return { cart_id: cartId, cleared: true };
}

/* ---------- Totaux (re-calcul live) ---------- */
export async function getCartTotals(userId) {
  const cartId = await getOrCreateCart(userId);
  const [[row]] = await db.query(
    `
    SELECT COALESCE(SUM(p.price * ci.quantity), 0) AS subtotal
    FROM cart_items ci
    JOIN product_sizes ps ON ps.id = ci.product_size_id
    JOIN products p       ON p.id = ps.product_id
    WHERE ci.cart_id = ?
    `,
    [cartId]
  );
  return { cart_id: cartId, subtotal: Number(row.subtotal || 0) };
}
