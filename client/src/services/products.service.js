// src/services/products.service.js
import axios from "axios";
import { authenticatedRequest } from "../utils/general/tokenUtil";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const URL = `${BASE}/api/products`;

export const productsService = {
  async list(q = "") {
    const res = await axios.get(URL, {
      params: q ? { search: q, _: Date.now() } : { _: Date.now() }, // bust cache
      headers: { "Cache-Control": "no-cache" },
      withCredentials: true,
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    if (res.status === 304) return "__KEEP__";
    // supporte {products:[]}, {data:[]}, ou []
    return res.data?.products ?? res.data?.data ?? res.data;
  },

  async getById(id) {
    const res = await axios.get(`${URL}/${id}`, {
      withCredentials: true,
      headers: { "Cache-Control": "no-cache" },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    if (res.status === 304) return "__KEEP__";
    return res.data?.product ?? res.data?.data ?? res.data;
  },

  async create(productData) {
    return authenticatedRequest(URL, "post", productData, {
      headers: { "Content-Type": "application/json" },
    });
  },

  async update(id, productData) {
    return authenticatedRequest(`${URL}/${id}`, "put", productData, {
      headers: { "Content-Type": "application/json" },
    });
  },

  async remove(id) {
    return authenticatedRequest(`${URL}/${id}`, "delete");
  },
};
