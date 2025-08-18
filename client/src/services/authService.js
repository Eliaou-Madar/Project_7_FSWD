// src/services/authService.js
import { BASE_URL } from "../data/api";
import { getItem } from "../utils/storage";

/** Parse la réponse JSON et lève des erreurs propres */
async function handle(res) {
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = data?.message || data?.error || `http_${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/** Unifie les payloads {token,user} ou {data:{token,user}} */
function pickAuthPayload(res) {
  const data = res?.data ?? res;
  const token = data?.token ?? null;
  const user  = data?.user ?? null;
  return { token, user };
}

/** Récupère un token stocké (utile pour les appels directs depuis un service) */
export function getStoredToken() {
  try {
    const user = getItem("user");          // attendu: { ..., token }
    if (user?.token) return user.token;
    const alt = getItem("token");          // fallback si app historique
    return alt || null;
  } catch {
    return null;
  }
}

/** Auth: login → renvoie { token, user } (ne touche pas au storage) */
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handle(res);
  const { token, user } = pickAuthPayload(data);
  if (!token || !user) throw new Error("invalid_auth_response");
  return { token, user };
}

/** Auth: register → renvoie { token, user } (si l’API les renvoie) */
export async function register(username, first_name, last_name, email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, first_name, last_name, email, password }),
  });
  const data = await handle(res);
  const { token, user } = pickAuthPayload(data);
  // certaines API ne renvoient pas le token à /register → c’est OK
  return { token: token ?? null, user: user ?? null };
}

/** Users: update profil (protégé) → renvoie payload API (souvent { user, profile }) */
export async function update(userId, payload) {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await handle(res);
  return data?.data ?? data ?? null;
}

/** (Optionnel) Récupérer le “me” courant si ton backend l’expose */
export async function me() {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await handle(res);
  return data?.data ?? data ?? null;
}
