import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import ProfileForm from "../components/Account/ProfileForm.jsx";

export default function AccountPage() {
  const { user, update } = useContext(AuthContext);
  const [status, setStatus] = useState({ type: "", msg: "" });

  if (!user) return null; // route protégée normalement

  const handleSubmit = async (formData) => {
    try {
      const updated = await update(user.id, formData);
      if (updated?.id) {
        setStatus({ type: "success", msg: "Profile updated ✅" });
      } else {
        throw new Error();
      }
    } catch {
      setStatus({ type: "error", msg: "Update failed ❌" });
    }
  };

  return (
    <div className="account-page" style={{ padding: 16 }}>
      <h1>My Account</h1>
      <p style={{ opacity: 0.8 }}>
        Signed in as <strong>{user.email}</strong>
      </p>

      {status.msg && (
        <div
          style={{
            margin: "12px 0",
            padding: "10px 12px",
            borderRadius: 8,
            background: status.type === "success" ? "#e8f7ee" : "#fee",
            color: status.type === "success" ? "#0a7a3b" : "#a20000",
          }}
        >
          {status.msg}
        </div>
      )}

      <ProfileForm
        initialValues={{
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          phone: user.phone || "",
          address: {
            street: user.address?.street || "",
            city: user.address?.city || "",
            zipcode: user.address?.zipcode || "",
            country: user.address?.country || "",
          },
          preferences: {
            size: user.preferences?.size || "",
            favoriteBrand: user.preferences?.favoriteBrand || "",
          },
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
