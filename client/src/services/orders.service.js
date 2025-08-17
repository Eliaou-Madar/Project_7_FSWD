// src/services/orders.service.js
import { BASE_URL } from "../data/api";
import { authenticatedRequest } from "../utils/general/tokenUtil";

/** Join util: évite les doubles // et gère root vide */
function join(root, path) {
  const r = (root || "").replace(/\/+$/g, "");       // trim trailing /
  const p = `/${String(path || "").replace(/^\/+/g, "")}`; // ensure single leading /
  return `${r}${p}`;
}

// On force le préfixe /api ici.
// ⚠️ Donc BASE_URL doit être '' (ou https://ton-domaine) mais PAS '/api'.
const API_ROOT   = join(BASE_URL, "/api");
const ADMIN_URL  = join(API_ROOT, "/admin/orders");
const ORDERS_URL = join(API_ROOT, "/orders");

/** Build querystring from object */
function qs(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
}

export const ordersService = {
  /** ADMIN — liste paginée/filtrée */
  async getAll(params = {}) {
    return authenticatedRequest(`${ADMIN_URL}${qs(params)}`, "get");
  },

  /** Alias .list() pour compat */
  async list(params = {}) {
    return this.getAll(params);
  },

  /** ADMIN — détail par ID */
  async getById(id) {
    return authenticatedRequest(join(ADMIN_URL, `/${id}`), "get");
  },

  /** ADMIN — MAJ statut */
  async updateStatus(id, status) {
    return authenticatedRequest(join(ADMIN_URL, `/${id}`), "patch", { status });
  },

  /** ADMIN — annulation/suppression */
  async remove(id) {
    return authenticatedRequest(join(ADMIN_URL, `/${id}`), "delete");
  },

  /** CLIENT — création d’une commande (depuis panier) */
  async create(orderData) {
    return authenticatedRequest(ORDERS_URL, "post", orderData);
  },
};
