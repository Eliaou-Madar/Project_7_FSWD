// server/routes/productsImage.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import adminOnly from "../utils/adminMiddleware.js";
import {
  listImages,
  addImage,
  deleteImage,
} from "../models/productImageModel.js";

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

/**
 * @desc Lister les images d'un produit
 * @route GET /products/:productId/images
 * @access Public
 */
router.get("/products/:productId/images", async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });

  try {
    const rows = await listImages(Number(productId));
    res.json({ status: 200, message: "Images found", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listing images" });
  }
});

/**
 * @desc Ajouter une image à un produit
 * @route POST /products/:productId/images
 * @access Admin
 * @body { url }
 */
router.post("/products/:productId/images", auth, adminOnly, async (req, res) => {
  const { productId } = req.params;
  const { url } = req.body || {};
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });
  if (!url || typeof url !== "string") return res.status(400).json({ message: "url is required" });

  try {
    const result = await addImage(Number(productId), url.trim());
    res.status(201).json({ message: "Image added", data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error adding image" });
  }
});

/**
 * @desc Supprimer une image
 * @route DELETE /images/:id
 * @access Admin
 */
router.delete("/images/:id", auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    const r = await deleteImage(Number(id));
    if (r.affectedRows === 0) return res.status(404).json({ message: "Image not found" });
    res.json({ status: 200, message: "Image deleted", data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error deleting image" });
  }
});

export default router;
