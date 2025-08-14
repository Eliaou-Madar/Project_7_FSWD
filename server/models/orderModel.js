// server/models/orderModel.js
import db from "../database/connection.js";

/* --------------------------- Helpers --------------------------- */
async function findActivePromotionByCode(code) {
  if (!code) return null;
  const [[promo]] = await db.query(
    `SELECT * FROM promotions
     WHERE code = ? AND is_active = 1
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date   IS NULL OR end_date   >= NOW())
     LIMIT 1`,
    [code]
  );
  return promo || null;
}

function computeDiscount(subtotal, promo) {
  if (!promo) return { promotion_id: null, discount_total: 0 };
  let discount = 0;
  if (promo.discount_type === "percent") {
    discount = (Number(promo.discount_value) / 100) * Number(subtotal);
  } else if (promo.discount_type === "fixed") {
    discount = Number(promo.discount_value);
  }
  discount = Math.max(0, Math.min(discount, Number(subtotal)));
  return { promotion_id: promo.id, discount_total: Number(discount.toFixed(2)) };
}

/* --------------------------- Create --------------------------- */
/**
 * Crée une commande à partir du panier utilisateur.
 * - Vérifie le stock & verrouille les lignes nécessaires (FOR UPDATE)
 * - Calcule le total depuis les prix actuels des produits
 * - Applique un code promo éventuel
 * - Décrément le stock
 * - Vide le panier
 * @returns { id, total, discount_total, status }
 */
export async function createOrderFromCart(userId, { promotionCode } = {}) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Récupérer le dernier panier (ou créer si vide) puis ses items
    const [[cart]] = await conn.query(
      `SELECT id FROM carts WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    if (!cart) throw new Error("cart_not_found");

    const [items] = await conn.query(
      `SELECT ci.product_size_id, ci.quantity, ps.product_id, ps.size_label, ps.stock_qty,
              p.price
       FROM cart_items ci
       JOIN product_sizes ps ON ps.id = ci.product_size_id
       JOIN products p       ON p.id = ps.product_id
       WHERE ci.cart_id = ?`,
      [cart.id]
    );
    if (!items.length) throw new Error("cart_empty");

    // Vérifier stock (lock)
    for (const it of items) {
      const [[row]] = await conn.query(
        `SELECT stock_qty FROM product_sizes WHERE id = ? FOR UPDATE`,
        [it.product_size_id]
      );
      if (!row) throw new Error("product_size_not_found");
      if (Number(row.stock_qty) < it.quantity) throw new Error("not_enough_stock");
    }

    // Total brut (somme prix * qty)
    const subtotal = items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);

    // Promo éventuelle
    const promo = promotionCode ? await findActivePromotionByCode(promotionCode) : null;
    const { promotion_id, discount_total } = computeDiscount(subtotal, promo);
    const total = Number((subtotal - discount_total).toFixed(2));

    // Créer la commande
    const [orderRes] = await conn.query(
      `INSERT INTO orders (user_id, promotion_id, total, discount_total, status)
       VALUES (?, ?, ?, ?, 'paid')`,
      [userId, promotion_id, total, discount_total]
    );
    const orderId = orderRes.insertId;

    // Créer les order_items (capture des prix au moment T)
    const values = items.map(it => [orderId, it.product_size_id, it.quantity, it.price]);
    await conn.query(
      `INSERT INTO order_items (order_id, product_size_id, quantity, price) VALUES ?`,
      [values]
    );

    // Décrémenter le stock
    for (const it of items) {
      await conn.query(
        `UPDATE product_sizes SET stock_qty = stock_qty - ? WHERE id = ?`,
        [it.quantity, it.product_size_id]
      );
    }

    // Vider le panier
    await conn.query(`DELETE FROM cart_items WHERE cart_id = ?`, [cart.id]);

    await conn.commit();
    return { id: orderId, total, discount_total, status: "paid" };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/* ---------------------------- Read ---------------------------- */
export async function getOrderById(orderId) {
  const [[order]] = await db.query(
    `SELECT o.id, o.user_id, o.promotion_id, o.total, o.discount_total, o.status, o.created_at,
            p.code AS promo_code, p.discount_type, p.discount_value
     FROM orders o
     LEFT JOIN promotions p ON p.id = o.promotion_id
     WHERE o.id = ?`,
    [orderId]
  );
  if (!order) return null;

  const [items] = await db.query(
    `SELECT oi.product_size_id, oi.quantity, oi.price,
            ps.size_label,
            pr.id   AS product_id,
            pr.name AS product_name,
            pr.brand
     FROM order_items oi
     JOIN product_sizes ps ON ps.id = oi.product_size_id
     JOIN products pr       ON pr.id = ps.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  return { ...order, items };
}

/** Liste paginée des commandes (admin) avec filtre utilisateur/état */
export async function listOrders({
  user_id,
  status,
  limit = 20,
  offset = 0,
} = {}) {
  const where = [];
  const params = [];

  if (user_id) { where.push("o.user_id = ?"); params.push(user_id); }
  if (status)  { where.push("o.status = ?");  params.push(status); }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await db.query(
    `
    SELECT o.id, o.user_id, o.promotion_id, o.total, o.discount_total, o.status, o.created_at,
           u.username, u.email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ${whereSQL}
    ORDER BY o.id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );
  return rows;
}

/** Liste des commandes d’un utilisateur (côté client) */
export async function listOrdersByUser(userId, { limit = 20, offset = 0 } = {}) {
  const [rows] = await db.query(
    `
    SELECT id, user_id, promotion_id, total, discount_total, status, created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ? OFFSET ?
    `,
    [userId, Number(limit), Number(offset)]
  );
  return rows;
}

/* --------------------------- Update --------------------------- */
/** Mettre à jour le statut de la commande (admin) */
export async function updateOrderStatus(orderId, nextStatus) {
  const allowed = new Set(["pending", "paid", "preparing", "shipped", "delivered", "canceled", "refunded"]);
  if (!allowed.has(nextStatus)) throw new Error("invalid_status");

  const [res] = await db.query(
    `UPDATE orders SET status = ? WHERE id = ?`,
    [nextStatus, orderId]
  );
  return { affectedRows: res.affectedRows };
}

/** Annuler une commande et remettre le stock (si possible) */
export async function cancelOrder(orderId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[ord]] = await conn.query(
      `SELECT status FROM orders WHERE id = ? FOR UPDATE`,
      [orderId]
    );
    if (!ord) throw new Error("order_not_found");
    if (ord.status === "canceled" || ord.status === "refunded") {
      await conn.rollback();
      return { affectedRows: 0, status: ord.status };
    }

    // remettre le stock pour chaque item
    const [items] = await conn.query(
      `SELECT product_size_id, quantity FROM order_items WHERE order_id = ?`,
      [orderId]
    );
    for (const it of items) {
      await conn.query(
        `UPDATE product_sizes SET stock_qty = stock_qty + ? WHERE id = ?`,
        [it.quantity, it.product_size_id]
      );
    }

    const [res] = await conn.query(
      `UPDATE orders SET status = 'canceled' WHERE id = ?`,
      [orderId]
    );

    await conn.commit();
    return { affectedRows: res.affectedRows, status: "canceled" };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
