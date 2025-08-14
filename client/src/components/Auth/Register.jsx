// src/components/Auth/Register.jsx
import React, { useState } from "react";

export default function Register({ onRegister, error }) {
  const [username, setUsername] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState(""); // requis par l'API
  const [password, setPassword] = useState("");
  const [verify, setVerify] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({ username, first_name, last_name, email, password, verify });
  };

  return (
    <div className="register-form">
      <h2>Create your SneakRush account</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          required
        />
        <input
          value={first_name}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          autoComplete="given-name"
          required
        />
        <input
          value={last_name}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          autoComplete="family-name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
          required
          minLength={6}
        />
        <input
          type="password"
          value={verify}
          onChange={(e) => setVerify(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          required
          minLength={6}
        />
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
}
