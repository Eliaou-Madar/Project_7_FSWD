// client/src/services/products.service.js
import axios from "axios";
import { authenticatedRequest } from "../utils/general/tokenUtil";

// BASE peut être vide => en dev, Vite proxy /api -> backend
const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

// Axios instance centralisée
const api = axios.create({
  baseURL: BASE,          // "" => fetch /api/... local, sinon http://localhost:3000
  withCredentials: true,
  headers: { "Cache-Control": "no-cache" },
  validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
});

// Garde-fou: s'assure qu'on reçoit bien du JSON
function ensureJson(res) {
  const ct = (res.headers?.["content-type"] || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const preview =
      typeof res.data === "string" ? res.data.slice(0, 150) : JSON.stringify(res.data).slice(0, 150);
    throw new Error(`Non-JSON from ${res.config?.url || ""}: ${preview}...`);
  }
}

export const productsService = {
  async list(q = "") {
    const res = await api.get("/api/products", {
      params: q ? { search: q, _: Date.now() } : { _: Date.now() }, // bust cache
    });
    if (res.status === 304) return "__KEEP__";
    ensureJson(res);
    // supporte {products:[]}, {data:[]}, ou []
    return res.data?.products ?? res.data?.data ?? res.data;
  },

  async getById(id) {
    if (!id) throw new Error("missing product id");
    const res = await api.get(`/api/products/${id}`);
    if (res.status === 304) return "__KEEP__";
    ensureJson(res);
    // supporte {product:{}}, {data:{}}, ou {}
    return res.data?.product ?? res.data?.data ?? res.data;
  },

  async create(productData) {
    // nécessite auth (tokenUtil)
    return authenticatedRequest(`${BASE}/api/products`, "post", productData, {
      headers: { "Content-Type": "application/json" },
    });
  },

  async update(id, productData) {
    return authenticatedRequest(`${BASE}/api/products/${id}`, "put", productData, {
      headers: { "Content-Type": "application/json" },
    });
  },

  async remove(id) {
    return authenticatedRequest(`${BASE}/api/products/${id}`, "delete");
  },
};
