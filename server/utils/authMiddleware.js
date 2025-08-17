import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const auth = (req, res, next) => {
  // 1) Cookie
  let token = req.cookies?.token || null;

  // 2) Authorization: Bearer ...
  if (!token) {
    const h = req.headers.authorization || "";
    if (h.startsWith("Bearer ")) token = h.slice(7);
  }

  // 3) x-auth-token (legacy)
  if (!token) token = req.header("x-auth-token");

  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // { id, role, ... }
    return next();
  } catch (e) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

export default auth;
