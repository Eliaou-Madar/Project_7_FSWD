// server/routes/productsSize.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import adminOnly from "../utils/adminMiddleware.js";
import {
  listSizes,
  addSize,
  updateSize,
  deleteSize,
} from "../models/productSizeModel.js";

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

/**
 * @desc Lister les tailles d'un produit
 * @route GET /products/:productId/sizes
 * @access Public
 */
router.get("/products/:productId/sizes", async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });

  try {
    const rows = await listSizes(Number(productId));
    res.json({ status: 200, message: "Sizes found", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listing sizes" });
  }
});

/**
 * @desc Ajouter une taille à un produit
 * @route POST /products/:productId/sizes
 * @body { label, stock? }
 * @access Admin
 */
router.post("/products/:productId/sizes", auth, adminOnly, async (req, res) => {
  const { productId } = req.params;
  const { label, stock = 0 } = req.body || {};
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });
  if (!label) return res.status(400).json({ message: "label is required" });

  try {
    const result = await addSize(Number(productId), { label, stock: Number(stock) });
    res.status(201).json({ message: "Size added", data: result });
  } catch (e) {
    if (e.message === "size_already_exists") {
      return res.status(409).json({ message: "This size already exists for the product" });
    }
    console.error(e);
    res.status(500).json({ message: "Error adding size" });
  }
});

/**
 * @desc Mettre à jour une taille (label/stock)
 * @route PUT /sizes/:id
 * @body { label?, stock? }
 * @access Admin
 */
router.put("/sizes/:id", auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  const payload = {};
  if (req.body?.label !== undefined) payload.label = req.body.label;
  if (req.body?.stock !== undefined) payload.stock = Number(req.body.stock);
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  try {
    const r = await updateSize(Number(id), payload);
    if (r.affectedRows === 0) return res.status(404).json({ message: "Size not found or unchanged" });
    res.json({ status: 200, message: "Size updated", data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error updating size" });
  }
});

/**
 * @desc Supprimer une taille
 * @route DELETE /sizes/:id
 * @access Admin
 */
router.delete("/sizes/:id", auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    const r = await deleteSize(Number(id));
    if (r.affectedRows === 0) return res.status(404).json({ message: "Size not found" });
    res.json({ status: 200, message: "Size deleted", data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error deleting size" });
  }
});

export default router;
