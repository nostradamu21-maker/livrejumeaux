"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import exemples from "@/lib/exemples.json";

interface Exemple {
  id: string;
  dossier: string;
  prenoms: [string, string] | string[];
  pages: string[];
}

const EXEMPLES = exemples as Exemple[];

export default function Flipbook({ l }: { l: Locale }) {
  const d = t(l);
  const [exIdx, setExIdx] = useState(0);
  const [turned, setTurned] = useState(0);
  const [prenom, setPrenom] = useState(0);
  const [swap, setSwap] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  const ex = EXEMPLES[exIdx] ?? EXEMPLES[0];

  // Feuilles (recto/verso) construites depuis l'exemple courant.
  const { leaves, n, max } = useMemo(() => {
    const imgs = [
      `${ex.dossier}/couverture.jpg`,
      ...ex.pages.map((p) => `${ex.dossier}/page-${p}.jpg`),
    ];
    const lv: [string, string | null][] = [];
    for (let i = 0; i < imgs.length; i += 2) lv.push([imgs[i], imgs[i + 1] ?? null]);
    return { leaves: lv, n: lv.length, max: Math.max(0, lv.length - 1) };
  }, [ex]);

  // Défilé de prénoms pour montrer la personnalisation (« dans le vôtre… »).
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

  const suivant = () => setTurned((x) => Math.min(x + 1, max));
  const precedent = () => setTurned((x) => Math.max(x - 1, 0));
  const choisirExemple = (i: number) => {
    setExIdx(i);
    setTurned(0);
  };

  const clicLivre = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = bookRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (e.clientX - rect.left > rect.width / 2) suivant();
    else precedent();
  };

  const [a, b] = d.flip.prenoms[prenom];
  const [ep1, ep2] = ex.prenoms;

  return (
    <section id="livre" className="livre-flip">
      <div className="section-tete">
        <h2>{d.flip.h2}</h2>
        <p className="section-sub">{d.flip.sub}</p>
      </div>

      {EXEMPLES.length > 1 && (
        <div className="fb-exemples" role="tablist">
          {EXEMPLES.map((e, i) => (
            <button
              key={e.id}
              role="tab"
              aria-selected={i === exIdx}
              className={`fb-onglet${i === exIdx ? " actif" : ""}`}
              onClick={() => choisirExemple(i)}
            >
              {e.prenoms[0]} &amp; {e.prenoms[1]}
            </button>
          ))}
        </div>
      )}

      <div className="fb">
        <div className="fb-book" ref={bookRef} onClick={clicLivre}>
          {leaves.map(([front, back], k) => {
            const estTourne = k < turned;
            return (
              <div
                key={`${ex.id}-${k}`}
                className={`fb-leaf${estTourne ? " turned" : ""}`}
                style={{ zIndex: estTourne ? k + 1 : n - k }}
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
          disabled={turned >= max}
          aria-label={d.visionneuse.suivante}
        >
          ›
        </button>
      </div>

      <p className="fb-perso">
        {d.flip.exA} <b>{ep1}</b> &amp; <b>{ep2}</b>. {d.flip.exB}{" "}
        <span className="perso-noms">
          <span className={`perso-a${swap ? " perso-swap" : ""}`}>{a}</span> &amp;{" "}
          <span className={`perso-b${swap ? " perso-swap" : ""}`}>{b}</span>
        </span>
        . {d.flip.exC}
      </p>
    </section>
  );
}
