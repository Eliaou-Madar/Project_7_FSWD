// server/models/userModel.js
import bcrypt from "bcryptjs";
import db from "../database/connection.js";

/** Helpers */
const DUP = "ER_DUP_ENTRY";

export async function listUsers({ limit = 50, offset = 0, search = "" } = {}) {
  const like = `%${search}%`;
  const [rows] = await db.query(
    `SELECT id, username, first_name, last_name, email, role, created_at
     FROM users
     WHERE (? = '' OR username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [search, like, like, like, like, Number(limit), Number(offset)]
  );
  return rows;
}

export async function getUserById(id) {
  const [rows] = await db.query(
    `SELECT id, username, first_name, last_name, email, role, created_at
     FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function getUserByEmail(email) {
  const [rows] = await db.query(
    `SELECT id, username, first_name, last_name, email, role, created_at, password_hash
     FROM users WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

/**
 * createUser
 * @param {object} u - { username, first_name, last_name, email, password | password_hash, role='client' }
 * Si `password` est fourni, on le hash. Sinon on suppose que `password_hash` est donné.
 */
export async function createUser(u) {
  const {
    username,
    first_name,
    last_name,
    email,
    role = "client",
    password,
    password_hash: givenHash,
  } = u;

  const password_hash =
    givenHash || (password ? await bcrypt.hash(password, 10) : null);

  if (!password_hash) {
    throw new Error("password or password_hash is required");
  }

  try {
    const [res] = await db.query(
      `INSERT INTO users (username, first_name, last_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, first_name, last_name, email, password_hash, role]
    );
    return { id: res.insertId };
  } catch (err) {
    if (err.code === DUP) {
      throw new Error("username_or_email_already_exists");
    }
    throw err;
  }
}

/**
 * updateUser (partiel)
 * fields autorisés: username, first_name, last_name, email, role, password
 */
export async function updateUser(id, fields = {}) {
  const allowed = ["username", "first_name", "last_name", "email", "role", "password"];
  const data = {};

  for (const k of allowed) {
    if (fields[k] !== undefined && fields[k] !== null && fields[k] !== "") {
      data[k] = fields[k];
    }
  }

  // Hash si password fourni
  if (data.password) {
    data.password_hash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  const keys = Object.keys(data);
  if (keys.length === 0) return { affectedRows: 0 };

  const setSql = keys.map((k) => `${k === "password_hash" ? "password_hash" : k} = ?`).join(", ");
  const params = keys.map((k) => data[k]);
  params.push(id);

  try {
    const [res] = await db.query(
      `UPDATE users SET ${setSql} WHERE id = ?`,
      params
    );
    return { affectedRows: res.affectedRows };
  } catch (err) {
    if (err.code === DUP) {
      throw new Error("username_or_email_already_exists");
    }
    throw err;
  }
}

export async function deleteUser(id) {
  const [res] = await db.query(`DELETE FROM users WHERE id = ?`, [id]);
  return { affectedRows: res.affectedRows };
}
