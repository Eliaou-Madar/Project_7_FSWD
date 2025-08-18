import db from "../database/connection.js";

export async function getProfile(userId) {
  const [[row]] = await db.query(
    "SELECT user_id, full_name, phone, street, city, zipcode, country, pref_size, pref_favorite_brand, updated_at FROM user_profiles WHERE user_id=?",
    [userId]
  );
  return row || null;
}

export async function upsertProfile(userId, p) {
  const { full_name, phone, street, city, zipcode, country, pref_size, pref_favorite_brand } = p || {};
  const [res] = await db.query(
    `INSERT INTO user_profiles (user_id, full_name, phone, street, city, zipcode, country, pref_size, pref_favorite_brand)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       full_name=VALUES(full_name), phone=VALUES(phone),
       street=VALUES(street), city=VALUES(city), zipcode=VALUES(zipcode), country=VALUES(country),
       pref_size=VALUES(pref_size), pref_favorite_brand=VALUES(pref_favorite_brand)`,
    [userId, full_name ?? null, phone ?? null, street ?? null, city ?? null, zipcode ?? null, country ?? null, pref_size ?? null, pref_favorite_brand ?? null]
  );
  return res;
}
