import React, { useEffect, useState } from "react";
import { productsService } from "../services/products.service";
import ProductCard from "../components/Products/ProductCard.jsx";
import DevErrorBoundary from "../components/DevErrorBoundary";

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const load = async (query = "") => {
    setLoading(true);
    try {
      const data = await productsService.list(query);
      if (data !== "__KEEP__") {
       setProducts(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("products list failed:", e); // pour voir si ça replante
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load(q.trim());
  };

  return (
    <DevErrorBoundary>
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Products</h1>
        <form onSubmit={onSearch} style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            placeholder="Search sneakers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">Search</button>
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
            <ProductCard key={p.id} product={p} />
           ))}
        </div>
      )}
    </div>
  </DevErrorBoundary>
  );
}
