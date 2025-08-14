// server/routes/auth.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import auth from "../utils/authMiddleware.js";
import { createUser, getUserByEmail } from "../models/userModel.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || "1h";

/**
 * @desc Register (création de compte)
 * @route POST /auth/register
 * body: { username, first_name, last_name, email, password }
 */
router.post("/register", async (req, res) => {
  try {
    let { username, first_name, last_name, email, password } = req.body || {};
    if (!username || !first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: "username, first_name, last_name, email, password are required" });
    }

    email = String(email).trim().toLowerCase();
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const { id } = await createUser({
      username: String(username).trim(),
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      email,
      password,           // hash fait dans le model
      role: "client",     // on force le rôle à 'client' côté public
    });

    // Génère un token de session directement après inscription
    const token = jwt.sign({ id, role: "client" }, JWT_SECRET, { expiresIn: TOKEN_TTL });

    return res.status(201).json({
      message: "User created",
      token,
      user: { id, username, first_name, last_name, email, role: "client" },
    });
  } catch (err) {
    if (err.message === "username_or_email_already_exists") {
      return res.status(409).json({ message: "Username or email already exists" });
    }
    console.error(err);
    return res.status(500).json({ message: "Error creating user" });
  }
});

/**
 * @desc Login
 * @route POST /auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  console.log("LOGIN BODY:", req.body); // <= ajoute ça
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Both email and password are required" });
    }
    email = String(email).trim().toLowerCase();

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error logging in" });
  }
});

/**
 * @desc Profil de l'utilisateur connecté
 * @route GET /auth/me
 * @access Private
 */
router.get("/me", auth, async (req, res) => {
  try {
    // On réutilise getUserByEmail si tu préfères (mais ici on a juste le token)
    // Petite requête rapide pour rafraîchir les infos si besoin :
    // -> si tu veux éviter une requête, renvoie directement req.user (si tu mets plus d'infos dans le JWT)
    const userId = req.user.id;

    // Retour simple du payload (id/role), tu peux enrichir en requêtant la DB
    return res.json({ status: 200, message: "Me", data: { id: userId, role: req.user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching profile" });
  }
});

export default router;
