import React, { useEffect, useState } from "react";

/**
 * Props:
 * - initialValues?: { name, price, description, sku, image } (image: URL)
 * - onSubmit(FormData)
 * - onCancel()
 *
 * Le formulaire renvoie un FormData pour supporter l'upload d'image.
 * Côté API, attends un champ "image" (file) et les autres en text.
 */
export default function ProductForm({ initialValues, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name ?? "");
      setPrice(initialValues.price ?? "");
      setSku(initialValues.sku ?? "");
      setDescription(initialValues.description ?? "");
      setPreview(initialValues.image ?? "");
    }
  }, [initialValues]);

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("price", String(price));
    if (sku) fd.append("sku", sku.trim());
    if (description) fd.append("description", description.trim());
    if (imageFile) fd.append("image", imageFile); // champ fichier
    onSubmit?.(fd);
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "grid", gap: 10, border: "1px solid #eee", borderRadius: 12, padding: 12 }}
    >
      <h2 style={{ margin: 0 }}>{initialValues ? "Edit product" : "New product"}</h2>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Price (€)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <input
        placeholder="SKU (optional)"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />
      <div style={{ display: "grid", gap: 8 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setImageFile(file || null);
            if (file) setPreview(URL.createObjectURL(file));
          }}
        />
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{ width: 180, height: 180, objectFit: "cover", borderRadius: 8 }}
          />
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        <button type="submit">{initialValues ? "Save changes" : "Create product"}</button>
      </div>
    </form>
  );
}
