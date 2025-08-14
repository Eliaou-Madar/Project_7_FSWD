// src/services/authService.js
import { VITE_API_BASE_URL } from "../utils/constants";

function getToken() {
  try { return (JSON.parse(localStorage.getItem("user") || "null")?.token) || null; }
  catch { return null; }
}

async function handle(res) {
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.message || `http_${res.status}`);
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${VITE_API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle(res);
}

export async function register(username, first_name, last_name, email, password) {
  const res = await fetch(`${VITE_API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, first_name, last_name, email, password }),
  });
  return handle(res);
}

// UPDATE profil (protégé)
export async function update(userId, data) {
  const token = getToken();
  const res = await fetch(`${VITE_API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  const json = await handle(res);
  // ⬇️ renvoie directement { user, profile }
  return json?.data || null;
}