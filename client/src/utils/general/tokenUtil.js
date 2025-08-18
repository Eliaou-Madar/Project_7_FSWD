// src/utils/general/tokenUtil.js
import { BASE_URL } from "../../data/api";

export function getToken() {
  try {
    const saved = JSON.parse(localStorage.getItem("user") || "null");
    return saved?.token || localStorage.getItem("token") || null;
  } catch {
    return localStorage.getItem("token") || null;
  }
}

/**
 * authenticatedRequest(urlOrPath, method, body, options)
 * - urlOrPath peut être absolu ou commencer par /api
 * - Injecte automatiquement Authorization: Bearer <token>
 */
export async function authenticatedRequest(urlOrPath, method = "get", body, options = {}) {
  const token = getToken();
  const isAbsolute = /^https?:\/\//i.test(urlOrPath);
  const url = isAbsolute
    ? urlOrPath
    : urlOrPath.startsWith("/api")
    ? `${BASE_URL}${urlOrPath}`
    : `${BASE_URL}/api${urlOrPath.startsWith("/") ? "" : "/"}${urlOrPath}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    method: method.toUpperCase(),
    headers,
    body: ["GET", "HEAD"].includes(method.toUpperCase()) ? undefined : JSON.stringify(body ?? {}),
  });

  let data = null;
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { data = await res.json(); } catch {}
  } else {
    // pour aider au debug
    const text = await res.text().catch(() => "");
    throw new Error(`Unexpected content-type (${ct}) from ${url}: ${text.slice(0, 200)}...`);
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `http_${res.status}`;
    throw new Error(msg);
  }
  return data;
}
