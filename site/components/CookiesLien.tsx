"use client";

import { EVENEMENT_COOKIES } from "@/components/FacebookPixel";

// Lien « Cookies » du pied de page : rouvre le bandeau de consentement pour
// permettre de retirer (ou donner) son accord aussi facilement qu'au départ.
export default function CookiesLien({ libelle }: { libelle: string }) {
  return (
    <button
      type="button"
      className="pied-cookies"
      onClick={() => window.dispatchEvent(new Event(EVENEMENT_COOKIES))}
    >
      {libelle}
    </button>
  );
}
