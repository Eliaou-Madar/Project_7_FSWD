// server/routes/reviews.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import {
  listReviewsByProduct,
  getUserReviewForProduct,
  getReviewById,
  getProductRatingSummary,
  createReview,
  upsertUserReview,
  updateReview,
  deleteReview,
  deleteUserReview,
} from "../models/reviewModel.js";

const router = Router();
const isInt = (v) => /^\d+$/.test(String(v));

/* =========================================================
 * Public
 * =======================================================*/

/**
 * @desc Liste des avis d’un produit (paginé)
 * @route GET /reviews/product/:productId
 * @query limit, offset, sort(newest|rating_desc|rating_asc)
 */
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });

  const { limit = 20, offset = 0, sort = "newest" } = req.query;
  try {
    const rows = await listReviewsByProduct(Number(productId), {
      limit: Number(limit),
      offset: Number(offset),
      sort,
    });
    res.json({ status: 200, message: "Reviews found", data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listing reviews" });
  }
});

/**
 * @desc Résumé des notes d’un produit
 * @route GET /reviews/product/:productId/summary
 */
router.get("/product/:productId/summary", async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });

  try {
    const summary = await getProductRatingSummary(Number(productId));
    res.json({ status: 200, message: "Rating summary", data: summary });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error getting rating summary" });
  }
});

/* =========================================================
 * Privé (Utilisateur connecté)
 * =======================================================*/

/**
 * @desc Récupérer l’avis de l’utilisateur connecté pour un produit
 * @route GET /reviews/product/:productId/me
 * @access Private
 */
router.get("/product/:productId/me", auth, async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });

  try {
    const review = await getUserReviewForProduct(Number(productId), req.user.id);
    if (!review) return res.status(404).json({ message: "No review for this user/product" });
    res.json({ status: 200, message: "User review found", data: review });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error getting user review" });
  }
});

/**
 * @desc Créer un avis
 * @route POST /reviews
 * @access Private
 * body: { product_id, rating(1..5), comment? }
 */
router.post("/", auth, async (req, res) => {
  try {
    const { product_id, rating, comment = "" } = req.body || {};
    if (!product_id || !isInt(product_id)) {
      return res.status(400).json({ message: "product_id is required and must be an integer" });
    }
    if (rating === undefined) {
      return res.status(400).json({ message: "rating is required" });
    }

    const r = await createReview({
      product_id: Number(product_id),
      user_id: req.user.id,
      rating,
      comment,
    });
    res.status(201).json({ message: "Review created", data: r });
  } catch (e) {
    if (e.message === "already_reviewed") {
      return res.status(409).json({ message: "You have already reviewed this product" });
    }
    console.error(e);
    res.status(500).json({ message: "Error creating review" });
  }
});

/**
 * @desc Créer ou mettre à jour l’avis de l’utilisateur (upsert)
 * @route POST /reviews/product/:productId/upsert
 * @access Private
 * body: { rating(1..5), comment? }
 */
router.post("/product/:productId/upsert", auth, async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });

  const { rating, comment = "" } = req.body || {};
  if (rating === undefined) return res.status(400).json({ message: "rating is required" });

  try {
    const r = await upsertUserReview({
      product_id: Number(productId),
      user_id: req.user.id,
      rating,
      comment,
    });
    res.status(200).json({ message: "Review upserted", data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error upserting review" });
  }
});

/**
 * @desc Mettre à jour un avis par id (propriétaire ou admin)
 * @route PUT /reviews/:id
 * @access Private
 * body: { rating?, comment? }
 */
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    const review = await getReviewById(Number(id));
    if (!review) return res.status(404).json({ message: "Review not found" });

    // owner or admin
    if (req.user.role !== "admin" && Number(review.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden: not your review" });
    }

    const { rating, comment } = req.body || {};
    if (rating === undefined && comment === undefined) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const r = await updateReview(Number(id), { rating, comment });
    res.json({ status: 200, message: "Review updated", data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error updating review" });
  }
});

/**
 * @desc Supprimer un avis par id (propriétaire ou admin)
 * @route DELETE /reviews/:id
 * @access Private
 */
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    const review = await getReviewById(Number(id));
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (req.user.role !== "admin" && Number(review.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden: not your review" });
    }

    const r = await deleteReview(Number(id));
    res.json({ status: 200, message: "Review deleted", data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error deleting review" });
  }
});

/**
 * @desc Supprimer l’avis de l’utilisateur connecté pour un produit
 * @route DELETE /reviews/product/:productId/me
 * @access Private
 */
router.delete("/product/:productId/me", auth, async (req, res) => {
  const { productId } = req.params;
  if (!isInt(productId)) return res.status(400).json({ message: "Invalid productId" });

  try {
    const r = await deleteUserReview(Number(productId), req.user.id);
    if (r.affectedRows === 0) return res.status(404).json({ message: "User review not found for this product" });
    res.json({ status: 200, message: "User review deleted", data: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error deleting user review" });
  }
});

export default router;
