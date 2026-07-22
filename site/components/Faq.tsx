import { FAQ } from "@/lib/seo";

export default function Faq() {
  return (
    <section id="faq" className="faq">
      <div className="section-tete">
        <h2>Vos questions</h2>
      </div>
      <div className="faq-liste">
        {FAQ.map(({ q, r }) => (
          <details key={q} className="faq-item">
            <summary>{q}</summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
