import { t, type Locale } from "@/lib/i18n";

export default function Hero({ l }: { l: Locale }) {
  const d = t(l);
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
        <div className="hero-actions">
          <a href="#sur-mesure" className="btn btn-primary">
            {d.hero.ctaCreer}
          </a>
          <a href="#livre" className="btn btn-ghost">
            {d.hero.ctaFeuilleter}
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
          <img src="/apercus/test-filles/couverture.jpg" alt={d.hero.alt} />
        </div>
      </div>
    </header>
  );
}
