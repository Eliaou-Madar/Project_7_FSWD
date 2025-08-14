// src/services/user.js
/**
 * @desc Routes liées à l'utilisateur
 */
import axios from "axios";
import { authenticatedRequest } from "../utils/general/tokenUtil";
import { BASE_URL } from "../data/api";

const URL = `${BASE_URL}/users`;

/**
 * @desc Met à jour l'utilisateur (ex: email)
 * @param {{ email?: string, [key:string]: any }} payload
 * @access private
 */
export async function updateUser(payload) {
  // ex: PUT /users (ou /users/me selon ton API)
  return authenticatedRequest(`${URL}`, "put", payload);
}

/**
 * @desc Récupère un utilisateur par username
 * @param {string} username
 */
export async function getUserByUsername(username) {
  try {
    return await axios.get(`${URL}/username/${encodeURIComponent(username)}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * @desc Récupère un utilisateur par id
 * @param {number|string} id
 */
export async function getUserById(id) {
  try {
    return await axios.get(`${URL}/${id}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
