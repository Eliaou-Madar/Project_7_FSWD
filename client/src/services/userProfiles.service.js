import { apiAuth } from "../utils/http";

/* --- helpers --- */
function ensureJsonFromAxios(res) {
  const ct = (res.headers?.["content-type"] || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const p = typeof res.data === "string" ? res.data.slice(0, 120) : JSON.stringify(res.data).slice(0, 120);
    throw new Error(`Unexpected content-type from ${res.config?.url}: ${p}...`);
  }
}

/** Normalise la réponse { user, profile } */
function toUi(payload) {
  const user = payload?.user ?? payload?.data?.user ?? payload?.data ?? payload ?? null;
  const profile = payload?.profile ?? payload?.data?.profile ?? null;
  if (!user) return { user: null, profile: null };
  return { user, profile };
}

export const userProfilesService = {
  /** Récupère user+profile par userId (self/admin) */
  async getByUserId(userId) {
    if (!userId) throw new Error("missing userId");
    const res = await apiAuth.get(`/users/${encodeURIComponent(userId)}`, {
      params: { _: Date.now() },
      validateStatus: (s) => s >= 200 && s < 300,
    });
    ensureJsonFromAxios(res);
    const data = res.data?.data ?? res.data;
    return toUi(data);
  },

  /** Récupère le profil du user courant (si /users/me existe) */
  async getMe() {
    const res = await apiAuth.get(`/users/me`, {
      params: { _: Date.now() },
      validateStatus: (s) => s >= 200 && s < 300,
    });
    ensureJsonFromAxios(res);
    const data = res.data?.data ?? res.data;
    return toUi(data);
  },

  /** Met à jour user + profile pour userId (self/admin)
   * body attendu:
   * {
   *   username, first_name, last_name, email, role?,            // table users
   *   name, phone,                                             // profils
   *   address: { street, city, zipcode, country },
   *   preferences: { size, favoriteBrand }
   * }
   */
  async updateByUserId(userId, body) {
    if (!userId) throw new Error("missing userId");
    const payload = body || {};
    const res = await apiAuth.put(`/users/${encodeURIComponent(userId)}`, payload, {
      headers: { "Content-Type": "application/json" },
      validateStatus: (s) => s >= 200 && s < 300,
    });
    ensureJsonFromAxios(res);
    const data = res.data?.data ?? res.data;
    return toUi(data);
  },
};
