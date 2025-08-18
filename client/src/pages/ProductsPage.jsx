import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { productsService } from "../services/products.service";
import ProductCard from "../components/Products/ProductCard.jsx";
import DevErrorBoundary from "../components/DevErrorBoundary";
import "./ProductsPage.css";

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
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("any");
  const [size, setSize] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("any");
  const [limited, setLimited] = useState("any");
  const [sort, setSort] = useState("newest");

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
      if (data !== "__KEEP__") setProducts(Array.isArray(data) ? data : []);
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
    const query = qs({
      search: q || undefined,
      brand: brand !== "any" ? brand : undefined,
      size: size || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort,
      is_limited: limited !== "any" ? (limited === "1" ? "1" : "0") : undefined,
      in_stock: availability === "any" ? undefined : availability === "in" ? "1" : "0",
    });
    load(query);
  };

  const onClear = () => {
    setQ(""); setBrand("any"); setSize("");
    setMinPrice(""); setMaxPrice("");
    setAvailability("any"); setLimited("any");
    setSort("newest");
    load("");
  };

  return (
    <DevErrorBoundary>
      <div className="products-page container">
        <header className="products-header">
          {/* (Optionnel) Titre / breadcrumb ici */}
          <form onSubmit={onSearch} className="products-filters">
            <input
              placeholder="Search sneakers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 180 }}
            />
            <input
              placeholder="Size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              title="Taille (ex: 42, M…)"
            />
            <select value={brand} onChange={(e) => setBrand(e.target.value)} title="Brand">
              <option value="any">All brands</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <input
              type="number" min="0" step="0.01" placeholder="Min €"
              value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number" min="0" step="0.01" placeholder="Max €"
              value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            />
            <select value={availability} onChange={(e) => setAvailability(e.target.value)} title="Availability">
              <option value="any">Any stock</option>
              <option value="in">In stock</option>
              <option value="out">Out of stock</option>
            </select>
            <select value={limited} onChange={(e) => setLimited(e.target.value)} title="Limited edition">
              <option value="any">All editions</option>
              <option value="1">Limited</option>
              <option value="0">Not limited</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} title="Sort">
              <option value="newest">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>

            <button type="submit">Apply</button>
            <button type="button" className="ghost" onClick={onClear}>Reset</button>
          </form>
        </header>

        {loading ? (
          <div className="products-state">Loading…</div>
        ) : products.length === 0 ? (
          <div className="products-state">No products.</div>
        ) : (
          <div className="products-grid">
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
