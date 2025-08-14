// server/routes/users.js
import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
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
      return res.status(400).json({ message: "username, first_name, last_name, email, password are required" });
    }
    const user = await createUser({
      username, first_name, last_name, email, password,
      role: role === "admin" ? "client" : "client", // on force client côté endpoint public
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
    const user = await getUserByEmail(req.params.email);
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
    res.json({ status: 200, message: `User ${id} found`, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while getting the user" });
  }
});

/* --------- Update (self or admin) --------- */
router.put("/:id", auth, async (req, res) => {
  const id = req.params.id;
  if (!isInt(id)) return res.status(400).json({ message: "Invalid id" });
  if (!requireSelfOrAdmin(req, res, id)) return;

  const payload = req.body || {};
  if (req.user.role !== "admin") delete payload.role; // pas de changement de rôle par un non-admin
  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "User data is required" });
  }

  try {
    const result = await updateUser(id, payload);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or no changes" });
    }
    res.json({ status: 200, message: `User ${id} updated`, data: result });
  } catch (error) {
    if (error.message === "username_or_email_already_exists") {
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
