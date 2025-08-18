// server/routes/promotions.js
import { Router } from "express";
import db from "../database/connection.js";
import auth from "../utils/authMiddleware.js";
import adminOnly from "../utils/adminMiddleware.js";
import { toMySQLDate } from "../utils/mysqlDate.js";

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
// Force la conversion des dates pour POST/PUT
function normalizePromoDates(req, _res, next) {
  const b = req.body || {};
  if (Object.prototype.hasOwnProperty.call(b, "start_date")) {
    try { b.start_date = toMySQLDate(b.start_date); } catch { b.start_date = null; }
  }
  if (Object.prototype.hasOwnProperty.call(b, "end_date")) {
    try { b.end_date = toMySQLDate(b.end_date); } catch { b.end_date = null; }
  }
  req.body = b;
  next();
}

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

// GET /promotions  (ADMIN) — on garde le HOTFIX direct SQL (avec alias)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const { limit = 20, offset = 0, sort = "newest" } = req.query;
    let orderBy = "created_at DESC";
    if (sort === "start_date") orderBy = "start_date DESC";
    else if (sort === "end_date") orderBy = "end_date DESC";

    const SQL = `
      SELECT
        id,
        code,
        code AS title,                       -- alias compat
        description,
        discount_type,
        discount_value,
        discount_value AS discount_percent,  -- alias compat
        start_date,
        end_date,
        is_active,
        created_at
      FROM promotions
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    console.log("[promotions] HOTFIX LIST route in use"); // DEBUG
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

// POST /promotions (admin)
router.post("/", auth, adminOnly, normalizePromoDates, async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      description = null,
      start_date = null,
      end_date = null,
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

    const payload = {
      code,
      description,
      discount_type,
      discount_value: val,
      start_date: toMySQLDate(start_date),
      end_date: toMySQLDate(end_date),
      is_active,
    };

    // DEBUG (temporaire)
    console.log("[PROMO POST] raw:", req.body);
    console.log("[PROMO POST] normalized:", payload);

    const created = await createPromotion(payload);
    res.status(201).json({ message: "Promotion created", data: created });
  } catch (e) {
    console.error("[PROMO POST] ERROR:", e);
    if (e.message === "invalid_date") {
      return res.status(400).json({ message: "invalid_date_format" });
    }
    if (e?.code === "ER_TRUNCATED_WRONG_VALUE") {
      return res.status(400).json({ message: "invalid_datetime_value", detail: e.sqlMessage });
    }
    res.status(500).json({ message: "Error creating promotion" });
  }
});

// PUT /promotions/:id (admin)
router.put("/:id", auth, adminOnly, normalizePromoDates, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    // Normalisation dates
    const raw = req.body || {};
    const up = {
      ...raw,
      start_date: raw.start_date !== undefined ? toMySQLDate(raw.start_date) : undefined,
      end_date:   raw.end_date   !== undefined ? toMySQLDate(raw.end_date)   : undefined,
    };

    // Validations simples
    if (up.discount_type && !["percent", "fixed"].includes(up.discount_type)) {
      return res.status(400).json({ message: "discount_type must be 'percent' or 'fixed'" });
    }
    if (up.discount_value !== undefined) {
      const val = Number(up.discount_value);
      if (Number.isNaN(val) || val < 0) {
        return res.status(400).json({ message: "discount_value must be a positive number" });
      }
    }

    // DEBUG (temporaire)
    console.log("[PROMO PUT] id=%s raw:", id, raw);
    console.log("[PROMO PUT] normalized up:", up);

    const r = await updatePromotion(Number(id), up);
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: "Promotion not found or unchanged" });
    }
    res.json({ status: 200, message: `Promotion ${id} updated`, data: r });
  } catch (e) {
    console.error("[PROMO PUT] ERROR:", e);
    if (e.message === "invalid_date") {
      return res.status(400).json({ message: "invalid_date_format" });
    }
    // MySQL envoie souvent e.code === 'ER_TRUNCATED_WRONG_VALUE'
    if (e?.code === "ER_TRUNCATED_WRONG_VALUE") {
      return res.status(400).json({ message: "invalid_datetime_value", detail: e.sqlMessage });
    }
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

// DELETE /promotions/expired (admin)
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
