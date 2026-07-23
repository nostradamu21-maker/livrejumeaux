"use client";

import { useState } from "react";

export default function SurMesure() {
  const [prenoms, setPrenoms] = useState({ 1: "", 2: "" });
  const [email, setEmail] = useState("");
  const [reutilisation, setReutilisation] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [statut, setStatut] = useState<{ txt: string; cls: string }>({ txt: "", cls: "" });

  const prix = reutilisation ? "114 €" : "129 €";
  const pret = !!(prenoms[1] && prenoms[2]);

  async function commander(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setStatut({ txt: "Traitement…", cls: "" });
    try {
      const r = await fetch("/api/sur-mesure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom1: prenoms[1],
          prenom2: prenoms[2],
          email: email.trim(),
          reutilisation,
        }),
      });
      const data = await r.json();
      if (data.ok && data.url) {
        setStatut({ txt: "Redirection vers le paiement sécurisé…", cls: "ok" });
        window.location.href = data.url;
        return;
      }
      if (data.ok) {
        setStatut({ txt: data.message, cls: "ok" });
      } else {
        setStatut({ txt: data.erreur || "Une erreur est survenue.", cls: "erreur" });
        setEnvoi(false);
      }
    } catch {
      setStatut({ txt: "Serveur injoignable.", cls: "erreur" });
      setEnvoi(false);
    }
  }

  return (
    <section id="sur-mesure" className="sur-mesure">
      <div className="sm-carte">
        <div className="sm-texte">
          <span className="sm-eyebrow">Édition sur mesure</span>
          <h2>Vous ne trouvez pas de ressemblance&nbsp;?</h2>
          <p>
            Nos douze personnages ne ressemblent pas assez à vos enfants&nbsp;?
            Nous créons leur livre entièrement <strong>sur mesure</strong>, à
            leur image, à partir d&apos;une simple photo.
          </p>
          <ul className="sm-points">
            <li>Personnages dessinés d&apos;après votre photo</li>
            <li>Validation des illustrations avant impression</li>
            <li>Même livre relié 20×20&nbsp;cm (+ 4,99&nbsp;€ de livraison)</li>
            <li>
              <strong>Votre photo n&apos;est jamais conservée</strong>&nbsp;:
              elle est supprimée automatiquement dès que le livre est généré.
            </li>
          </ul>
          <p className="sm-comment">
            Comment ça marche&nbsp;? Vous payez en ligne, puis vous envoyez
            votre photo en répondant simplement à l&apos;e-mail de
            confirmation. Nous dessinons, vous validez, nous imprimons.
          </p>
        </div>
        <form className="sm-offre" onSubmit={commander}>
          <span className="sm-prix">{prix}</span>
          <span className="sm-prix-note">livre sur mesure, à partir d&apos;une photo</span>
          <input
            type="text"
            className="champ-email"
            placeholder="Prénom du premier enfant"
            maxLength={18}
            value={prenoms[1]}
            onChange={(e) => setPrenoms((p) => ({ ...p, 1: e.target.value.trim() }))}
          />
          <input
            type="text"
            className="champ-email"
            placeholder="Prénom du second enfant"
            maxLength={18}
            value={prenoms[2]}
            onChange={(e) => setPrenoms((p) => ({ ...p, 2: e.target.value.trim() }))}
          />
          <input
            type="email"
            className="champ-email"
            placeholder="Votre e-mail (facultatif)"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="sm-option">
            <input
              type="checkbox"
              checked={reutilisation}
              onChange={(e) => setReutilisation(e.target.checked)}
            />
            <span>
              <strong>−15&nbsp;€</strong>&nbsp;: j&apos;accepte que le
              personnage dessiné (jamais la photo) soit conservé pour de
              futures créations.
            </span>
          </label>
          <button type="submit" className="sm-cta" disabled={!pret || envoi}>
            Commander mon livre sur mesure
          </button>
          <p className={`statut ${statut.cls}`}>{statut.txt}</p>
          <span className="sm-note">
            Une question d&apos;abord&nbsp;?{" "}
            <a href="mailto:bonjour@gemellite.com?subject=Livre%20sur%20mesure">
              Écrivez-nous
            </a>
            , réponse sous 48&nbsp;h.
          </span>
        </form>
      </div>
    </section>
  );
}
