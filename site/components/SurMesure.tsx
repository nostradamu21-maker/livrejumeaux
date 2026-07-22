export default function SurMesure() {
  return (
    <section id="sur-mesure" className="sur-mesure">
      <div className="sm-carte">
        <div className="sm-texte">
          <span className="sm-eyebrow">Édition sur mesure</span>
          <h2>Vous ne trouvez pas de ressemblance&nbsp;?</h2>
          <p>
            Nos douze personnages ne ressemblent pas assez à vos enfants&nbsp;?
            Envoyez-nous une photo et nous créons leur livre entièrement{" "}
            <strong>sur mesure</strong>, à leur image.
          </p>
          <ul className="sm-points">
            <li>Personnages dessinés d&apos;après votre photo</li>
            <li>Validation des illustrations avant impression</li>
            <li>Même livre relié 20×20&nbsp;cm (+ 4,99&nbsp;€ de livraison)</li>
            <li>
              <strong>Votre photo n&apos;est jamais conservée</strong> : elle
              est supprimée automatiquement dès que le livre est généré.
            </li>
          </ul>
          <p className="sm-reduc">
            💛 <strong>−15&nbsp;€ sur votre livre</strong> si vous acceptez que
            le personnage dessiné d&apos;après votre photo soit conservé pour de
            futures créations. C&apos;est vous qui choisissez&nbsp;: sans cet
            accord, la photo <em>et</em> le personnage sont supprimés après
            impression.
          </p>
        </div>
        <div className="sm-offre">
          <span className="sm-prix">129&nbsp;€</span>
          <span className="sm-prix-note">livre sur mesure, à partir d&apos;une photo</span>
          <span className="sm-prix-reduc">ou 114&nbsp;€ avec l&apos;option de réutilisation</span>
          <a
            className="sm-cta"
            href="mailto:bonjour@gemellite.com?subject=Livre%20sur%20mesure%20%C2%AB%20Deux%20comme%20nous%20%C2%BB&body=Bonjour%2C%20je%20souhaite%20un%20livre%20sur%20mesure%20pour%20mes%20jumeaux.%20Voici%20une%20photo%20%3A"
          >
            Demander mon livre sur mesure
          </a>
          <span className="sm-note">
            Réponse sous 48&nbsp;h, nous vous guidons pas à pas.
          </span>
        </div>
      </div>
    </section>
  );
}
