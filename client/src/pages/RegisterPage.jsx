// src/pages/RegisterPage.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import Register from "../components/Auth/Register.jsx";
import UserInfoForm from "../components/Auth/UserInfoForm.jsx";
import "./RegisterPage.css";

export default function RegisterPage() {
  const { register, update } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formStep, setFormStep] = useState(1);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null); // {id, username, email, ...}

  const handleRegister = async ({ username, first_name, last_name, email, password, verify }) => {
    if (password !== verify) {
      setError("Passwords do not match");
      return;
    }
    try {
      // Attendu côté serveur: { username, first_name, last_name, email, password }
      const res = await register(username, first_name, last_name, email, password);
      const user = res?.user || res; // tolérant
      if (!user?.id) throw new Error("Registration failed");
      setCurrentUser(user);
      setFormStep(2);
      setError("");
    } catch (e) {
      const msg = e?.message || "Registration failed";
      setError(msg);
    }
  };

  const handleUserInfoSubmit = async (formData) => {
  if (!currentUser) return;
  try {
    const out = await update(currentUser.id, formData); // out = { user, profile }
    const user = out?.user;
    if (user?.id) {
      navigate(`/users/${user.id}/home`, { replace: true });
    } else {
      throw new Error("update_failed");
    }
  } catch (e) {
    alert(e?.message || "Update failure.");
  }
};

  const handleCancel = () => {
    setFormStep(1);
    setCurrentUser(null);
    setError("");
  };

  return (
    <div className="auth-page">
      {formStep === 1 && <Register onRegister={handleRegister} error={error} />}
      {formStep === 2 && (
        <UserInfoForm onSubmit={handleUserInfoSubmit} onCancel={handleCancel} />
      )}
    </div>
  );
}
