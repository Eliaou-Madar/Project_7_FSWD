// src/utils/general/tokenUtil.js
import axios from "axios";
import { BASE_URL } from "../../data/api";
import { getItem } from "../storage";

// Récupère un token depuis localStorage
function getToken() {
  // soit stocké à part, soit dans l'objet user
  const direct = getItem("token");
  if (direct) return direct;
  const user = getItem("user");
  return user?.token || null;
}

/**
 * Requête authentifiée générique
 * @param {string} url - chemin complet OU relatif à BASE_URL
 * @param {"get"|"post"|"put"|"patch"|"delete"} method
 * @param {object} [data]
 * @param {object} [config] - axios config additionnel
 */
export async function authenticatedRequest(url, method = "get", data, config = {}) {
  const token = getToken();
  const isAbsolute = /^https?:\/\//i.test(url);
  const fullUrl = isAbsolute ? url : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  const headers = {
    ...(config.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return axios({
    url: fullUrl,
    method,
    data,
    headers,
    ...config,
  });
}
