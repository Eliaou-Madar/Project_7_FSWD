// src/pages/LoginPage.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import Login from "../components/Auth/Login.jsx";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (email, password) => {
    setError("");
    try {
      // AuthContext.login(email, password) -> peut renvoyer { user, token } OU user
      const res = await login(email, password);
      const user = res?.user || res; // tolérant aux 2 formats
      if (user?.id) {
        navigate(`/users/${user.id}/home`, { replace: true });
      } else {
        setError("Email or password invalid");
      }
    } catch {
      setError("Email or password invalid");
    }
  };

  return <Login onLogin={handleLogin} error={error} />;
}
