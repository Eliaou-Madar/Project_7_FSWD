// src/components/Auth/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { isAuthed, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  return isAuthed ? children : <Navigate to="/login" replace />;
}
