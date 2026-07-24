"use client";

import { useMemo, useState } from "react";
import type { ArchetypePublic } from "@/lib/types";
import { ACCESSOIRES, ACCESSOIRE_DEFAUT } from "@/lib/accessoires";
import { comboId } from "@/lib/combo";
import { apercuPourCombo } from "@/lib/apercus";
import { t, type Locale } from "@/lib/i18n";
import ApercuLivre from "@/components/ApercuLivre";


type Choix = { 1: string | null; 2: string | null };
type Prenoms = { 1: string; 2: string };

export default function Configurateur({
  archetypes,
  l,
}: {
  archetypes: ArchetypePublic[];
  l: Locale;
}) {
  const d = t(l);
  const [choix, setChoix] = useState<Choix>({ 1: null, 2: null });
  const [prenoms, setPrenoms] = useState<Prenoms>({ 1: "", 2: "" });
  const [filtre, setFiltre] = useState<"tous" | "garçon" | "fille">("tous");
  const [email, setEmail] = useState("");
  const [accessoire, setAccessoire] = useState<string>(ACCESSOIRE_DEFAUT);
  const [statut, setStatut] = useState<{ txt: string; cls: string }>({ txt: "", cls: "" });
  const [envoi, setEnvoi] = useState(false);

  const parId = useMemo(
    () => new Map(archetypes.map((a) => [a.id, a])),
    [archetypes],
  );
  const fiche = (id: string | null) => (id ? parId.get(id) : undefined);

  const visibles = archetypes.filter(
    (a) => filtre === "tous" || a.genre === filtre,
  );

  const memeArchetype = !!choix[1] && choix[1] === choix[2];
  const pret = !!(choix[1] && choix[2] && prenoms[1] && prenoms[2]);

  // Vraies pages disponibles pour cette paire (combo déjà produite) ?
  const [apercuOuvert, setApercuOuvert] = useState(false);
  const apercuDispo =
    choix[1] && choix[2]
      ? apercuPourCombo(comboId(choix[1], choix[2], memeArchetype ? accessoire : null))
      : undefined;

  const texteCouv = (() => {
    if (prenoms[1] && prenoms[2]) return `${prenoms[1]} & ${prenoms[2]}`;
    if (prenoms[1] || prenoms[2]) return prenoms[1] || prenoms[2];
    return choix[1] && choix[2] ? d.config.couvAjouter : d.config.couvChoisir;
  })();

  async function commander(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setStatut({ txt: d.config.stTraitement, cls: "" });
    try {
      const r = await fetch("/api/commander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype1: choix[1],
          archetype2: choix[2],
          prenom1: prenoms[1],
          prenom2: prenoms[2],
          email: email.trim(),
          accessoire: memeArchetype ? accessoire : null,
          langue: l,
        }),
      });
      const data = await r.json();
      if (data.ok && data.url) {
        setStatut({ txt: d.config.stRedirection, cls: "ok" });
        window.location.href = data.url;
        return;
      }
      if (data.ok) {
        setStatut({ txt: data.message, cls: "ok" });
      } else {
        setStatut({ txt: data.erreur || d.config.stErreur, cls: "erreur" });
        setEnvoi(false);
      }
    } catch {
      setStatut({ txt: d.config.stServeur, cls: "erreur" });
      setEnvoi(false);
    }
  }

  const grille = (jumeau: 1 | 2) => (
    <div className="grille">
      {visibles.map((a) => {
        const actif = choix[jumeau] === a.id;
        return (
          <div
            key={a.id}
            className={`carte${a.disponible ? "" : " indispo"}${actif ? " actif" : ""}`}
            onClick={() => a.disponible && setChoix((c) => ({ ...c, [jumeau]: a.id }))}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.fiche} alt={a.label} loading="lazy" />
            <div className="legende">{a.label}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section id="creer" className="creer">
      <div className="section-tete">
        <span className="config-eyebrow">{d.config.eyebrow}</span>
        <h2>{d.config.h2}</h2>
        <p className="section-sub">{d.config.sub}</p>
        <p className="note-catalogue">{d.config.noteCatalogue}</p>
      </div>

      <div className="configurateur">
        <div className="choix">
          <div className="filtres">
            <span>{d.config.afficher}</span>
            {([
              ["tous", d.config.filtreTous],
              ["garçon", d.config.filtreGarcons],
              ["fille", d.config.filtreFilles],
            ] as const).map(([g, label]) => (
              <button
                key={g}
                className={`filtre${filtre === g ? " actif" : ""}`}
                onClick={() => setFiltre(g)}
              >
                {label}
              </button>
            ))}
          </div>

          {([1, 2] as const).map((j) => (
            <div className="jumeau" key={j}>
              <div className="jumeau-tete">
                <span className="pastille">{j}</span>
                <label>
                  {j === 1 ? d.config.premier : d.config.second}
                  <input
                    type="text"
                    className="prenom"
                    maxLength={18}
                    placeholder={d.config.phPrenom}
                    autoComplete="off"
                    value={prenoms[j]}
                    onChange={(e) =>
                      setPrenoms((p) => ({ ...p, [j]: e.target.value.trim() }))
                    }
                  />
                </label>
              </div>
              {grille(j)}
            </div>
          ))}
        </div>

        <aside className="apercu">
          <div className="book book-preview">
            <div className="book-cover">
              <div className="couv-titre">Deux comme&nbsp;nous</div>
              <div className="couv-fiches">
                {([1, 2] as const).map((j) => {
                  const a = fiche(choix[j]);
                  return (
                    <div className="couv-fiche" key={j}>
                      {a ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.fiche} alt="" />
                      ) : (
                        <span className="vide">{d.config.enfant} {j}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="couv-prenoms">{texteCouv}</div>
            </div>
          </div>
          <p className="note-apercu">
            {d.config.noteApercu}
            {d.config.noteLangue && <> {d.config.noteLangue}</>}
          </p>
          {apercuDispo && (
            <button
              type="button"
              className="btn-apercu"
              disabled={!prenoms[1] || !prenoms[2]}
              onClick={() => setApercuOuvert(true)}
            >
              {d.config.btnApercu}
              {(!prenoms[1] || !prenoms[2]) && <small>{d.config.btnApercuHint}</small>}
            </button>
          )}
          {apercuOuvert && apercuDispo && (
            <ApercuLivre
              apercu={apercuDispo}
              prenom1={prenoms[1]}
              prenom2={prenoms[2]}
              l={l}
              onClose={() => setApercuOuvert(false)}
            />
          )}

          {memeArchetype && (
            <div className="distinctif">
              <p className="distinctif-tete">{d.config.distinctifTete}</p>
              <div className="distinctif-choix">
                {ACCESSOIRES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`acc${accessoire === a.id ? " actif" : ""}`}
                    onClick={() => setAccessoire(a.id)}
                    aria-pressed={accessoire === a.id}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="acc-img"
                      src={`/accessoires/${a.id}.png`}
                      alt=""
                      loading="lazy"
                    />
                    <span className="acc-label">{d.accessoires[a.id] ?? a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="commande" onSubmit={commander}>
            <div className="prix-ligne">
              <span className="prix">{d.config.prixLivre}</span>
              <span className="prix-note">{d.config.prixNote}</span>
            </div>
            <input
              type="email"
              className="champ-email"
              placeholder={d.config.phEmail}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-commander" disabled={!pret || envoi}>
              {d.config.cta}
            </button>
            <p className="mention-cgv">
              {d.config.mentionCgv} — <a href="/cgv">{d.config.cgv}</a>
            </p>
            <p className={`statut ${statut.cls}`}>{statut.txt}</p>
          </form>
        </aside>
      </div>
    </section>
  );
}
