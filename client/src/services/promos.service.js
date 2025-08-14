// src/services/promos.service.js
import axios from "axios";
import { BASE_URL } from "../data/api";
import { authenticatedRequest } from "../utils/general/tokenUtil";

const URL = `${BASE_URL}/promos`;

export const promosService = {
  /**
   * Récupère toutes les promos
   */
  async getAll() {
    return axios.get(URL);
  },

  /**
   * Récupère une promo par ID
   */
  async getById(id) {
    return axios.get(`${URL}/${id}`);
  },

  /**
   * Crée une nouvelle promo (admin)
   */
  async create(promoData) {
    return authenticatedRequest(URL, "post", promoData);
  },

  /**
   * Met à jour une promo existante (admin)
   */
  async update(id, promoData) {
    return authenticatedRequest(`${URL}/${id}`, "put", promoData);
  },

  /**
   * Supprime une promo (admin)
   */
  async remove(id) {
    return authenticatedRequest(`${URL}/${id}`, "delete");
  },
};
