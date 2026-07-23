import type { Metadata } from "next";
import Link from "next/link";
import { ENTREPRISE, HEBERGEUR, IMPRESSION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: true, follow: true },
};

export default function MentionsLegales() {
  return (
    <main className="legale">
      <Link href="/" className="legale-retour">← Retour à la boutique</Link>
      <h1>Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        Le site {ENTREPRISE.site} (boutique «&nbsp;Deux comme nous&nbsp;») est
        édité par&nbsp;:
      </p>
      <ul>
        <li><strong>{ENTREPRISE.nom}</strong>, {ENTREPRISE.forme}</li>
        <li>SIREN&nbsp;: {ENTREPRISE.siren} — SIRET (siège)&nbsp;: {ENTREPRISE.siret}</li>
        <li>RCS&nbsp;: {ENTREPRISE.rcs}</li>
        <li>N° de TVA intracommunautaire&nbsp;: {ENTREPRISE.tva}</li>
        <li>Adresse&nbsp;: {ENTREPRISE.adresse}</li>
        <li>Contact&nbsp;: <a href={`mailto:${ENTREPRISE.email}`}>{ENTREPRISE.email}</a></li>
      </ul>
      <p>Directeur de la publication&nbsp;: Simon Stoll.</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par {HEBERGEUR.nom}, {HEBERGEUR.adresse} —{" "}
        <a href={HEBERGEUR.site} rel="noopener noreferrer" target="_blank">
          {HEBERGEUR.site}
        </a>.
      </p>

      <h2>Impression et expédition</h2>
      <p>Les livres sont imprimés et expédiés par {IMPRESSION}.</p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus du site (textes du livre, illustrations,
        marque «&nbsp;Deux comme nous&nbsp;», charte graphique) est protégé par
        le droit de la propriété intellectuelle. Toute reproduction ou
        réutilisation sans autorisation écrite est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </main>
  );
}
