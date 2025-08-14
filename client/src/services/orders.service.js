// src/services/orders.service.js
import axios from "axios";
import { BASE_URL } from "../data/api";
import { authenticatedRequest } from "../utils/general/tokenUtil";

const URL = `${BASE_URL}/orders`;

export const ordersService = {
  /**
   * Récupère toutes les commandes (admin)
   */
  async getAll() {
    return authenticatedRequest(URL, "get");
  },

  /**
   * Récupère une commande par ID (admin ou client si autorisé)
   */
  async getById(id) {
    return authenticatedRequest(`${URL}/${id}`, "get");
  },

  /**
   * Met à jour le statut d'une commande (admin)
   */
  async updateStatus(id, status) {
    return authenticatedRequest(`${URL}/${id}`, "put", { status });
  },

  /**
   * Supprime une commande (admin)
   */
  async remove(id) {
    return authenticatedRequest(`${URL}/${id}`, "delete");
  },

  /**
   * Crée une commande (client)
   */
  async create(orderData) {
    return authenticatedRequest(URL, "post", orderData);
  },
};
