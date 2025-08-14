// src/App.jsx
import React from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import Router from "./router.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
