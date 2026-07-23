"use client";

import { useEffect, useRef, useState } from "react";

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

const PRENOMS = [
  ["Léo", "Emma"],
  ["Jade", "Tom"],
  ["Noah", "Lina"],
  ["Gabin", "Rose"],
  ["Sacha", "Alix"],
  ["Maël", "Nina"],
];

// Regroupe les images en feuilles (recto/verso).
const LEAVES: [string, string | null][] = [];
for (let i = 0; i < FLIP_IMAGES.length; i += 2) {
  LEAVES.push([FLIP_IMAGES[i], FLIP_IMAGES[i + 1] ?? null]);
}
const N = LEAVES.length;
const MAX = Math.max(0, N - 1); // la dernière feuille garde une page à droite

export default function Flipbook() {
  const [turned, setTurned] = useState(0);
  const [prenom, setPrenom] = useState(0);
  const [swap, setSwap] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  // Défilé de prénoms pour montrer la personnalisation.
  useEffect(() => {
    const id = setInterval(() => {
      setSwap(true);
      setTimeout(() => {
        setPrenom((p) => (p + 1) % PRENOMS.length);
        setSwap(false);
      }, 350);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const suivant = () => setTurned((t) => Math.min(t + 1, MAX));
  const precedent = () => setTurned((t) => Math.max(t - 1, 0));

  const clicLivre = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = bookRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (e.clientX - rect.left > rect.width / 2) suivant();
    else precedent();
  };

  const [a, b] = PRENOMS[prenom];

  return (
    <section id="livre" className="livre-flip">
      <div className="section-tete">
        <h2>Feuilletez un exemplaire réel</h2>
        <p className="section-sub">
          Voici le livre personnalisé d&apos;Elia &amp; Luna&nbsp;: tournez les
          pages pour découvrir les illustrations douces à l&apos;aquarelle.
          Extrait de quelques pages, le livre complet en compte 30.
        </p>
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
          aria-label="Page précédente"
        >
          ‹
        </button>
        <span className="fb-hint">
          {turned === 0 ? "Cliquez pour tourner les pages" : `Page ${turned * 2}`}
        </span>
        <button
          className="fb-btn"
          onClick={suivant}
          disabled={turned >= MAX}
          aria-label="Page suivante"
        >
          ›
        </button>
      </div>

      <p className="fb-perso">
        Dans cet exemplaire, les héroïnes s&apos;appellent <b>Elia</b> &amp;{" "}
        <b>Luna</b>. Dans le vôtre, ce sont{" "}
        <span className="perso-noms">
          <span className={`perso-a${swap ? " perso-swap" : ""}`}>{a}</span> &amp;{" "}
          <span className={`perso-b${swap ? " perso-swap" : ""}`}>{b}</span>
        </span>
        . Vos prénoms, sur chaque page.
      </p>
    </section>
  );
}
