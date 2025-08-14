// server/utils/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const auth = (req, res, next) => {
  // Récupère soit via Authorization: Bearer, soit via x-auth-token
  let token = null;

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    token = req.header("x-auth-token");
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // Doit contenir au moins { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

export default auth;
