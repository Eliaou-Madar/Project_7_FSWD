// client/src/services/reviews.service.js
import { api } from "../utils/http";
import { authenticatedRequest } from "../utils/general/tokenUtil";

export const reviewsService = {
  // Public
  async listByProduct(productId, { limit = 20, offset = 0, sort = "newest" } = {}) {
    const { data } = await api.get(`/reviews/product/${encodeURIComponent(productId)}`, {
      params: { limit, offset, sort, _: Date.now() },
    });
    return data?.data ?? data ?? [];
  },

  async summary(productId) {
    const { data } = await api.get(`/reviews/product/${encodeURIComponent(productId)}/summary`, {
      params: { _: Date.now() },
    });
    return data?.data ?? data ?? { count: 0, avg_rating: 0, breakdown: {} };
  },

  // Private
  async getMine(productId) {
    const res = await authenticatedRequest(`/api/reviews/product/${encodeURIComponent(productId)}/me`, "get");
    return res?.data?.data ?? res?.data ?? res ?? null;
  },

  async create({ product_id, rating, comment = "" }) {
    const res = await authenticatedRequest(`/api/reviews`, "post", { product_id, rating, comment });
    return res?.data?.data ?? res?.data ?? res ?? null;
  },

  async upsert(productId, { rating, comment = "" }) {
    const res = await authenticatedRequest(
      `/api/reviews/product/${encodeURIComponent(productId)}/upsert`,
      "post",
      { rating, comment }
    );
    return res?.data?.data ?? res?.data ?? res ?? null;
  },

  async update(id, { rating, comment }) {
    const res = await authenticatedRequest(`/api/reviews/${encodeURIComponent(id)}`, "put", { rating, comment });
    return res?.data?.data ?? res?.data ?? res ?? null;
  },

  async remove(id) {
    const res = await authenticatedRequest(`/api/reviews/${encodeURIComponent(id)}`, "delete");
    return res?.data?.data ?? res?.data ?? res ?? null;
  },

  async removeMine(productId) {
    const res = await authenticatedRequest(`/api/reviews/product/${encodeURIComponent(productId)}/me`, "delete");
    return res?.data?.data ?? res?.data ?? res ?? null;
  },
};
