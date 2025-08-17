import axios from "axios";
import { BASE_URL } from "../../data/api";
import { getItem } from "../storage";

// Récupère un token depuis le storage (token à part OU dans user.token)
export function getToken() {
  const direct = getItem("token");
  if (direct) return String(direct).replace(/^Bearer\s+/i, "");
  const user = getItem("user");
  if (user?.token) return String(user.token).replace(/^Bearer\s+/i, "");
  return null;
}

/**
 * Requête authentifiée générique (axios)
 * @param {string} url - chemin absolu ou relatif à BASE_URL
 * @param {"get"|"post"|"put"|"patch"|"delete"} method
 * @param {object} [data]
 * @param {object} [config] - axios config additionnel
 */
export async function authenticatedRequest(url, method = "get", data, config = {}) {
  const token = getToken();
  const isAbsolute = /^https?:\/\//i.test(url);
  const fullUrl = isAbsolute ? url : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  const headers = {
    "Content-Type": "application/json",
    ...(config.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return axios({
    url: fullUrl,
    method,
    data,
    headers,
    withCredentials: false, // inutile en mode Bearer
    ...config,
  });
}
