import { t, type Locale } from "@/lib/i18n";

export default function Faq({ l }: { l: Locale }) {
  const d = t(l);
  return (
    <section id="faq" className="faq">
      <div className="section-tete">
        <h2>{d.faq.titre}</h2>
      </div>
      <div className="faq-liste">
        {d.faq.items.map(({ q, r }) => (
          <details key={q} className="faq-item">
            <summary>{q}</summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
