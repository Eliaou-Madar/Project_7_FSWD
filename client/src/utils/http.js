// src/utils/http.js
import axios from "axios";
import { BASE_URL } from "../data/api";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: false, // on n'utilise pas de cookies
  headers: { "Cache-Control": "no-cache" },
});

// client avec injection automatique du token
export const apiAuth = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: false,
  headers: { "Cache-Control": "no-cache" },
});

apiAuth.interceptors.request.use((config) => {
  try {
    const saved = JSON.parse(localStorage.getItem("user") || "null");
    const token = saved?.token || localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});
