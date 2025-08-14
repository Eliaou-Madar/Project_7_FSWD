// server/routes/carts.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import {
  getCartByUser,
  countCartItems,
  addToCart,
  setItemQuantity,
  removeFromCart,
  clearCart,
  getCartTotals,
} from "../models/cartModel.js";

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

/**
 * @desc Récupérer le panier courant de l'utilisateur
 * @route GET /cart
 * @access Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const cart = await getCartByUser(req.user.id);
    res.json({ status: 200, message: "Cart found", data: cart });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error getting cart" });
  }
});

/**
 * @desc Compter le nombre total d'articles du panier (somme des quantités)
 * @route GET /cart/count
 * @access Private
 */
router.get("/count", auth, async (req, res) => {
  try {
    const qty = await countCartItems(req.user.id);
    res.json({ status: 200, message: "Cart count", data: { qty } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error counting cart items" });
  }
});

/**
 * @desc Obtenir le total actuel du panier (recalcule depuis products)
 * @route GET /cart/totals
 * @access Private
 */
router.get("/totals", auth, async (req, res) => {
  try {
    const totals = await getCartTotals(req.user.id);
    res.json({ status: 200, message: "Cart totals", data: totals });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error getting cart totals" });
  }
});

/**
 * @desc Ajouter un article au panier (ou incrémenter la quantité)
 * @route POST /cart/items
 * @access Private
 * body: { product_size_id, qty? }
 */
router.post("/items", auth, async (req, res) => {
  try {
    const { product_size_id, qty = 1 } = req.body || {};
    if (!product_size_id || !isInt(product_size_id)) {
      return res.status(400).json({ message: "product_size_id is required and must be an integer" });
    }
    const result = await addToCart(req.user.id, Number(product_size_id), Number(qty));
    res.status(201).json({ message: "Item added to cart", data: result });
  } catch (e) {
    if (e.message === "product_size_not_found") {
      return res.status(404).json({ message: "Product size not found" });
    }
    if (e.message === "not_enough_stock") {
      return res.status(409).json({ message: "Not enough stock" });
    }
    console.error(e);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

/**
 * @desc Mettre à jour la quantité d’un article (remplacement)
 * @route PUT /cart/items/:product_size_id
 * @access Private
 * body: { qty } (0 supprime l’article)
 */
router.put("/items/:product_size_id", auth, async (req, res) => {
  const { product_size_id } = req.params;
  const { qty } = req.body || {};
  if (!isInt(product_size_id)) return res.status(400).json({ message: "Invalid product_size_id" });
  if (qty === undefined || isNaN(Number(qty))) {
    return res.status(400).json({ message: "qty is required (number)" });
  }
  try {
    const result = await setItemQuantity(req.user.id, Number(product_size_id), Number(qty));
    res.json({ status: 200, message: "Item quantity updated", data: result });
  } catch (e) {
    if (e.message === "product_size_not_found") {
      return res.status(404).json({ message: "Product size not found" });
    }
    if (e.message === "not_enough_stock") {
      return res.status(409).json({ message: "Not enough stock" });
    }
    console.error(e);
    res.status(500).json({ message: "Error updating cart item" });
  }
});

/**
 * @desc Supprimer un article du panier
 * @route DELETE /cart/items/:product_size_id
 * @access Private
 */
router.delete("/items/:product_size_id", auth, async (req, res) => {
  const { product_size_id } = req.params;
  if (!isInt(product_size_id)) return res.status(400).json({ message: "Invalid product_size_id" });

  try {
    const result = await removeFromCart(req.user.id, Number(product_size_id));
    if (!result.removed) return res.status(404).json({ message: "Item not found in cart" });
    res.json({ status: 200, message: "Item removed from cart", data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error removing cart item" });
  }
});

/**
 * @desc Vider le panier
 * @route DELETE /cart
 * @access Private
 */
router.delete("/", auth, async (req, res) => {
  try {
    const result = await clearCart(req.user.id);
    res.json({ status: 200, message: "Cart cleared", data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error clearing cart" });
  }
});

export default router;
