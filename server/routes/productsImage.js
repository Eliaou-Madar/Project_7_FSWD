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

/** Normalise une URL d’image:
 *  - garde http(s)/data: tel quel
 *  - si relative sans slash (ex: "img/shoes/1.jpg") => "/img/shoes/1.jpg"
 *  - si vide => null
 */
function normalizeImageUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

/**
 * GET /products/:productId/images
 * Public
 * Retourne:
 *  {
 *    image_url: string (première image ou fallback),
 *    images: string[] (toutes les URLs normalisées)
 *  }
 */
router.get("/products/:productId/images", async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });

  try {
    const rows = await listImages(Number(productId)); // attendu: [{id, product_id, url}, ...]
    const images = (rows || [])
      .map(r => normalizeImageUrl(r.url))
      .filter(Boolean);

    const image_url = images[0] || "/img/shoes/fallback.jpg";

    res.json({
      status: 200,
      message: "Images found",
      data: { image_url, images },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listing images" });
  }
});

/**
 * POST /products/:productId/images
 * Admin
 * body: { url: string }
 */
router.post("/products/:productId/images", auth, adminOnly, async (req, res) => {
  const { productId } = req.params;
  let { url } = req.body || {};

  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });
  if (!url || typeof url !== "string") return res.status(400).json({ message: "url is required" });

  url = normalizeImageUrl(url);
  if (!url) return res.status(400).json({ message: "url is invalid" });

  try {
    const result = await addImage(Number(productId), url);
    res.status(201).json({ message: "Image added", data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error adding image" });
  }
});

/**
 * DELETE /images/:id
 * Admin
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
