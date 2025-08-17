// server/routes/products.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import adminOnly from "../utils/adminMiddleware.js";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../models/productModel.js";

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

/**
 * @desc Liste des produits (public)
 * @route GET /products
 * @query search, brand, is_limited, minPrice, maxPrice, limit, offset, sort(newest|price_asc|price_desc)
 */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      brand,
      is_limited,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0,
      sort = "newest",
    } = req.query;

    const products = await listProducts({
      search,
      brand,
      is_limited: is_limited === undefined ? undefined : is_limited == "1" || is_limited === "true",
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      limit: Number(limit),
      offset: Number(offset),
      sort,
    });

    res.status(200).json({ products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred while listing products" });
  }
});

/**
 * @desc Détail d’un produit (public)
 * @route GET /products/:id
 */
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred while getting the product" });
  }
});

/**
 * @desc Créer un produit (admin)
 * @route POST /products
 * @access Admin
 * body: { name, brand?, description?, price, is_limited?, images?: string[], sizes?: [{label, stock}] }
 */
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { name, brand = null, description = "", price, is_limited = false, images = [], sizes = [] } = req.body || {};
    if (!name || price === undefined) {
      return res.status(400).json({ message: "name and price are required" });
    }
    const created = await createProduct({
      name,
      brand,
      description,
      price: Number(price),
      is_limited: !!is_limited,
      images: Array.isArray(images) ? images : [],
      sizes: Array.isArray(sizes) ? sizes : [],
    });
    res.status(201).json({ message: "Product created", data: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred while creating the product" });
  }
});

/**
 * @desc Mettre à jour un produit (admin) — champs de base uniquement
 * @route PUT /products/:id
 * @access Admin
 * body: { name?, brand?, description?, price?, is_limited? }
 * (Pour gérer images/tailles, on peut exposer des endpoints dédiés si besoin)
 */
router.put("/:id", auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  const allowed = ["name", "brand", "description", "price", "is_limited"];
  const payload = {};
  for (const k of allowed) {
    if (req.body?.[k] !== undefined) payload[k] = k === "price" ? Number(req.body[k]) : req.body[k];
  }
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  try {
    const result = await updateProduct(id, payload);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found or no changes" });
    res.json({ status: 200, message: `Product ${id} updated`, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred while updating the product" });
  }
});

/**
 * @desc Supprimer un produit (admin)
 * @route DELETE /products/:id
 * @access Admin
 */
router.delete("/:id", auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    const result = await deleteProduct(id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ status: 200, message: `Product ${id} deleted`, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred while deleting the product" });
  }
});

export default router;
