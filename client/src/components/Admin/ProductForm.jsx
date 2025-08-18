// client/src/components/Admin/ProductForm.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Props:
 * - initialValues?: { id, name, brand, price, description, sku, url, image, is_limited }
 * - onSubmit(FormData)
 * - onCancel()
 * - brands?: string[]
 *
 * Envoi FormData:
 *   name, brand?, price, sku?, description?, is_limited(0|1), url?, image_name?, image?(file)
 */

// Règle: si le nom finit par ...<number>.<ext>, on force /img/shoes/<number>.<ext>
const IMG_NUM_RE = /(\d+)\.(png|jpe?g|webp|gif)$/i;
function urlFromFileName(name) {
  const m = (name || "").match(IMG_NUM_RE);
  if (m) return `/img/shoes/${m[1]}.${m[2].toLowerCase()}`;
  return name || "";
}

export default function ProductForm({ initialValues, onSubmit, onCancel, brands }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [isLimited, setIsLimited] = useState(false);

  const [url, setUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  const brandOptions = useMemo(
    () =>
      Array.isArray(brands) && brands.length
        ? brands
        : ["Nike", "Adidas", "Puma", "Reebok", "New Balance", "Asics", "Vans", "Converse"],
    [brands]
  );

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name ?? "");
      setBrand(initialValues.brand ?? "");
      setPrice(initialValues.price ?? "");
      setSku(initialValues.sku ?? "");
      setDescription(initialValues.description ?? "");
      setIsLimited(Boolean(initialValues.is_limited));

      const existingUrl = initialValues.url || initialValues.image || "";
      setUrl(existingUrl);
      setPreview(existingUrl || "");
      setImageName("");
      setImageFile(null);
    } else {
      setName("");
      setBrand("");
      setPrice("");
      setSku("");
      setDescription("");
      setIsLimited(false);
      setUrl("");
      setPreview("");
      setImageName("");
      setImageFile(null);
    }
  }, [initialValues]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const nextImageName = file.name;
      const nextUrl = urlFromFileName(nextImageName);
      setImageName(nextImageName); // ex: "3.jpg"
      setUrl(nextUrl);             // ex: "/img/shoes/3.jpg"
      setPreview(URL.createObjectURL(file));
    } else {
      setImageName("");
      const existing = initialValues?.url || initialValues?.image || "";
      setUrl(existing);
      setPreview(existing);
    }
  };

  const onImageNameChange = (v) => {
    setImageName(v);
    setUrl(urlFromFileName(v)); // recalcule automatiquement l’URL
  };

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name.trim());
    if (brand) fd.append("brand", brand.trim());
    fd.append("price", String(price));
    if (sku) fd.append("sku", sku.trim());
    if (description) fd.append("description", description.trim());
    fd.append("is_limited", String(isLimited ? 1 : 0));
    if (url) fd.append("url", url);
    if (imageName) fd.append("image_name", imageName);
    if (imageFile) fd.append("image", imageFile);
    onSubmit?.(fd);
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: 10,
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <h2 style={{ margin: 0 }}>
        {initialValues ? "Edit product" : "New product"}
      </h2>

      <label>
        <div>Name</div>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label>
        <div>Brand</div>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">— Select brand —</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label>
        <div>Price (€)</div>
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>

      <label>
        <div>SKU (optional)</div>
        <input
          placeholder="SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        />
      </label>

      <label>
        <div>Description (optional)</div>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={isLimited}
          onChange={(e) => setIsLimited(e.target.checked)}
        />
        <span>Is limited</span>
      </label>

      {/* Image */}
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          <div>Image file</div>
          <input type="file" accept="image/*" onChange={onFileChange} />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <label>
            <div>Image name (auto)</div>
            <input
              value={imageName}
              onChange={(e) => onImageNameChange(e.target.value)}
              placeholder="3.jpg, 12.png, …"
            />
          </label>
          <label>
            <div>URL / Path (auto)</div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/img/shoes/3.jpg"
            />
          </label>
        </div>

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{ width: 180, height: 180, objectFit: "cover", borderRadius: 8 }}
          />
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit">
          {initialValues ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
