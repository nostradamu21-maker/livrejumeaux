export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-text">
        <p className="eyebrow">Le cadeau des parents de jumeaux</p>
        <h1>
          Enfin une histoire
          <br />
          où ils sont <em>deux</em>
        </h1>
        <p className="lead">
          Le livre personnalisé pensé pour les jumeaux&nbsp;: leurs prénoms,
          leur allure, leur complicité. Ensemble sur chaque page, du premier
          câlin au dernier bisou du soir.
        </p>
        <div className="hero-actions">
          <a href="#creer" className="btn btn-primary">
            Créer leur livre
          </a>
          <a href="#livre" className="btn btn-ghost">
            Feuilleter un exemple
          </a>
        </div>
        <ul className="hero-points">
          <li>Deux héros à leur image</li>
          <li>Relié 20×20&nbsp;cm, vérifié à la main</li>
          <li>Par les créateurs de Jumelio &amp; Gemellite.com</li>
        </ul>
      </div>
      <div className="hero-visual">
        <div className="hero-blob" />
        <span className="hero-deco deco-1" aria-hidden="true">✦</span>
        <span className="hero-deco deco-2" aria-hidden="true">✦</span>
        <span className="hero-deco deco-3" aria-hidden="true">💛</span>
        <div className="book book-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apercus/test-filles/couverture.jpg" alt="Couverture du livre" />
        </div>
      </div>
    </header>
  );
}
