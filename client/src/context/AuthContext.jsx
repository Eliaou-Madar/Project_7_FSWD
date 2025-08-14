/* src/context/AuthContext.jsx */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  login as loginService,
  register as registerService,
  update as updateService,
} from "../services/authService";
import { getItem, setItem, removeItem } from "../utils/storage";

export const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restaure l'utilisateur depuis le storage au premier rendu
  useEffect(() => {
    const saved = getItem("user");
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  // Synchronise entre onglets (si l'utilisateur se déconnecte ailleurs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user") {
        const saved = getItem("user");
        setUser(saved || null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // login(email, password)
async function login(email, password) {
  setAuthError(null);
  try {
    const r = await loginService(email, password);
    setUser({ ...r.user, token: r.token });
    setItem("user", { ...r.user, token: r.token });
    return r.user;
  } catch (e) {
    setAuthError(e.message);
    return null;
  }
}

async function register(username, first_name, last_name, email, password) {
  setAuthError(null);
  try {
    const r = await registerService(username, first_name, last_name, email, password);
    setUser({ ...r.user, token: r.token });
    setItem("user", { ...r.user, token: r.token });
    return r.user;
  } catch (e) {
    setAuthError(e.message);
    return null;
  }
}

async function update(userId, data) {
  setAuthError(null);
  try {
    const out = await updateService(userId, data); 
    // out = { user, profile } d'après le service
    const updatedUser = out?.user;
    if (updatedUser) {
      const prev = getItem("user") || {};
      const merged = { ...prev, ...updatedUser }; // conserve token, etc.
      setUser(merged);
      setItem("user", merged);
    }
    return out; // { user, profile }
  } catch (e) {
    setAuthError(e.message || "update_failed");
    throw e;
  }
}


  function logout() {
    setUser(null);
    removeItem("user");
  }

  const value = useMemo(
    () => ({
      user,
      isAuthed: !!user,
      loading,
      authError,
      login,
      register,
      update,
      logout,
      setUser, // utile si on veut hydrater depuis un autre endroit
    }),
    [user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Petit hook pratique
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
