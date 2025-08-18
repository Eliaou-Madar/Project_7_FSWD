// client/src/services/products.service.js
import { api, apiAuth } from "../utils/http";

const isFD = (v) => typeof FormData !== "undefined" && v instanceof FormData;

function fdToJson(fd) {
  const obj = {};
  fd.forEach((value, key) => {
    if (key === "image") return; // (tu n’uploades pas le binaire côté serveur actuel)
    obj[key] = value;
  });
  if (obj.price !== undefined) obj.price = Number(obj.price);
  if (obj.is_limited !== undefined) {
    const v = obj.is_limited;
    obj.is_limited = v === true || v === "true" || v === 1 || v === "1";
  }
  return obj;
}

function withImagesFromUrl(payload) {
  if (!payload) return payload;
  const p = { ...payload };
  if (!p.images && p.url) {
    p.images = [p.url];
  }
  return p;
}

function ensureJsonFromAxios(res) {
  const ct = (res.headers?.["content-type"] || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const p = typeof res.data === "string" ? res.data.slice(0, 120) : JSON.stringify(res.data).slice(0, 120);
    throw new Error(`Unexpected content-type from ${res.config?.url}: ${p}...`);
  }
}

// ---- NEW: normalise l'input (string "?a=1&b=2" | "a=1&b=2" OU objet {a:1,b:2}) en params axios ----
function normalizeParams(input) {
  if (!input) return {};
  if (typeof input === "string") {
    const s = input.trim();
    const qs = s.startsWith("?") ? s.slice(1) : s;
    const usp = new URLSearchParams(qs);
    const obj = {};
    usp.forEach((v, k) => {
      if (v === "" || v === "any") return;
      obj[k] = v;
    });
    return obj;
  }
  if (typeof input === "object") {
    const obj = {};
    for (const [k, v] of Object.entries(input)) {
      if (v === null || v === undefined) continue;
      const sv = typeof v === "string" ? v.trim() : v;
      if (sv === "" || sv === "any") continue;
      obj[k] = sv;
    }
    return obj;
  }
  return {};
}

export const productsService = {
  // ---------- REPLACED ----------
  async list(query = "") {
    const params = normalizeParams(query);

    // Compat: si on t’envoie un simple string de recherche, map vers `search`
    if (typeof query === "string" && !query.includes("=") && query.trim()) {
      params.search = query.trim();
    }

    // Cache-bust léger pour éviter 304/soucis navigateur
    params._ = Date.now();

    const res = await api.get(`/products`, {
      params,
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });

    if (res.status === 304) return [];
    ensureJsonFromAxios(res);

    const data = res.data?.products ?? res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },
  // ---------- END REPLACED ----------

  async getById(id) {
    if (!id) throw new Error("missing product id");
    const res = await api.get(`/products/${encodeURIComponent(id)}`);
    ensureJsonFromAxios(res);
    return res.data?.product ?? res.data?.data ?? res.data;
  },

  async create(body) {
    const base = isFD(body) ? fdToJson(body) : body;
    const payload = withImagesFromUrl(base); // ⬅️ important
    const { data } = await apiAuth.post(`/products`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return data?.data ?? data ?? null;
  },

  async update(id, body) {
    if (!id) throw new Error("missing product id");
    const base = isFD(body) ? fdToJson(body) : body;
    const payload = withImagesFromUrl(base); // ⬅️ important
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
