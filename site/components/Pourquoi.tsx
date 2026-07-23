import { t, type Locale } from "@/lib/i18n";

export default function Pourquoi({ l }: { l: Locale }) {
  const d = t(l);
  return (
    <section id="pourquoi" className="pourquoi">
      <div className="section-tete">
        <h2>
          {d.pourquoi.h2a}
          <br />
          <em>{d.pourquoi.h2em}</em>
        </h2>
        <p className="section-sub">{d.pourquoi.sub}</p>
      </div>
      <div className="pourquoi-grid">
        {d.pourquoi.cartes.map((c) => (
          <div className="pq-carte" key={c.titre}>
            <span className="pq-icone">{c.icone}</span>
            <h3>{c.titre}</h3>
            <p>{c.texte}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
