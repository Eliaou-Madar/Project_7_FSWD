import { api, apiAuth } from "../utils/http";

const isFD = (v) => typeof FormData !== "undefined" && v instanceof FormData;

function fdToJson(fd) {
  const obj = {};
  fd.forEach((value, key) => {
    if (key === "image") return;
    obj[key] = value;
  });
  if (obj.price !== undefined) obj.price = Number(obj.price);
  if (obj.is_limited !== undefined) {
    const v = obj.is_limited;
    obj.is_limited = v === true || v === "true" || v === 1 || v === "1";
  }
  return obj;
}

function ensureJsonFromAxios(res) {
  const ct = (res.headers?.["content-type"] || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const p = typeof res.data === "string" ? res.data.slice(0, 120) : JSON.stringify(res.data).slice(0, 120);
    throw new Error(`Unexpected content-type from ${res.config?.url}: ${p}...`);
  }
}

export const productsService = {
  async list(q = "") {
    const res = await api.get(`/products`, {
      params: q ? { search: q, _: Date.now() } : { _: Date.now() },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    if (res.status === 304) return [];
    ensureJsonFromAxios(res);
    const data = res.data?.products ?? res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  async getById(id) {
    if (!id) throw new Error("missing product id");
    const res = await api.get(`/products/${encodeURIComponent(id)}`);
    ensureJsonFromAxios(res);
    return res.data?.product ?? res.data?.data ?? res.data;
  },

  async create(body) {
    const payload = isFD(body) ? fdToJson(body) : body;
    const { data } = await apiAuth.post(`/products`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return data?.data ?? data ?? null;
  },

  async update(id, body) {
    if (!id) throw new Error("missing product id");
    const payload = isFD(body) ? fdToJson(body) : body;
    const { data } = await apiAuth.put(`/products/${encodeURIComponent(id)}`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return data?.data ?? data ?? null;
  },

  async remove(id) {
    if (!id) throw new Error("missing product id");
    const { data } = await apiAuth.delete(`/products/${encodeURIComponent(id)}`);
    return data?.data ?? data ?? null;
  },
};