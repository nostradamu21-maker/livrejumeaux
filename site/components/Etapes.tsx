import { t, type Locale } from "@/lib/i18n";

export default function Etapes({ l }: { l: Locale }) {
  const d = t(l);
  return (
    <section id="etapes" className="etapes">
      <div className="section-tete">
        <h2>{d.etapes.h2}</h2>
      </div>
      <div className="etapes-grid">
        {d.etapes.liste.map((e, i) => (
          <div className="etape" key={e.t}>
            <span className="etape-num">{i + 1}</span>
            <h3>{e.t}</h3>
            <p>{e.p}</p>
          </div>
        ))}
      </div>
      <div className="etapes-cta">
        <a href="#creer" className="btn btn-primary">
          {d.etapes.cta}
        </a>
      </div>
    </section>
  );
}
