import { t, type Locale } from "@/lib/i18n";

export default function Cadeau({ l }: { l: Locale }) {
  const d = t(l);
  return (
    <section id="cadeau" className="cadeau">
      <div className="cadeau-carte">
        <p className="eyebrow">{d.cadeau.eyebrow}</p>
        <h2>{d.cadeau.h2}</h2>
        <p className="cadeau-texte">{d.cadeau.texte}</p>
        <ul className="cadeau-occasions">
          {d.cadeau.occasions.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <a href="#creer" className="btn btn-primary">
          {d.cadeau.cta}
        </a>
      </div>
    </section>
  );
}
