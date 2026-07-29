import { prefixe, t, type Locale } from "@/lib/i18n";

export default function Hero({ l }: { l: Locale }) {
  const d = t(l);
  const p = prefixe(l);
  return (
    <header className="hero">
      <div className="hero-text">
        <p className="eyebrow">{d.hero.eyebrow}</p>
        <h1>
          {d.hero.h1a}
          <br />
          {l === "fr" ? (
            <>où ils sont <em>deux</em></>
          ) : l === "en" ? (
            <>where they are <em>two</em></>
          ) : l === "es" ? (
            <>donde son <em>dos</em></>
          ) : (
            <>in der sie <em>zwei</em> sind</>
          )}
        </h1>
        <p className="lead">{d.hero.lead}</p>
        {/* Sélecteur des deux produits : le livre (produit phare) et l'affiche. */}
        <div className="hero-produits">
          <a href={`${p}/livre`} className="hero-produit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hp-icone" src="/apercus/test-filles/couverture.jpg" alt="" loading="lazy" />
            <span className="hp-infos">
              <strong>{d.hero.produits.livre.nom}</strong>
              <small>{d.hero.produits.livre.sub}</small>
            </span>
            <span className="hp-prix">{d.hero.produits.livre.prix}</span>
            <span className="hp-fleche" aria-hidden="true">›</span>
          </a>
          <a href={`${p}/affiche`} className="hero-produit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hp-icone" src="/apercus/test-filles/affiche.jpg" alt="" loading="lazy" />
            <span className="hp-infos">
              <strong>{d.hero.produits.affiche.nom}</strong>
              <small>{d.hero.produits.affiche.sub}</small>
            </span>
            <span className="hp-prix">{d.hero.produits.affiche.prix}</span>
            <span className="hp-fleche" aria-hidden="true">›</span>
          </a>
        </div>
        <div className="hero-actions">
          <a href="#livre" className="btn btn-ghost">
            {d.hero.ctaFeuilleter}
          </a>
          <a href={`${p}/affiche`} className="btn btn-ghost">
            {d.hero.ctaExAffiche}
          </a>
        </div>
        <ul className="hero-points">
          {d.hero.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div className="hero-visual">
        <div className="hero-blob" />
        <span className="hero-deco deco-1" aria-hidden="true">✦</span>
        <span className="hero-deco deco-2" aria-hidden="true">✦</span>
        <span className="hero-deco deco-3" aria-hidden="true">💛</span>
        <div className="book book-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lifestyle/jumelles-lecture.jpg" alt={d.hero.alt} />
        </div>
      </div>
    </header>
  );
}
