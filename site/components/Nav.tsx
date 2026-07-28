import SelecteurLangue from "@/components/SelecteurLangue";
import { prefixe, t, type Locale } from "@/lib/i18n";

export default function Nav({ l }: { l: Locale }) {
  const d = t(l);
  // Liens absolus (préfixés par la langue) : la nav sert la home ET les pages
  // produit /livre et /affiche.
  const p = prefixe(l);
  return (
    <nav className="nav">
      <a className="brand" href={p || "/"}>
        Deux&nbsp;comme&nbsp;nous
      </a>
      <div className="nav-links">
        {/* Ordre : les deux produits, puis la découverte, puis l'aide. */}
        <a href={`${p}/livre`}>{d.nav.livre}</a>
        <a href={`${p}/affiche`}>{d.nav.cadre}</a>
        <a href={`${p}/#pourquoi`}>{d.nav.pourquoi}</a>
        <a href={`${p}/#cadeau`}>{d.nav.offrir}</a>
        <a href={`${p}/#faq`}>{d.nav.questions}</a>
        <SelecteurLangue l={l} />
        <a href={`${p}/livre`} className="nav-cta">
          {d.nav.cta}
        </a>
      </div>
    </nav>
  );
}
