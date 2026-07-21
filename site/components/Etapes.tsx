export default function Etapes() {
  return (
    <section id="etapes" className="etapes">
      <div className="section-tete">
        <h2>Comment ça marche</h2>
      </div>
      <div className="etapes-grid">
        <div className="etape">
          <span className="etape-num">1</span>
          <h3>Vous composez</h3>
          <p>
            Un personnage et un prénom pour chaque jumeau. L&apos;aperçu se met à
            jour en direct.
          </p>
        </div>
        <div className="etape">
          <span className="etape-num">2</span>
          <h3>On crée le livre</h3>
          <p>
            Nos illustrations sont personnalisées et vérifiées une à une, avec le
            plus grand soin.
          </p>
        </div>
        <div className="etape">
          <span className="etape-num">3</span>
          <h3>Vous le recevez</h3>
          <p>
            Imprimé, relié et expédié chez vous — prêt à être lu et relu, encore
            et encore.
          </p>
        </div>
      </div>
      <div className="etapes-cta">
        <a href="#creer" className="btn btn-primary">
          Créer notre livre
        </a>
      </div>
    </section>
  );
}
