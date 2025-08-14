// server/utils/adminMiddleware.js
const admin = (req, res, next) => {
  // Vérifie si l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: no user data" });
  }

  // Vérifie si le rôle est bien "admin"
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }

  // Autorisé
  next();
};

export default admin;
