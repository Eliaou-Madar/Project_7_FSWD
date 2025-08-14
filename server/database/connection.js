// server/connection.js
import dotenv from "dotenv";
dotenv.config();

import { createPool } from "mysql2/promise";

// Petites vérifs d'env (facultatif mais utile)
const req = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
};

const pool = createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: req("DB_USER"),
  password: req("DB_PASSWORD"),
  database: process.env.DB_DATABASE, // peut être undefined si tu fais un CREATE/USE dans le script
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",                  // stocke en UTC
  multipleStatements: false,      // safety
  supportBigNumbers: true,
  bigNumberStrings: true,
  namedPlaceholders: true,
  // SSL optionnel: mets DB_SSL=true si besoin (ex: PlanetScale/Cloud)
  ...(process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: false } } : {})
});

export default pool;
