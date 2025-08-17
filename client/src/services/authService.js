import { BASE_URL } from "../data/api";
import { getItem, setItem } from "../utils/storage";

async function handle(res) {
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.message || `http_${res.status}`);
  return data;
}

export function getStoredToken() {
  try {
    const user = getItem("user");
    return user?.token || getItem("token") || null;
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handle(res);
  // Attendu: l’API renvoie au moins { token, user } (adapte si différent)
  if (data?.token) setItem("token", data.token);
  if (data?.user) setItem("user", data.user);
  return data;
}

export async function register(username, first_name, last_name, email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, first_name, last_name, email, password }),
  });
  const data = await handle(res);
  // Si ton /register fait aussi un login et renvoie un token, on le stocke
  if (data?.token) setItem("token", data.token);
  if (data?.user) setItem("user", data.user);
  return data;
}

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
  return data?.data || null;
}
