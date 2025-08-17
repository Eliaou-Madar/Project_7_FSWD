// server/routes/admin.orders.js
import express from "express";
import auth from "../utils/authMiddleware.js";
import admin from "../utils/adminMiddleware.js";
import {
  listOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from "../models/orderModel.js";

const router = express.Router();

// vérif montage
router.get("/__ping", (_req, res) => res.json({ ok: true }));

// sécurise tout l'admin
router.use(auth, admin);

// GET /api/admin/orders
router.get("/orders", async (req, res, next) => {
  try {
    const { user_id, status, limit, offset } = req.query;
    const rows = await listOrders({
      user_id: user_id ? Number(user_id) : undefined,
      status,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/admin/orders/:id
router.get("/orders/:id", async (req, res, next) => {
  try {
    const row = await getOrderById(Number(req.params.id));
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  } catch (e) { next(e); }
});

// PATCH /api/admin/orders/:id  { status }
router.patch("/orders/:id", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const r = await updateOrderStatus(Number(req.params.id), status);
    res.json(r);
  } catch (e) { next(e); }
});

// DELETE /api/admin/orders/:id
router.delete("/orders/:id", async (req, res, next) => {
  try {
    const r = await cancelOrder(Number(req.params.id));
    res.json(r);
  } catch (e) { next(e); }
});

export default router;
