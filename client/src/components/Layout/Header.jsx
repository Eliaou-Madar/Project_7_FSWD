import React, { useContext } from "react";
import "./Header.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthed = !!user;
  const base = isAuthed ? `/users/${user.id}` : ""; // préfixe dynamique

  // Helpers de liens (redirige vers /login si non connecté)
  const toHome = isAuthed ? `${base}/home` : "/login";
  const toProducts = isAuthed ? `${base}/products` : "/login";
  const toCart = isAuthed ? `${base}/cart` : "/login";
  const toAccount = isAuthed ? `${base}/account` : "/login";
  const toAdmin = isAuthed && user.role === "admin" ? `${base}/admin` : "/login";

  // Active selon le préfixe dynamique
  const isActiveSub = (subpath) =>
    isAuthed
      ? location.pathname.startsWith(`${base}/${subpath}`)
      : location.pathname.startsWith(`/${subpath}`);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <h1>
        {/* Marque → Home protégé si connecté, sinon /login */}
        <Link to={toHome} className="brand">SneakRush</Link>
      </h1>

      <nav className="header-nav">
        <Link to={toHome} className={isActiveSub("home") ? "active" : ""}>
          Home
        </Link>

        <Link to={toProducts} className={isActiveSub("products") ? "active" : ""}>
          Products
        </Link>

        <Link to={toCart} className={isActiveSub("cart") ? "active" : ""}>
          Cart
        </Link>

        {isAuthed ? (
          <>
            <Link to={toAccount} className={isActiveSub("account") ? "active" : ""}>
              Account
            </Link>

            {user.role === "admin" && (
              <Link to={toAdmin} className={isActiveSub("admin") ? "active" : ""}>
                Admin
              </Link>
            )}

            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={location.pathname.startsWith("/login") ? "active" : ""}>
              Login
            </Link>
            <Link to="/register" className={location.pathname.startsWith("/register") ? "active" : ""}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
