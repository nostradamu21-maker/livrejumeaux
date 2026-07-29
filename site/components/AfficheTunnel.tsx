"use client";

import { useEffect, useState } from "react";
import Affiche from "@/components/Affiche";
import SurMesure from "@/components/SurMesure";
import type { ArchetypePublic } from "@/lib/types";
import { t, type Locale } from "@/lib/i18n";

// Tunnel de la page /affiche : UN sélecteur en haut (photo / catalogue) et le
// formulaire correspondant s'affiche sur place — pas de renvoi en bas de page.
// Les deux formulaires restent montés (display) pour conserver les saisies.
export default function AfficheTunnel({
  archetypes,
  l,
}: {
  archetypes: ArchetypePublic[];
  l: Locale;
}) {
  const d = t(l);
  const [mode, setMode] = useState<"photo" | "catalogue">("photo");
  // Un lien ?sm=<ref> (upsell après commande) arrive pour le mode catalogue,
  // qui sait reprendre les personnages sur mesure du client.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sm")) {
      setMode("catalogue");
    }
  }, []);
  return (
    <div className="tunnel">
      <div id="tunnel-haut" className="tunnel-tabs sm-produits" role="radiogroup">
        <button
          type="button"
          className={`sm-zy${mode === "photo" ? " actif" : ""}`}
          onClick={() => setMode("photo")}
          aria-pressed={mode === "photo"}
        >
          {d.affiche.tabPhoto}
          <small>{d.affiche.tabPhotoSub}</small>
        </button>
        <button
          type="button"
          className={`sm-zy${mode === "catalogue" ? " actif" : ""}`}
          onClick={() => setMode("catalogue")}
          aria-pressed={mode === "catalogue"}
        >
          {d.affiche.tabCatalogue}
          <small>{d.affiche.tabCatalogueSub}</small>
        </button>
      </div>
      <div style={{ display: mode === "photo" ? undefined : "none" }}>
        <SurMesure l={l} produitInitial="affiche" />
      </div>
      <div style={{ display: mode === "catalogue" ? undefined : "none" }}>
        <Affiche archetypes={archetypes} l={l} masquerSmCta />
      </div>
    </div>
  );
}
