import { authenticatedRequest } from "../utils/general/tokenUtil";

export const cartService = {
  /**
   * Récupère le panier complet de l’utilisateur connecté
   * GET /api/cart
   */
  get() {
    return authenticatedRequest("/api/cart", "get");
  },

  /**
   * Récupère juste le nombre total d’articles (quantités cumulées)
   * GET /api/cart/count
   */
  count() {
    return authenticatedRequest("/api/cart/count", "get");
  },

  /**
   * Récupère le total du panier (recalculé depuis les prix produits)
   * GET /api/cart/totals
   */
  totals() {
    return authenticatedRequest("/api/cart/totals", "get");
  },

  /**
   * Ajoute un article au panier (ou incrémente la quantité si déjà présent)
   * POST /api/cart/items
   */
  add(product_size_id, qty = 1) {
    return authenticatedRequest("/api/cart/items", "post", { product_size_id, qty });
  },

  /**
   * Met à jour la quantité d’un article (remplacement)
   * PUT /api/cart/items/:product_size_id
   */
  setQty(product_size_id, qty) {
    return authenticatedRequest(`/api/cart/items/${product_size_id}`, "put", { qty });
  },

  /**
   * Supprime un article du panier
   * DELETE /api/cart/items/:product_size_id
   */
  remove(product_size_id) {
    return authenticatedRequest(`/api/cart/items/${product_size_id}`, "delete");
  },

  /**
   * Vide complètement le panier
   * DELETE /api/cart
   */
  clear() {
    return authenticatedRequest("/api/cart", "delete");
  },
};
