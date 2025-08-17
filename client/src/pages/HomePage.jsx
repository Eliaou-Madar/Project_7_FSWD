import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Layout/Header.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

export default function HomePage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="app-layout">
      
      <div className="content-area">
        <main>
          <h1>
            {user
              ? `Hello, ${user.first_name || ""} ${user.last_name || ""}!`
              : "Welcome to SneakRush"}
          </h1>
          
        </main>
      </div>
    </div>
  );
}
