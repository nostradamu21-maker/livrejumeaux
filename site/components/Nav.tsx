export default function Nav() {
  return (
    <nav className="nav">
      <a className="brand" href="#top">
        Deux&nbsp;comme&nbsp;nous
      </a>
      <div className="nav-links">
        <a href="#livre">Le livre</a>
        <a href="#pourquoi">Pourquoi</a>
        <a href="#cadeau">Offrir</a>
        <a href="#faq">Questions</a>
        <a href="#creer" className="nav-cta">
          Créer le vôtre
        </a>
      </div>
    </nav>
  );
}
