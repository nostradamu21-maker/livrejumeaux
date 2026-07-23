import type { Metadata } from "next";
import Link from "next/link";
import { ENTREPRISE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: true, follow: true },
};

export default function Confidentialite() {
  return (
    <main className="legale">
      <Link href="/" className="legale-retour">← Retour à la boutique</Link>
      <h1>Politique de confidentialité</h1>
      <p className="legale-maj">Dernière mise à jour&nbsp;: juillet 2026</p>

      <h2>Responsable du traitement</h2>
      <p>
        {ENTREPRISE.nom}, {ENTREPRISE.adresse} —{" "}
        <a href={`mailto:${ENTREPRISE.email}`}>{ENTREPRISE.email}</a>.
      </p>

      <h2>Données collectées et finalités</h2>
      <ul>
        <li>
          <strong>Prénoms des enfants</strong>&nbsp;: uniquement pour
          personnaliser le livre commandé.
        </li>
        <li>
          <strong>E-mail</strong>&nbsp;: confirmation et suivi de commande.
        </li>
        <li>
          <strong>Nom et adresse de livraison</strong> (saisis sur la page de
          paiement)&nbsp;: expédition du livre.
        </li>
        <li>
          <strong>Paiement</strong>&nbsp;: traité par Stripe&nbsp;; aucun
          numéro de carte n&apos;est reçu ni conservé par nous.
        </li>
        <li>
          <strong>Photo (édition sur mesure uniquement)</strong>&nbsp;:
          utilisée pour dessiner les personnages, puis{" "}
          <strong>supprimée dès la génération du livre</strong>. Le personnage
          dessiné est lui aussi supprimé après impression, sauf si vous avez
          accepté l&apos;option de réutilisation (remise de 15&nbsp;€), auquel
          cas seul le personnage illustré (jamais la photo) est conservé.
        </li>
      </ul>
      <p>
        Base légale&nbsp;: exécution du contrat de vente (article 6.1.b du
        RGPD). Aucune donnée n&apos;est vendue ni utilisée à des fins
        publicitaires. Pas de prospection sans votre accord.
      </p>

      <h2>Destinataires et sous-traitants</h2>
      <ul>
        <li>Stripe (paiement sécurisé)</li>
        <li>Supabase (base de données des commandes)</li>
        <li>Vercel (hébergement du site)</li>
        <li>Resend (envoi des e-mails de commande)</li>
        <li>Gelato (impression et expédition — reçoit le fichier du livre et l&apos;adresse de livraison)</li>
      </ul>

      <h2>Durées de conservation</h2>
      <p>
        Données de commande&nbsp;: 10 ans (obligations comptables). Photos du
        sur-mesure&nbsp;: supprimées dès la génération du livre. E-mails de
        contact&nbsp;: le temps du traitement de la demande.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez des droits d&apos;accès, de rectification,
        d&apos;effacement, de limitation, d&apos;opposition et de portabilité
        sur vos données. Pour les exercer&nbsp;:{" "}
        <a href={`mailto:${ENTREPRISE.email}`}>{ENTREPRISE.email}</a>. Vous
        pouvez également saisir la CNIL (
        <a href="https://www.cnil.fr" rel="noopener noreferrer" target="_blank">
          cnil.fr
        </a>
        ).
      </p>

      <h2>Cookies</h2>
      <p>
        Le site ne dépose pas de cookies publicitaires. Seuls des cookies
        techniques strictement nécessaires peuvent être utilisés lors du
        paiement (Stripe) — ils ne requièrent pas de consentement.
      </p>

      <p>
        Voir aussi&nbsp;: <Link href="/mentions-legales">mentions légales</Link>{" "}
        · <Link href="/cgv">CGV</Link>.
      </p>
    </main>
  );
}
