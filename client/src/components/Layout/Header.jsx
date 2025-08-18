import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import "./Header.css"; // <-- IMPORTANT
// en haut du fichier
import logoUrl from "../../assets/Logo_SneakRush.png";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isAuthed = !!user;
  const base = isAuthed ? `/users/${user?.id}` : "";

  const toHome     = isAuthed ? `${base}/home`    : "/login";
  const toProducts = isAuthed ? `${base}/products`: "/login";
  const toCart     = isAuthed ? `${base}/cart`    : "/login";
  const toAccount  = isAuthed ? `${base}/account` : "/login";
  const toAdmin    = isAuthed && user?.role === "admin" ? `${base}/admin` : "/login";

  const isActiveSub = (sub) =>
    isAuthed
      ? location.pathname.startsWith(`${base}/${sub}`)
      : location.pathname.startsWith(`/${sub}`);

  const handleLogout = async () => {
    try { await logout(); } finally {
      navigate("/login", { replace: true });
      setOpen(false);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">
  <Link to={toHome} onClick={() => setOpen(false)} className="logo-link">
    <img src={logoUrl} alt="SneakRush logo" className="logo-img" />
    <span className="logo-text">SneakRush</span>
  </Link>
</h1>

        <button
          className={`burger ${open ? "is-open" : ""}`}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <span/><span/><span/>
        </button>

        <nav className={`nav ${open ? "nav--open" : ""}`}>
          <Link to={toHome} className={isActiveSub("home") ? "active" : ""} onClick={() => setOpen(false)}>Home</Link>
          <Link to={toProducts} className={isActiveSub("products") ? "active" : ""} onClick={() => setOpen(false)}>Products</Link>
          <Link to={toCart} className={isActiveSub("cart") ? "active" : ""} onClick={() => setOpen(false)}>Cart</Link>

          {isAuthed ? (
            <>
              <Link to={toAccount} className={isActiveSub("account") ? "active" : ""} onClick={() => setOpen(false)}>Account</Link>
              {user?.role === "admin" && (
                <Link to={toAdmin} className={isActiveSub("admin") ? "active" : ""} onClick={() => setOpen(false)}>Admin</Link>
              )}
              <button className="logout" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={location.pathname.startsWith("/login") ? "active" : ""} onClick={() => setOpen(false)}>Login</Link>
              <Link to="/register" className={location.pathname.startsWith("/register") ? "active" : ""} onClick={() => setOpen(false)}>Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
