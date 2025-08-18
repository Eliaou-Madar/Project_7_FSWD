// client/src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/Products/ProductCard.jsx";
import { productsService } from "../services/products.service";
import { promosService } from "../services/promos.service";
import "../styles/global.css";
import "./HomePage.css";

function isPromoActive(p) {
  if (!p) return false;
  const activeFlag = p.active ?? p.is_active ?? p.status === "active";
  const now = Date.now();
  const startOk = !p.start_date || new Date(p.start_date).getTime() <= now;
  const endOk = !p.end_date || new Date(p.end_date).getTime() >= now;
  return !!activeFlag && startOk && endOk;
}
function promoLabel(p) {
  if (!p) return "";
  if (p.type === "percent") return `-${p.value}%`;
  if (p.type === "fixed") return `-${Number(p.value).toFixed(0)}€`;
  return p.code || "PROMO";
}

export default function HomePage() {
  const { userId } = useParams(); // si tu veux des liens protégés
  const [promos, setPromos] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setErr("");

    const pPromos = promosService
      .list({ active: 1, limit: 16 })
      .then((arr) => (arr || []).filter(isPromoActive))
      .catch(() => []);

    const pLatest = productsService
      .list({ sort: "newest", limit: 8 })
      .then((arr) => (Array.isArray(arr) ? arr : []))
      .catch(() => []);

    Promise.all([pPromos, pLatest])
      .then(([pp, pr]) => {
        if (cancel) return;

        // Tri des promos: % > montant, puis date plus récente
        pp.sort((a, b) => {
          const score = (x) =>
            (x.type === "percent" ? 1000 : 500) + Number(x.value || 0);
          const d = score(b) - score(a);
          if (d !== 0) return d;
          const da = new Date(a.start_date || a.created_at || 0).getTime();
          const db = new Date(b.start_date || b.created_at || 0).getTime();
          return db - da;
        });

        // Produits déjà triés par l’API, fallback tri date
        pr.sort(
          (a, b) =>
            new Date(b.created_at || b.createdAt || 0) -
            new Date(a.created_at || a.createdAt || 0)
        );

        setPromos(pp);
        setLatest(pr);
      })
      .catch((e) => !cancel && setErr(e?.message || "Load failed"))
      .finally(() => !cancel && setLoading(false));

    return () => {
      cancel = true;
    };
  }, []);

  const hero = useMemo(() => promos[0], [promos]);

  return (
    <div className="page home-page">
      {/* HERO */}
      <section className="home-hero card">
        <div className="hero-copy">
          {hero ? (
            <>
              <h1 className="hero-title">{promoLabel(hero)} sur la sélection</h1>
              {hero.description && <p className="muted">{hero.description}</p>}
              <div className="row">
                {hero.code && (
                  <span className="promo-code-pill">Code: {hero.code}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-title">Welcome to SneakRush</h1>
              <p className="muted">
                Découvrez les nouveautés et nos meilleures offres.
              </p>
              <Link to="/products">
                <button className="btn btn-primary">Voir la boutique</button>
              </Link>
            </>
          )}
        </div>
        <div className="hero-art" aria-hidden />
      </section>

      {/* Codes promo actifs */}
      {!!promos.length && (
        <section className="promo-strip card">
          <div className="strip-title">Codes promo actifs</div>
          <div className="strip-scroll">
            {promos.map((p) => (
              <span
                className="promo-pill"
                key={p.id || p.code}
                title={p.description || p.code}
              >
                {promoLabel(p)}
                {p.code ? ` · ${p.code}` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Articles les plus récents */}
      <section className="home-section">
        <div className="row-spread">
          <h2>Articles récents</h2>
          <Link to="/products" className="muted">
            Tout voir →
          </Link>
        </div>

        {loading ? (
          <div className="grid-skeleton">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="skeleton card" key={i} />
            ))}
          </div>
        ) : err ? (
          <p className="status-error">{err}</p>
        ) : !latest.length ? (
          <p className="status-empty">Aucun produit pour le moment.</p>
        ) : (
          <div className="products-grid">
            {latest.map((p) => (
              <ProductCard
                key={p.id || p.product_id || p._id}
                product={p}
                // Si tu veux des liens protégés type /users/:id/products/:pid, décommente:
                // to={`/users/${userId}/products/${p.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
