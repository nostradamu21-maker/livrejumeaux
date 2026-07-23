import { LOCALES, prefixe, t, type Locale } from "@/lib/i18n";

export default function Nav({ l }: { l: Locale }) {
  const d = t(l);
  return (
    <nav className="nav">
      <a className="brand" href="#top">
        Deux&nbsp;comme&nbsp;nous
      </a>
      <div className="nav-links">
        <a href="#livre">{d.nav.livre}</a>
        <a href="#pourquoi">{d.nav.pourquoi}</a>
        <a href="#cadeau">{d.nav.offrir}</a>
        <a href="#faq">{d.nav.questions}</a>
        <div className="nav-langues">
          {LOCALES.map((loc) => (
            <a
              key={loc}
              href={prefixe(loc) || "/"}
              className={loc === l ? "actif" : ""}
              aria-current={loc === l ? "page" : undefined}
            >
              {loc.toUpperCase()}
            </a>
          ))}
        </div>
        <a href="#creer" className="nav-cta">
          {d.nav.cta}
        </a>
      </div>
    </nav>
  );
}
