"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApercuCombo } from "@/lib/apercus";
import { TEXTES_PAGES } from "@/lib/textes-livre";

/** Injecte les prénoms dans un texte du livre. */
function texteAvecPrenoms(gabarit: string, p1: string, p2: string): string[] {
  return gabarit
    .replaceAll("{prenom1}", p1)
    .replaceAll("{prenom2}", p2)
    .split("\n");
}

/**
 * Visionneuse « vraies pages, vos prénoms » : les illustrations sont celles
 * d'un exemplaire réellement produit ; le texte est re-rendu avec les prénoms
 * du visiteur dans la police du livre (Andika), posé sous l'image dans un
 * bandeau blanc à courbe douce.
 */
export default function ApercuLivre({
  apercu,
  prenom1,
  prenom2,
  onClose,
}: {
  apercu: ApercuCombo;
  prenom1: string;
  prenom2: string;
  onClose: () => void;
}) {
  // Diapo 0 = couverture, puis les pages.
  const [idx, setIdx] = useState(0);
  const total = apercu.pages.length + 1;
  const precedent = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const suivant = useCallback(() => setIdx((i) => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") precedent();
      if (e.key === "ArrowRight") suivant();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, precedent, suivant]);

  const estCouv = idx === 0;
  const numPage = estCouv ? null : apercu.pages[idx - 1];
  const lignes = numPage
    ? texteAvecPrenoms(TEXTES_PAGES[numPage] ?? "", prenom1, prenom2)
    : [];

  return (
    <div className="al-fond" onClick={onClose} role="dialog" aria-modal="true">
      <div className="al-cadre" onClick={(e) => e.stopPropagation()}>
        <button className="al-fermer" onClick={onClose} aria-label="Fermer">
          ×
        </button>
        <div className="al-page">
          {estCouv ? (
            <div className="al-couv">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${apercu.dossier}/couverture.jpg`} alt="" className="al-couv-img" />
              <div className="al-couv-texte">
                <span className="al-couv-titre">Deux comme&nbsp;nous</span>
                <span className="al-couv-prenoms">
                  {prenom1} &amp; {prenom2}
                </span>
              </div>
            </div>
          ) : (
            <div className="al-feuille">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${apercu.dossier}/page-${numPage}.jpg`} alt="" />
              <div className="al-bandeau">
                <svg
                  className="al-courbe"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M0 8 L0 5 Q 18 0 45 2.6 Q 75 5.4 100 1.6 L100 8 Z" fill="#ffffff" />
                </svg>
                <div className="al-texte">
                  {lignes.map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="al-controles">
          <button onClick={precedent} disabled={idx === 0} aria-label="Page précédente">
            ‹
          </button>
          <span>
            {estCouv ? "Couverture" : `Page ${numPage}`} · {idx + 1}/{total}
          </span>
          <button onClick={suivant} disabled={idx === total - 1} aria-label="Page suivante">
            ›
          </button>
        </div>
        <p className="al-note">
          Vraies pages d&apos;un exemplaire imprimé, avec vos prénoms. Votre
          livre est vérifié page à page avant impression.
        </p>
      </div>
    </div>
  );
}
