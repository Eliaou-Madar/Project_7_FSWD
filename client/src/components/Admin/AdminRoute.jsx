// src/components/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


export default function AdminRoute({ children }) {
  const { user, isAuthed, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
