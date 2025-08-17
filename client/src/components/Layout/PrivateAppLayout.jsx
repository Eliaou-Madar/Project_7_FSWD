import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import "./Header.css";                  // <-- ton CSS

export default function PrivateAppLayout() {
  return (
    <>
      <Header />
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </>
  );
}
