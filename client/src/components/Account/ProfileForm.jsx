import React, { useEffect, useState } from "react";

export default function ProfileForm({ initialValues, onSubmit }) {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    address: { street: "", city: "", zipcode: "", country: "" },
    preferences: { size: "", favoriteBrand: "" },
  });

  useEffect(() => {
    if (initialValues) setForm((prev) => ({ ...prev, ...initialValues }));
  }, [initialValues]);

  const updateField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const updateNested = (group, name, value) =>
    setForm((prev) => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [name]: value },
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      phone: form.phone.trim(),
      address: {
        street: form.address.street.trim(),
        city: form.address.city.trim(),
        zipcode: form.address.zipcode.trim(),
        country: form.address.country.trim(),
      },
      preferences: {
        size: form.preferences.size.trim(),
        favoriteBrand: form.preferences.favoriteBrand.trim(),
      },
    };
    onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="profile-form"
      style={{
        display: "grid",
        gap: 12,
        maxWidth: 640,
        marginTop: 16,
      }}
    >
      <h2>Profile</h2>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <input
          placeholder="First name"
          value={form.firstname}
          onChange={(e) => updateField("firstname", e.target.value)}
          required
        />
        <input
          placeholder="Last name"
          value={form.lastname}
          onChange={(e) => updateField("lastname", e.target.value)}
          required
        />
      </div>

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => updateField("phone", e.target.value)}
      />

      <h3>Address</h3>
      <input
        placeholder="Street"
        value={form.address.street}
        onChange={(e) => updateNested("address", "street", e.target.value)}
      />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <input
          placeholder="City"
          value={form.address.city}
          onChange={(e) => updateNested("address", "city", e.target.value)}
        />
        <input
          placeholder="Zipcode"
          value={form.address.zipcode}
          onChange={(e) => updateNested("address", "zipcode", e.target.value)}
        />
      </div>
      <input
        placeholder="Country"
        value={form.address.country}
        onChange={(e) => updateNested("address", "country", e.target.value)}
      />

      <h3>Preferences</h3>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <input
          placeholder="Shoe size (EU/US)"
          value={form.preferences.size}
          onChange={(e) => updateNested("preferences", "size", e.target.value)}
        />
        <input
          placeholder="Favorite brand"
          value={form.preferences.favoriteBrand}
          onChange={(e) =>
            updateNested("preferences", "favoriteBrand", e.target.value)
          }
        />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="submit">Save changes</button>
      </div>
    </form>
  );
}
