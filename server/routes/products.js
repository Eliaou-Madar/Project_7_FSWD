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
import { addManySizes } from "../models/productSizeModel.js"; // ⬅️ IMPORTANT

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

/** Tailles par défaut */
const DEFAULT_SIZES = [
  { label: "EU 40", stock: 10 },
  { label: "EU 41", stock: 10 },
  { label: "EU 42", stock: 10 },
  { label: "EU 43", stock: 10 },
  { label: "EU 44", stock: 10 },
  { label: "EU 45", stock: 10 },
];

/**
 * @desc Liste des produits (public)
 * ...
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
 * @desc Détail produit (public)
 * ...
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
 * body: { name, brand?, description?, price, is_limited?, url?, images?: string[], sizes?: (string|{label,stock})[] }
 */
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    let {
      name,
      brand = null,
      description = "",
      price,
      is_limited = false,
      url,                 // ex: "/img/shoes/3.jpg"
      images = [],         // si vide, on dérive depuis url
      sizes,               // si vide/absent => DEFAULT_SIZES
    } = req.body || {};

    if (!name || price === undefined) {
      return res.status(400).json({ message: "name and price are required" });
    }

    // Map simple: si url fourni et pas d'images => images = [url]
    if ((!Array.isArray(images) || images.length === 0) && typeof url === "string" && url.trim()) {
      images = [url.trim()];
    }

    // 1) Création du produit (sans tailles)
    const created = await createProduct({
      name,
      brand,
      description,
      price: Number(price),
      is_limited: !!is_limited,
      images: Array.isArray(images) ? images : [],
    });

    const productId = created.id;

    // 2) Ajout des tailles :
    //    - si `sizes` absent/vides -> DEFAULT_SIZES
    //    - supporte formats: ["EU 42", ...] ou [{label, stock}, ...]
    let sizesToInsert = [];
    if (Array.isArray(sizes) && sizes.length) {
      sizesToInsert = sizes;
    } else {
      sizesToInsert = DEFAULT_SIZES;
    }

    await addManySizes(productId, sizesToInsert); // ⬅️ AJOUT EFFECTIF

    return res.status(201).json({ message: "Product created", data: { id: productId } });
  } catch (e) {
    console.error("Create product failed:", e);
    return res.status(500).json({ message: "An error occurred while creating the product" });
  }
});

/**
 * @desc Mettre à jour un produit (admin)
 * ...
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
 * ...
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
