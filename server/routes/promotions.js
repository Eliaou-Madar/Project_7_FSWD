// server/routes/promotions.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import adminOnly from "../utils/adminMiddleware.js";

import {
  getActivePromotions,
  listPromotions,
  getPromotionById,
  getPromotionForProduct,
  createPromotion,
  updatePromotion,
  deletePromotion,
  deleteExpiredPromotions,
} from "../models/promotionModel.js";

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

/* ======================= Public ======================= */

/**
 * @desc Liste des promotions actives (NOW() entre start_date et end_date)
 * @route GET /promotions/active
 * @access Public
 */
router.get("/active", async (_req, res) => {
  try {
    const rows = await getActivePromotions();
    res.json({ status: 200, message: "Active promotions", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching active promotions" });
  }
});

/**
 * @desc (Optionnel) Promo active pour un produit (si table de liaison existe)
 * @route GET /promotions/product/:productId
 * @access Public
 */
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });
  try {
    const promo = await getPromotionForProduct(Number(productId));
    if (!promo) return res.status(404).json({ message: "No active promotion for this product" });
    res.json({ status: 200, message: "Promotion found", data: promo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error getting product promotion" });
  }
});

/* ======================= Admin ======================= */

/**
 * @desc Liste paginée de toutes les promotions
 * @route GET /promotions
 * @query limit?, offset?, sort? = newest|start_date|end_date
 * @access Admin
 */
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const { limit = 20, offset = 0, sort = "newest" } = req.query;
    const rows = await listPromotions({
      limit: Number(limit),
      offset: Number(offset),
      sort,
    });
    res.json({ status: 200, message: "Promotions found", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listing promotions" });
  }
});

/**
 * @desc Détail d’une promotion
 * @route GET /promotions/:id
 * @access Admin
 */
router.get("/:id", auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    const promo = await getPromotionById(Number(id));
    if (!promo) return res.status(404).json({ message: "Promotion not found" });
    res.json({ status: 200, message: `Promotion ${id} found`, data: promo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error getting promotion" });
  }
});

/**
 * @desc Créer une promotion
 * @route POST /promotions
 * @body { title, description?, discount_percent, start_date, end_date }
 * @access Admin
 */
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { title, description = "", discount_percent, start_date, end_date } = req.body || {};
    if (!title || discount_percent === undefined || !start_date || !end_date) {
      return res.status(400).json({ message: "title, discount_percent, start_date, end_date are required" });
    }
    const pct = Number(discount_percent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ message: "discount_percent must be a number between 0 and 100" });
    }

    const created = await createPromotion({ title, description, discount_percent: pct, start_date, end_date });
    res.status(201).json({ message: "Promotion created", data: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error creating promotion" });
  }
});

/**
 * @desc Mettre à jour une promotion
 * @route PUT /promotions/:id
 * @body { title?, description?, discount_percent?, start_date?, end_date? }
 * @access Admin
 */
router.put("/:id", auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  const { title, description, discount_percent, start_date, end_date } = req.body || {};
  const payload = {};
  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (discount_percent !== undefined) {
    const pct = Number(discount_percent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ message: "discount_percent must be a number between 0 and 100" });
    }
    payload.discount_percent = pct;
  }
  if (start_date !== undefined) payload.start_date = start_date;
  if (end_date !== undefined) payload.end_date = end_date;

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  try {
    const r = await updatePromotion(Number(id), payload);
    if (r.affectedRows === 0) return res.status(404).json({ message: "Promotion not found or unchanged" });
    res.json({ status: 200, message: `Promotion ${id} updated`, data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error updating promotion" });
  }
});

/**
 * @desc Supprimer une promotion
 * @route DELETE /promotions/:id
 * @access Admin
 */
router.delete("/:id", auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    const r = await deletePromotion(Number(id));
    if (r.affectedRows === 0) return res.status(404).json({ message: "Promotion not found" });
    res.json({ status: 200, message: `Promotion ${id} deleted`, data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error deleting promotion" });
  }
});

/**
 * @desc Supprimer toutes les promotions expirées (end_date < NOW())
 * @route DELETE /promotions/expired
 * @access Admin
 */
router.delete("/expired", auth, adminOnly, async (_req, res) => {
  try {
    const r = await deleteExpiredPromotions();
    res.json({ status: 200, message: "Expired promotions deleted", data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error deleting expired promotions" });
  }
});

export default router;
