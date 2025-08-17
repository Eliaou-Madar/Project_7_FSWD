// src/services/promos.service.js
import { BASE_URL } from "../data/api";
import { authenticatedRequest } from "../utils/general/tokenUtil";

// join helper
function join(root, path) {
  const r = (root || "").replace(/\/+$/g, "");
  const p = `/${String(path || "").replace(/^\/+/g, "")}`;
  return `${r}${p}`;
}

// IMPORTANT: ne mets PAS '/api' dans BASE_URL (ce service l'ajoute déjà)
const API_ROOT = join(BASE_URL, "/api");
const PROMOS_URL = join(API_ROOT, "/promotions");

// ---- Mappers ----
// Serveur -> UI (ton composant attend: {id, code, type, value, active})
const toUi = (p) => {
  const now = Date.now();
  const start = p.start_date ? new Date(p.start_date).getTime() : null;
  const end = p.end_date ? new Date(p.end_date).getTime() : null;

  return {
    id: p.id,
    code: p.code ?? p.title ?? "", // accepte alias
    type: p.discount_type ?? "percent",
    value: Number(p.discount_value ?? p.discount_percent ?? 0),
    active:
      start != null && end != null
        ? start <= now && now <= end
        : (p.is_active ?? false),
    description: p.description ?? "",
    start_date: p.start_date ?? null,
    end_date: p.end_date ?? null,
  };
};

// UI -> Serveur
// On encode 'active' en plage de dates (actif: maintenant → +1 an, inactif: fini hier)
const toDb = (f) => {
  const now = new Date();
  const inOneYear = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);

  const start_date =
    f.start_date ??
    (f.active ? now.toISOString() : now.toISOString());
  const end_date =
    f.end_date ??
    (f.active ? inOneYear.toISOString() : yesterday.toISOString());

  // Le backend attend { title, description?, discount_percent, start_date, end_date }
  return {
    title: String(f.code || "").toUpperCase(),
    description: f.description ?? "",
    discount_percent:
      f.type && f.type !== "percent"
        ? Number(f.value) // fallback, mais le back ne gère que percent
        : Number(f.value),
    start_date,
    end_date,
  };
};

export const promosService = {
  // LISTE (admin) → GET /api/promotions
  async list() {
    const res = await authenticatedRequest(PROMOS_URL, "get");
    // tes routes renvoient { status, message, data }
    const rows = Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    return rows.map(toUi);
  },

  // DETAIL (admin)
  async getById(id) {
    const res = await authenticatedRequest(join(PROMOS_URL, `/${id}`), "get");
    const row = res?.data?.data ?? res?.data ?? res;
    return row ? toUi(row) : null;
  },

  // CREATE (admin) → POST /api/promotions
  async create(form) {
    return authenticatedRequest(PROMOS_URL, "post", toDb(form));
  },

  // UPDATE (admin) → PUT /api/promotions/:id
  async update(id, form) {
    return authenticatedRequest(join(PROMOS_URL, `/${id}`), "put", toDb(form));
  },

  // DELETE (admin) → DELETE /api/promotions/:id
  async remove(id) {
    return authenticatedRequest(join(PROMOS_URL, `/${id}`), "delete");
  },
};
