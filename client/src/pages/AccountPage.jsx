import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { userProfilesService } from "../services/userProfiles.service";
import ProfileForm from "../components/Account/ProfileForm.jsx";

export default function AccountPage() {
  const { user } = useContext(AuthContext);   // route déjà protégée
  const userId = user?.id;

  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState({
    firstname: "", lastname: "", phone: "",
    address: { street: "", city: "", zipcode: "", country: "" },
    preferences: { size: "", favoriteBrand: "" },
  });

  // 🔄 charge user + profile depuis l'API
  useEffect(() => {
    let cancel = false;
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { user: u, profile: p } = await userProfilesService.getByUserId(userId);
        if (cancel) return;

        setInitialValues({
          firstname: u?.first_name ?? "",
          lastname:  u?.last_name ?? "",
          phone:     p?.phone ?? "",
          address: {
            street:  p?.street ?? "",
            city:    p?.city ?? "",
            zipcode: p?.zipcode ?? "",
            country: p?.country ?? "",
          },
          preferences: {
            size:          p?.pref_size ?? "",
            favoriteBrand: p?.pref_favorite_brand ?? "",
          },
        });
      } catch {
        setStatus({ type: "error", msg: "Failed to load profile ❌" });
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, [userId]);

  const handleSubmit = async (formData) => {
    if (!userId) return;
    setStatus({ type: "", msg: "" });
    try {
      // mappe vers le payload attendu par PUT /api/users/:id
      const payload = {
        first_name: formData.firstname,
        last_name:  formData.lastname,
        phone:      formData.phone,
        address: {
          street:  formData.address?.street ?? "",
          city:    formData.address?.city ?? "",
          zipcode: formData.address?.zipcode ?? "",
          country: formData.address?.country ?? "",
        },
        preferences: {
          size:          formData.preferences?.size ?? "",
          favoriteBrand: formData.preferences?.favoriteBrand ?? "",
        },
        // optionnel: name combiné pour full_name côté profil
        name: `${formData.firstname || ""} ${formData.lastname || ""}`.trim(),
      };

      const { user: u, profile: p } = await userProfilesService.updateByUserId(userId, payload);

      // rafraîchit les champs affichés après update
      setInitialValues({
        firstname: u?.first_name ?? "",
        lastname:  u?.last_name ?? "",
        phone:     p?.phone ?? "",
        address: {
          street:  p?.street ?? "",
          city:    p?.city ?? "",
          zipcode: p?.zipcode ?? "",
          country: p?.country ?? "",
        },
        preferences: {
          size:          p?.pref_size ?? "",
          favoriteBrand: p?.pref_favorite_brand ?? "",
        },
      });

      setStatus({ type: "success", msg: "Profile updated ✅" });
    } catch {
      setStatus({ type: "error", msg: "Update failed ❌" });
    }
  };

  if (!user) return null;

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

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ProfileForm initialValues={initialValues} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
