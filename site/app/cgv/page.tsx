import type { Metadata } from "next";
import Link from "next/link";
import { ENTREPRISE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  robots: { index: true, follow: true },
};

export default function Cgv() {
  return (
    <main className="legale">
      <Link href="/" className="legale-retour">← Retour à la boutique</Link>
      <h1>Conditions générales de vente</h1>
      <p className="legale-maj">Dernière mise à jour&nbsp;: juillet 2026</p>

      <h2>1. Vendeur</h2>
      <p>
        {ENTREPRISE.nom}, {ENTREPRISE.forme} — SIREN {ENTREPRISE.siren},
        RCS {ENTREPRISE.rcs}, {ENTREPRISE.adresse}. Contact&nbsp;:{" "}
        <a href={`mailto:${ENTREPRISE.email}`}>{ENTREPRISE.email}</a>.
      </p>

      <h2>2. Produit</h2>
      <p>
        «&nbsp;Deux comme nous&nbsp;» est un livre pour enfants{" "}
        <strong>personnalisé</strong>, fabriqué à la demande selon les choix du
        client (personnages et prénoms des deux enfants)&nbsp;: livre relié
        20×20&nbsp;cm, couverture rigide, 30 pages. Les illustrations
        présentées sur le site sont des exemples&nbsp;; chaque exemplaire est
        produit puis vérifié individuellement, de légères variations peuvent
        exister d&apos;un exemplaire à l&apos;autre.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros. TVA non applicable, article
        293&nbsp;B du Code général des impôts (franchise en base de TVA).
        Frais de livraison suivie&nbsp;: 4,99&nbsp;€, affichés avant paiement.
        Le prix total (livre + livraison) est récapitulé sur la page de
        paiement avant validation.
      </p>

      <h2>4. Commande et paiement</h2>
      <p>
        La commande s&apos;effectue sur le site&nbsp;: choix des personnages et
        des prénoms, puis paiement sécurisé par carte bancaire via Stripe. La
        commande est ferme dès la confirmation du paiement&nbsp;; un e-mail de
        confirmation est envoyé au client. Le vendeur se réserve le droit de
        refuser toute personnalisation contraire à la loi ou aux bonnes mœurs.
      </p>
      <p>
        <strong>Édition sur mesure (photos)</strong>&nbsp;: en transmettant une
        photo, le client certifie être majeur et disposer des autorisations
        nécessaires (autorité parentale ou accord des représentants légaux des
        enfants) pour son utilisation aux fins de création du livre. Cette
        certification est enregistrée avec la commande.
      </p>

      <h2>5. Fabrication et livraison</h2>
      <p>
        Chaque livre est fabriqué à la demande. Lorsque la combinaison de
        personnages est créée pour la première fois, les illustrations sont
        vérifiées une à une avant impression (1 à 2 jours ouvrés
        supplémentaires). Le délai indicatif total est d&apos;environ une
        semaine entre la commande et la réception. La livraison est assurée en
        France métropolitaine, Belgique, Luxembourg, Suisse, Monaco, Andorre et
        dans les autres pays proposés au moment du paiement.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 3° du Code de la consommation, le
        droit de rétractation de 14 jours <strong>ne s&apos;applique pas</strong>{" "}
        aux biens confectionnés selon les spécifications du consommateur ou
        nettement personnalisés, ce qui est le cas du livre «&nbsp;Deux comme
        nous&nbsp;» (prénoms et personnages choisis par le client). Le client
        en est informé avant la validation de sa commande.
      </p>

      <h2>7. Garanties légales</h2>
      <p>
        Le client bénéficie de la garantie légale de conformité (articles
        L217-3 et suivants du Code de la consommation) et de la garantie des
        vices cachés (articles 1641 et suivants du Code civil). En cas de
        défaut (erreur d&apos;impression, exemplaire endommagé, prénoms non
        conformes à la commande), contactez{" "}
        <a href={`mailto:${ENTREPRISE.email}`}>{ENTREPRISE.email}</a> avec une
        photo du livre reçu&nbsp;: l&apos;exemplaire est réimprimé et réexpédié
        sans frais, ou remboursé.
      </p>

      <h2>8. Réclamations et médiation</h2>
      <p>
        Toute réclamation peut être adressée à{" "}
        <a href={`mailto:${ENTREPRISE.email}`}>{ENTREPRISE.email}</a>. À défaut
        de résolution amiable, le client peut recourir gratuitement à un
        médiateur de la consommation&nbsp;: les coordonnées du médiateur
        désigné sont communiquées sur demande. Plateforme européenne de
        règlement en ligne des litiges&nbsp;:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          rel="noopener noreferrer"
          target="_blank"
        >
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>10. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de
        litige, et après tentative de résolution amiable, les tribunaux
        français sont compétents.
      </p>
    </main>
  );
}
