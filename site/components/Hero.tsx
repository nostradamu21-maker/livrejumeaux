export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-text">
        <p className="eyebrow">Album personnalisé · jumeaux &amp; jumelles</p>
        <h1>
          L&apos;histoire d&apos;être
          <br />
          <em>deux comme nous</em>
        </h1>
        <p className="lead">
          Un livre tendre et unique qui célèbre le lien de vos jumeaux : leurs
          prénoms, leur allure, leur complicité — page après page.
        </p>
        <div className="hero-actions">
          <a href="#creer" className="btn btn-primary">
            Créer notre livre
          </a>
          <a href="#livre" className="btn btn-ghost">
            Feuilleter un exemple
          </a>
        </div>
        <ul className="hero-points">
          <li>Deux héros à votre image</li>
          <li>Imprimé &amp; relié avec soin</li>
          <li>Livré en quelques jours</li>
        </ul>
      </div>
      <div className="hero-visual">
        <div className="hero-blob" />
        <div className="book book-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apercus/test-filles/couverture.jpg" alt="Couverture du livre" />
        </div>
      </div>
    </header>
  );
}
