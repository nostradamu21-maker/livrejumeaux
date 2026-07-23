"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Locale } from "@/lib/i18n";

// Couverture d'abord, puis un choix de pages intérieures (exemplaire réel).
const FLIP_IMAGES = [
  "/apercus/test-filles/couverture.jpg",
  "/apercus/test-filles/page-01.jpg",
  "/apercus/test-filles/page-02.jpg",
  "/apercus/test-filles/page-05.jpg",
  "/apercus/test-filles/page-08.jpg",
  "/apercus/test-filles/page-11.jpg",
  "/apercus/test-filles/page-14.jpg",
  "/apercus/test-filles/page-17.jpg",
  "/apercus/test-filles/page-20.jpg",
  "/apercus/test-filles/page-27.jpg",
];

// Regroupe les images en feuilles (recto/verso).
const LEAVES: [string, string | null][] = [];
for (let i = 0; i < FLIP_IMAGES.length; i += 2) {
  LEAVES.push([FLIP_IMAGES[i], FLIP_IMAGES[i + 1] ?? null]);
}
const N = LEAVES.length;
const MAX = Math.max(0, N - 1); // la dernière feuille garde une page à droite

export default function Flipbook({ l }: { l: Locale }) {
  const d = t(l);
  const [turned, setTurned] = useState(0);
  const [prenom, setPrenom] = useState(0);
  const [swap, setSwap] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  // Défilé de prénoms pour montrer la personnalisation.
  useEffect(() => {
    const id = setInterval(() => {
      setSwap(true);
      setTimeout(() => {
        setPrenom((p) => (p + 1) % d.flip.prenoms.length);
        setSwap(false);
      }, 350);
    }, 2200);
    return () => clearInterval(id);
  }, [d.flip.prenoms.length]);

  const suivant = () => setTurned((x) => Math.min(x + 1, MAX));
  const precedent = () => setTurned((x) => Math.max(x - 1, 0));

  const clicLivre = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = bookRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (e.clientX - rect.left > rect.width / 2) suivant();
    else precedent();
  };

  const [a, b] = d.flip.prenoms[prenom];

  return (
    <section id="livre" className="livre-flip">
      <div className="section-tete">
        <h2>{d.flip.h2}</h2>
        <p className="section-sub">{d.flip.sub}</p>
      </div>

      <div className="fb">
        <div className="fb-book" ref={bookRef} onClick={clicLivre}>
          {LEAVES.map(([front, back], k) => {
            const estTourne = k < turned;
            return (
              <div
                key={k}
                className={`fb-leaf${estTourne ? " turned" : ""}`}
                style={{ zIndex: estTourne ? k + 1 : N - k }}
              >
                <div className={`fb-face fb-front${k === 0 ? " is-cover" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={front} alt="" />
                </div>
                <div className="fb-face fb-back">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {back && <img src={back} alt="" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fb-controls">
        <button
          className="fb-btn"
          onClick={precedent}
          disabled={turned === 0}
          aria-label={d.visionneuse.precedente}
        >
          ‹
        </button>
        <span className="fb-hint">
          {turned === 0 ? d.flip.hintClic : `${d.flip.page} ${turned * 2}`}
        </span>
        <button
          className="fb-btn"
          onClick={suivant}
          disabled={turned >= MAX}
          aria-label={d.visionneuse.suivante}
        >
          ›
        </button>
      </div>

      <p className="fb-perso">
        {d.flip.exA} <b>Elia</b> &amp; <b>Luna</b>. {d.flip.exB}{" "}
        <span className="perso-noms">
          <span className={`perso-a${swap ? " perso-swap" : ""}`}>{a}</span> &amp;{" "}
          <span className={`perso-b${swap ? " perso-swap" : ""}`}>{b}</span>
        </span>
        . {d.flip.exC}
      </p>
    </section>
  );
}
