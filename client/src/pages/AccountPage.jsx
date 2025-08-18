import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { userProfilesService } from "../services/userProfiles.service";
import ProfileForm from "../components/Account/ProfileForm.jsx";
import "./AccountPage.css";

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
        name: `${formData.firstname || ""} ${formData.lastname || ""}`.trim(),
      };
      const { user: u, profile: p } = await userProfilesService.updateByUserId(userId, payload);
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
    <div className="account-page">
      <div className="account-wrap">
        <header className="account-header">
          <h1>My Account</h1>
          <p className="account-meta">
            Signed in as <strong>{user.email}</strong>
          </p>
        </header>

        {status.msg && (
          <div
            className={`account-alert ${
              status.type === "success" ? "account-alert--success" : "account-alert--error"
            }`}
          >
            {status.msg}
          </div>
        )}

        {loading ? (
          <div className="account-loading">Loading…</div>
        ) : (
          <div className="account-body">
            <div className="account-card">
              <ProfileForm initialValues={initialValues} onSubmit={handleSubmit} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
