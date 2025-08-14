// server/routes/users.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import db from "../database/connection.js";

import {
  listUsers,
  getUserById,
  createUser,
  // updateUser, // on gère l'update ici pour inclure le profil
  deleteUser,
  getUserByEmail,
} from "../models/userModel.js";

const router = Router();

/* --------- Helpers d'autorisations --------- */
function requireAdmin(req, res) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Forbidden: admin only" });
    return false;
  }
  return true;
}
function requireSelfOrAdmin(req, res, targetUserId) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  if (req.user.role === "admin") return true;
  if (Number(req.user.id) === Number(targetUserId)) return true;
  res.status(403).json({ message: "Forbidden: not your account" });
  return false;
}
const isInt = (v) => /^\d+$/.test(String(v));

/* --------- Register (public) --------- */
router.post("/", async (req, res) => {
  try {
    const { username, first_name, last_name, email, password, role } = req.body || {};
    if (!username || !first_name || !last_name || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, first_name, last_name, email, password are required" });
    }
    const user = await createUser({
      username: String(username).trim(),
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      email: String(email).trim().toLowerCase(),
      password, // le hash est géré dans le model
      role: role === "admin" ? "client" : "client", // force 'client' côté public
    });
    res.status(201).json({ message: "User created", data: user });
  } catch (err) {
    if (err.message === "username_or_email_already_exists") {
      return res.status(409).json({ message: "Username or email already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
});

/* --------- Admin: liste des users --------- */
router.get("/", auth, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { search = "", limit = 50, offset = 0 } = req.query;
    const users = await listUsers({ search, limit, offset });
    res.json({ status: 200, message: "Users found", data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while getting the users" });
  }
});

/* --------- (Admin) get by email — placer AVANT /:id --------- */
router.get("/by-email/:email", auth, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const user = await getUserByEmail(String(req.params.email).toLowerCase());
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ status: 200, message: "User found", data: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching user by email" });
  }
});

/* --------- Get by id (self or admin) --------- */
router.get("/:id", auth, async (req, res) => {
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });
  if (!requireSelfOrAdmin(req, res, id)) return;

  try {
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const [[profile]] = await db.query(
      "SELECT full_name, phone, street, city, zipcode, country, pref_size, pref_favorite_brand, updated_at FROM user_profiles WHERE user_id=?",
      [id]
    );

    res.json({ status: 200, message: `User ${id} found`, data: { user, profile: profile || null } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while getting the user" });
  }
});

/* --------- Update (self or admin) --------- */
router.put("/:id", auth, async (req, res) => {
  console.log("HIT PUT /api/users/:id", req.params.id, JSON.stringify(req.body));
  const id = req.params.id;
  if (!/^\d+$/.test(String(id))) return res.status(400).json({ message: "Invalid id" });
  if (!requireSelfOrAdmin(req, res, id)) return;

  try {
    const userRow = await getUserById(id);
    if (!userRow) return res.status(404).json({ message: "user_not_found" });

    const {
      username, first_name, last_name, email, role,       // -> table users
      name, phone, address = {}, preferences = {}         // -> table user_profiles
    } = req.body || {};

    // --- build dynamique pour USERS
    const userFields = [];
    const userValues = [];
    if (username !== undefined) { userFields.push("username=?"); userValues.push(String(username).trim()); }
    if (first_name !== undefined) { userFields.push("first_name=?"); userValues.push(String(first_name).trim()); }
    if (last_name !== undefined) { userFields.push("last_name=?"); userValues.push(String(last_name).trim()); }
    if (email !== undefined) { userFields.push("email=?"); userValues.push(String(email).trim().toLowerCase()); }
    if (role !== undefined && req.user.role === "admin") { userFields.push("role=?"); userValues.push(String(role)); }

    // si "name" fourni sans first/last → split
    if (name && first_name === undefined && last_name === undefined) {
      const parts = String(name).trim().split(/\s+/);
      const fn = parts.shift() || "";
      const ln = parts.join(" ");
      if (fn) { userFields.push("first_name=?"); userValues.push(fn); }
      if (ln) { userFields.push("last_name=?"); userValues.push(ln); }
    }

    // --- payload profil
    const full_name = name ?? null;
    const street = address?.street ?? null;
    const city = address?.city ?? null;
    const zipcode = address?.zipcode ?? null;
    const country = address?.country ?? null;
    const pref_size = preferences?.size ?? null;
    const pref_favorite_brand = preferences?.favoriteBrand ?? null;

    const hasProfilePayload =
      full_name !== null || phone !== undefined ||
      street !== null || city !== null || zipcode !== null || country !== null ||
      pref_size !== null || pref_favorite_brand !== null;

    if (!userFields.length && !hasProfilePayload) {
      return res.status(400).json({ message: "no_fields_to_update" });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      if (userFields.length) {
        userValues.push(id);
        await conn.query(`UPDATE users SET ${userFields.join(", ")} WHERE id=?`, userValues);
      }

      if (hasProfilePayload) {
        await conn.query(
          `INSERT INTO user_profiles
            (user_id, full_name, phone, street, city, zipcode, country, pref_size, pref_favorite_brand)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            full_name=VALUES(full_name),
            phone=VALUES(phone),
            street=VALUES(street),
            city=VALUES(city),
            zipcode=VALUES(zipcode),
            country=VALUES(country),
            pref_size=VALUES(pref_size),
            pref_favorite_brand=VALUES(pref_favorite_brand)`,
          [id, full_name, phone ?? null, street, city, zipcode, country, pref_size, pref_favorite_brand]
        );
      }

      await conn.commit();
      conn.release();
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }

    const [[freshUser]] = await db.query(
      "SELECT id, username, first_name, last_name, email, role, created_at FROM users WHERE id=?",
      [id]
    );
    const [[profile]] = await db.query(
      "SELECT full_name, phone, street, city, zipcode, country, pref_size, pref_favorite_brand, updated_at FROM user_profiles WHERE user_id=?",
      [id]
    );

    return res.json({
      status: 200,
      message: `User ${id} updated`,
      data: { user: freshUser, profile: profile || null },
    });
  } catch (error) {
    if (error?.message === "username_or_email_already_exists") {
      return res.status(409).json({ message: "Username or email already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "An error occurred while updating the user" });
  }
});

/* --------- Delete (admin) --------- */
router.delete("/:id", auth, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    const result = await deleteUser(id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ status: 200, message: `User ${id} deleted`, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while deleting the user" });
  }
});

export default router;
