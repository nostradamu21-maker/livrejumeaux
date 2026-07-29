"use client";

import { useState } from "react";
import Configurateur from "@/components/Configurateur";
import SurMesure from "@/components/SurMesure";
import type { ArchetypePublic } from "@/lib/types";
import { t, type Locale } from "@/lib/i18n";

// Tunnel de la page /livre : même pattern que /affiche — UN sélecteur en haut
// (photo / catalogue) et le formulaire correspondant s'affiche sur place.
// Les deux restent montés (display) pour conserver les saisies.
export default function LivreTunnel({
  archetypes,
  l,
}: {
  archetypes: ArchetypePublic[];
  l: Locale;
}) {
  const d = t(l);
  const [mode, setMode] = useState<"photo" | "catalogue">("photo");
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
          <small>{d.affiche.tabPhotoSubLivre}</small>
        </button>
        <button
          type="button"
          className={`sm-zy${mode === "catalogue" ? " actif" : ""}`}
          onClick={() => setMode("catalogue")}
          aria-pressed={mode === "catalogue"}
        >
          {d.affiche.tabCatalogue}
          <small>{d.affiche.tabCatalogueSubLivre}</small>
        </button>
      </div>
      <div style={{ display: mode === "photo" ? undefined : "none" }}>
        <SurMesure l={l} />
      </div>
      <div style={{ display: mode === "catalogue" ? undefined : "none" }}>
        <Configurateur archetypes={archetypes} l={l} />
      </div>
    </div>
  );
}
