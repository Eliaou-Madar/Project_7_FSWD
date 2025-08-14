// server/routes/orders.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import adminOnly from "../utils/adminMiddleware.js";
import {
  createOrderFromCart,
  getOrderById,
  listOrders,
  listOrdersByUser,
  updateOrderStatus,
  cancelOrder,
} from "../models/orderModel.js";

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

/* --------- Créer une commande depuis le panier (client) ---------
 * @route POST /orders
 * body: { promotionCode? }
 */
router.post("/", auth, async (req, res) => {
  try {
    const { promotionCode } = req.body || {};
    const order = await createOrderFromCart(req.user.id, { promotionCode });
    res.status(201).json({ message: "Order created", data: order });
  } catch (e) {
    if (e.message === "cart_not_found") {
      return res.status(404).json({ message: "Cart not found" });
    }
    if (e.message === "cart_empty") {
      return res.status(400).json({ message: "Cart is empty" });
    }
    if (e.message === "product_size_not_found") {
      return res.status(404).json({ message: "Product size not found" });
    }
    if (e.message === "not_enough_stock") {
      return res.status(409).json({ message: "Not enough stock" });
    }
    console.error(e);
    res.status(500).json({ message: "Error creating order" });
  }
});

/* --------- Liste des commandes (admin) -----------
 * @route GET /orders
 * query: user_id?, status?, limit?, offset?
 */
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const { user_id, status, limit = 20, offset = 0 } = req.query;
    const rows = await listOrders({
      user_id: user_id && isInt(user_id) ? Number(user_id) : undefined,
      status,
      limit: Number(limit),
      offset: Number(offset),
    });
    res.json({ status: 200, message: "Orders found", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listing orders" });
  }
});

/* --------- Mes commandes (client) -----------
 * @route GET /orders/me
 */
router.get("/me", auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const rows = await listOrdersByUser(req.user.id, {
      limit: Number(limit),
      offset: Number(offset),
    });
    res.json({ status: 200, message: "My orders", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listing user orders" });
  }
});

/* --------- Détail d’une commande (self ou admin) -----------
 * @route GET /orders/:id
 */
router.get("/:id", auth, async (req, res) => {
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    const order = await getOrderById(Number(id));
    if (!order) return res.status(404).json({ message: "Order not found" });

    // self or admin
    if (req.user.role !== "admin" && Number(order.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden: not your order" });
    }

    res.json({ status: 200, message: `Order ${id} found`, data: order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error getting order" });
  }
});

/* --------- Mettre à jour le statut (admin) -----------
 * @route PUT /orders/:id/status
 * body: { status }  // pending|paid|preparing|shipped|delivered|canceled|refunded
 */
router.put("/:id/status", auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  const { status } = req.body || {};
  if (!status) return res.status(400).json({ message: "status is required" });

  try {
    const result = await updateOrderStatus(Number(id), status);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found or status unchanged" });
    }
    res.json({ status: 200, message: `Order ${id} status updated`, data: result });
  } catch (e) {
    if (e.message === "invalid_status") {
      return res.status(400).json({ message: "Invalid status" });
    }
    console.error(e);
    res.status(500).json({ message: "Error updating order status" });
  }
});

/* --------- Annuler une commande (self ou admin) -----------
 * @route POST /orders/:id/cancel
 * Remet le stock, passe la commande à 'canceled' (si possible)
 */
router.post("/:id/cancel", auth, async (req, res) => {
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    // vérifier ownership ou admin
    const order = await getOrderById(Number(id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (req.user.role !== "admin" && Number(order.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden: not your order" });
    }

    const result = await cancelOrder(Number(id));
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: `Order ${id} already ${result.status || "unchanged"}` });
    }
    res.json({ status: 200, message: `Order ${id} canceled`, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error canceling order" });
  }
});

export default router;
