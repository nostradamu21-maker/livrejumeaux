const QUESTIONS: { q: string; r: React.ReactNode }[] = [
  {
    q: "Pour quel âge est-ce adapté ?",
    r: (
      <>
        De la naissance à 6&nbsp;ans environ. Offert à la naissance, c&apos;est
        un souvenir qui grandit avec eux&nbsp;; vers 2-3&nbsp;ans, c&apos;est
        l&apos;histoire du soir qu&apos;ils réclament&nbsp;: celle où les héros
        portent leurs prénoms.
      </>
    ),
  },
  {
    q: "Ça marche pour un garçon et une fille ?",
    r: (
      <>
        Oui&nbsp;! Toutes les combinaisons sont possibles&nbsp;: deux garçons,
        deux filles, ou un garçon et une fille. Le texte est écrit pour
        fonctionner naturellement dans tous les cas.
      </>
    ),
  },
  {
    q: "Nos jumeaux sont identiques… comment les distinguer dans le livre ?",
    r: (
      <>
        C&apos;est prévu&nbsp;: si vous choisissez le même personnage pour les
        deux, vous sélectionnez un petit détail (doudou, lunettes, casquette,
        foulard) que porte le second sur toutes les pages. Chacun se reconnaît
        au premier coup d&apos;œil.
      </>
    ),
  },
  {
    q: "Quels sont les délais ?",
    r: (
      <>
        Chaque livre est imprimé à la demande puis expédié directement chez
        vous. Comptez environ une semaine en tout. Si votre combinaison de
        personnages est créée pour la première fois, nous ajoutons 1 à
        2&nbsp;jours pour vérifier chaque illustration à la main.
      </>
    ),
  },
  {
    q: "Quelle est la qualité du livre ?",
    r: (
      <>
        Un vrai livre relié&nbsp;: format carré 20×20&nbsp;cm, couverture
        rigide avec pelliculage mat, papier épais 170&nbsp;g soyeux, 30 pages.
        Conçu pour être lu, relu, mordillé et transmis.
      </>
    ),
  },
  {
    q: "Et si aucun personnage ne leur ressemble ?",
    r: (
      <>
        Nous proposons une <a href="#sur-mesure">édition sur mesure</a>&nbsp;:
        envoyez-nous une photo et nous dessinons leurs personnages à leur
        image. Votre photo est supprimée dès le livre créé.
      </>
    ),
  },
];

export default function Faq() {
  return (
    <section id="faq" className="faq">
      <div className="section-tete">
        <h2>Vos questions</h2>
      </div>
      <div className="faq-liste">
        {QUESTIONS.map(({ q, r }) => (
          <details key={q} className="faq-item">
            <summary>{q}</summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
