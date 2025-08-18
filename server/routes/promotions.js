// server/routes/promotions.js
import { Router } from "express";
import db from "../database/connection.js";
import auth from "../utils/authMiddleware.js";
import adminOnly from "../utils/adminMiddleware.js";

import {
  getActivePromotions,
  getPromotionById,
  getPromotionForProduct,
  createPromotion,
  updatePromotion,
  deletePromotion,
  deleteExpiredPromotions,
} from "../models/promotionModel.js";

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

console.log("[promotions] router loaded"); // DEBUG

/* ========= Public ========= */

// GET /promotions/active
router.get("/active", async (_req, res) => {
  try {
    const rows = await getActivePromotions();
    res.json({ status: 200, message: "Active promotions", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching active promotions" });
  }
});

// GET /promotions/product/:productId (optionnel)
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

/* ========= Admin ========= */

// GET /promotions  (ADMIN) — direct SQL (avec alias)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const { limit = 20, offset = 0, sort = "newest" } = req.query;

    // Tri: pour les dates texte, tri chrono via STR_TO_DATE
    const toDT = (col) =>
      `STR_TO_DATE(REPLACE(REPLACE(SUBSTRING_INDEX(${col}, '.', 1), 'T', ' '), 'Z', ''), '%Y-%m-%d %H:%i:%s')`;

    let orderBy = "created_at DESC";
    if (sort === "start_date") orderBy = `${toDT("start_date")} DESC`;
    else if (sort === "end_date") orderBy = `${toDT("end_date")} DESC`;

    const SQL = `
      SELECT
        id,
        code,
        code AS title,                       -- alias compat
        description,
        discount_type,
        discount_value,
        discount_value AS discount_percent,  -- alias compat
        start_date,                          -- texte ISO
        end_date,                            -- texte ISO
        is_active,
        created_at
      FROM promotions
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(SQL, [Number(limit), Number(offset)]);
    res.json({ status: 200, message: "Promotions found", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listing promotions" });
  }
});

// GET /promotions/:id (admin)
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

// POST /promotions (admin) — pas de conversion, on stocke tel quel
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      description = null,
      start_date = null,  // texte ISO accepté
      end_date = null,    // texte ISO accepté
      is_active = true,
    } = req.body || {};

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ message: "code, discount_type, discount_value are required" });
    }
    if (!["percent", "fixed"].includes(discount_type)) {
      return res.status(400).json({ message: "discount_type must be 'percent' or 'fixed'" });
    }
    const val = Number(discount_value);
    if (Number.isNaN(val) || val < 0) {
      return res.status(400).json({ message: "discount_value must be a positive number" });
    }

    const created = await createPromotion({
      code,
      description,
      discount_type,
      discount_value: val,
      start_date,   // texte stocké tel quel
      end_date,     // texte stocké tel quel
      is_active,
    });
    res.status(201).json({ message: "Promotion created", data: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error creating promotion" });
  }
});

// PUT /promotions/:id (admin) — pas de conversion, on passe tel quel
router.put("/:id", auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  const up = req.body || {};

  if (up.discount_type && !["percent", "fixed"].includes(up.discount_type)) {
    return res.status(400).json({ message: "discount_type must be 'percent' or 'fixed'" });
  }
  if (up.discount_value !== undefined) {
    const val = Number(up.discount_value);
    if (Number.isNaN(val) || val < 0) {
      return res.status(400).json({ message: "discount_value must be a positive number" });
    }
  }

  try {
    const r = await updatePromotion(Number(id), up);
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: "Promotion not found or unchanged" });
    }
    res.json({ status: 200, message: `Promotion ${id} updated`, data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error updating promotion" });
  }
});

// DELETE /promotions/:id (admin)
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

// DELETE /promotions/expired (admin) — comparaison via STR_TO_DATE
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
