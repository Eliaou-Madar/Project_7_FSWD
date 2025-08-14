// src/services/products.service.js
import axios from "axios";
import { BASE_URL } from "../data/api";
import { authenticatedRequest } from "../utils/general/tokenUtil";

const URL = `${BASE_URL}/products`;

export const productsService = {
  /**
   * Récupère tous les produits (public)
   */
  async getAll() {
    return axios.get(URL);
  },

  /**
   * Récupère un produit par ID (public)
   */
  async getById(id) {
    return axios.get(`${URL}/${id}`);
  },

  /**
   * Crée un nouveau produit (admin)
   */
  async create(productData) {
    return authenticatedRequest(URL, "post", productData, {
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Met à jour un produit (admin)
   */
  async update(id, productData) {
    return authenticatedRequest(`${URL}/${id}`, "put", productData, {
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Supprime un produit (admin)
   */
  async remove(id) {
    return authenticatedRequest(`${URL}/${id}`, "delete");
  },
};
