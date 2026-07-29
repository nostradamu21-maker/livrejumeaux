import { prefixe, t, type Locale } from "@/lib/i18n";

// Barre d'achat mobile, collée en bas d'écran.
// - "duo" (home) : les DEUX produits côte à côte, livre et affiche.
// - "livre" / "affiche" : la version mono-produit des pages produit.
export default function BarreMobile({
  l,
  href,
  variante = "duo",
}: {
  l: Locale;
  href?: string;
  variante?: "duo" | "livre" | "affiche";
}) {
  const d = t(l);
  const p = prefixe(l);

  if (variante === "duo") {
    return (
      <div className="barre-mobile bm-duo">
        <a href={`${p}/livre`} className="bm-produit bm-p-livre">
          <strong>{d.hero.produits.livre.nom}</strong>
          <small>{d.hero.produits.livre.prix}</small>
        </a>
        <a href={`${p}/affiche`} className="bm-produit bm-p-affiche">
          <strong>{d.hero.produits.affiche.nom}</strong>
          <small>{d.hero.produits.affiche.prix}</small>
        </a>
      </div>
    );
  }

  const affiche = variante === "affiche";
  return (
    <a
      href={href ?? (affiche ? "#tunnel-haut" : `${p}/livre`)}
      className="barre-mobile"
    >
      <span className="bm-prix">
        {affiche ? d.hero.produits.affiche.prix : d.config.prixLivre}{" "}
        <small>{d.barre.note}</small>
      </span>
      <span className="bm-btn">{affiche ? d.barre.ctaAffiche : d.barre.cta}</span>
    </a>
  );
}
