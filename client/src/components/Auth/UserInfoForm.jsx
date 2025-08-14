// src/components/Auth/UserInfoForm.jsx
import React, { useState } from "react";

export default function UserInfoForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: {
      street: "",
      city: "",
      zipcode: "",
      country: "",
    },
    // Optionnel SneakRush: préférences
    preferences: {
      size: "",
      favoriteBrand: "",
    },
  });

  const handleChange = (e, nested) => {
    const { name, value } = e.target;
    if (nested) {
      setForm((prev) => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [name]: value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
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
    onSubmit(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Complete your profile</h3>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
          />

          <h4>Address</h4>
          <input
            name="street"
            placeholder="Street"
            value={form.address.street}
            onChange={(e) => handleChange(e, "address")}
          />
          <input
            name="city"
            placeholder="City"
            value={form.address.city}
            onChange={(e) => handleChange(e, "address")}
          />
          <input
            name="zipcode"
            placeholder="Zipcode"
            value={form.address.zipcode}
            onChange={(e) => handleChange(e, "address")}
          />
          <input
            name="country"
            placeholder="Country"
            value={form.address.country}
            onChange={(e) => handleChange(e, "address")}
          />

          <h4>Preferences (optional)</h4>
          <input
            name="size"
            placeholder="Shoe size (EU/US)"
            value={form.preferences.size}
            onChange={(e) => handleChange(e, "preferences")}
          />
          <input
            name="favoriteBrand"
            placeholder="Favorite brand"
            value={form.preferences.favoriteBrand}
            onChange={(e) => handleChange(e, "preferences")}
          />

          <div className="modal-buttons">
            <button type="submit">Save</button>
            {onCancel && (
              <button type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
