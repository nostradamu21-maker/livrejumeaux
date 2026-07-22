export default function Etapes() {
  return (
    <section id="etapes" className="etapes">
      <div className="section-tete">
        <h2>Un cadeau unique en trois minutes</h2>
      </div>
      <div className="etapes-grid">
        <div className="etape">
          <span className="etape-num">1</span>
          <h3>Vous composez</h3>
          <p>
            Un personnage et un prénom pour chaque enfant. La couverture prend
            vie sous vos yeux, en direct.
          </p>
        </div>
        <div className="etape">
          <span className="etape-num">2</span>
          <h3>Nous soignons chaque page</h3>
          <p>
            Les illustrations sont personnalisées puis vérifiées une à une, à la
            main, avant d&apos;être confiées à l&apos;imprimeur.
          </p>
        </div>
        <div className="etape">
          <span className="etape-num">3</span>
          <h3>Ils se découvrent en héros</h3>
          <p>
            Le livre arrive relié chez vous. Il ne reste qu&apos;à ouvrir la
            première page, et à la relire tous les soirs.
          </p>
        </div>
      </div>
      <div className="etapes-cta">
        <a href="#creer" className="btn btn-primary">
          Créer leur livre
        </a>
      </div>
    </section>
  );
}
