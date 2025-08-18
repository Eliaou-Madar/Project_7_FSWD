// client/src/pages/ProductsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { productsService } from "../services/products.service";
import ProductCard from "../components/Products/ProductCard.jsx";
import DevErrorBoundary from "../components/DevErrorBoundary";

function qs(obj) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    const s = typeof v === "string" ? v.trim() : v;
    if (s === "" || s === "any") return;
    params.set(k, String(s));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default function ProductsPage() {
  const { userId } = useParams(); // ✅ pour liens protégés
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  // ---- Filtres / recherche ----
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("any");        // string | "any"
  const [size, setSize] = useState("");             // string libre -> backend peut l’ignorer si non supporté
  const [minPrice, setMinPrice] = useState("");     // nombre en string pour input
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("any"); // "any" | "in" | "out"
  const [limited, setLimited] = useState("any");    // "any" | "1" | "0"
  const [sort, setSort] = useState("newest");       // "newest" | "price_asc" | "price_desc"

  // Marque: on propose un select à partir des produits chargés
  const brandOptions = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      const b = (p.brand ?? p.maker ?? "").trim();
      if (b) set.add(b);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const load = async (query = "") => {
    setLoading(true);
    try {
      const data = await productsService.list(query);
      if (data !== "__KEEP__") {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("products list failed:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSearch = (e) => {
    e.preventDefault();
    // map des filtres -> querystring selon ton backend (routes/products.js)
    // supportés côté serveur: search, brand, is_limited, minPrice, maxPrice, sort
    // facultatifs: in_stock (si tu l’as codé), size (peut être ignoré si non implémenté)
    const query = qs({
      search: q || undefined,
      brand: brand !== "any" ? brand : undefined,
      size: size || undefined,                                 // si non supporté, sera ignoré côté API
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort,
      is_limited: limited !== "any" ? (limited === "1" ? "1" : "0") : undefined,
      in_stock:
        availability === "any" ? undefined : availability === "in" ? "1" : "0",
    });
    load(query);
  };

  const onClear = () => {
    setQ("");
    setBrand("any");
    setSize("");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("any");
    setLimited("any");
    setSort("newest");
    load("");
  };

  return (
    <DevErrorBoundary>
      <div style={{ padding: 16 }}>
        <header
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",           // ✅ passe élégamment à la ligne en petit écran
          }}
        >
          

          {/* Barre de recherche + Filtres sur la même ligne */}
          <form
            onSubmit={onSearch}
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Recherche */}
            <input
              placeholder="Search sneakers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 180 }}
            />

            {/* Taille (libre) */}
            <input
              placeholder="Size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              style={{ width: 90 }}
              title="Taille (ex: 42, M…) — l'API peut l'ignorer si non implémenté"
            />

            {/* Marque */}
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              title="Brand"
              style={{ minWidth: 120 }}
            >
              <option value="any">All brands</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Prix min / max */}
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Min €"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{ width: 90 }}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Max €"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ width: 90 }}
            />

            {/* Disponibilité */}
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              title="Availability"
              style={{ minWidth: 130 }}
            >
              <option value="any">Any stock</option>
              <option value="in">In stock</option>
              <option value="out">Out of stock</option>
            </select>

            {/* Limité */}
            <select
              value={limited}
              onChange={(e) => setLimited(e.target.value)}
              title="Limited edition"
              style={{ minWidth: 130 }}
            >
              <option value="any">All editions</option>
              <option value="1">Limited</option>
              <option value="0">Not limited</option>
            </select>

            {/* Tri */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              title="Sort"
              style={{ minWidth: 130 }}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>

            <button type="submit">Apply</button>
            <button type="button" onClick={onClear}>Reset</button>
          </form>
        </header>

        {loading ? (
          <p>Loading…</p>
        ) : products.length === 0 ? (
          <p>No products.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                to={`/users/${userId}/products/${p.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </DevErrorBoundary>
  );
}
