"use client";

import { useMemo, useState } from "react";
import type { ArchetypePublic } from "@/lib/types";
import { ACCESSOIRES, ACCESSOIRE_DEFAUT } from "@/lib/accessoires";
import { comboId } from "@/lib/combo";
import { apercuPourCombo } from "@/lib/apercus";
import ApercuLivre from "@/components/ApercuLivre";

const PRIX = "44,90\u00A0€";

type Choix = { 1: string | null; 2: string | null };
type Prenoms = { 1: string; 2: string };

export default function Configurateur({
  archetypes,
}: {
  archetypes: ArchetypePublic[];
}) {
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
    return choix[1] && choix[2] ? "Ajoutez les prénoms" : "Choisissez deux archétypes";
  })();

  async function commander(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setStatut({ txt: "Traitement…", cls: "" });
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
        }),
      });
      const data = await r.json();
      if (data.ok && data.url) {
        setStatut({ txt: "Redirection vers le paiement sécurisé…", cls: "ok" });
        window.location.href = data.url;
        return;
      }
      if (data.ok) {
        setStatut({ txt: data.message, cls: "ok" });
      } else {
        setStatut({ txt: data.erreur || "Une erreur est survenue.", cls: "erreur" });
        setEnvoi(false);
      }
    } catch {
      setStatut({ txt: "Serveur injoignable.", cls: "erreur" });
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
        <h2>Composez le livre de vos jumeaux</h2>
        <p className="section-sub">
          Choisissez un personnage pour chacun, ajoutez leurs prénoms, et voyez
          la couverture de leur livre personnalisé prendre vie.
        </p>
      </div>

      <div className="configurateur">
        <div className="choix">
          <div className="filtres">
            <span>Afficher :</span>
            {(["tous", "garçon", "fille"] as const).map((g) => (
              <button
                key={g}
                className={`filtre${filtre === g ? " actif" : ""}`}
                onClick={() => setFiltre(g)}
              >
                {g === "tous" ? "Tous" : g === "garçon" ? "Garçons" : "Filles"}
              </button>
            ))}
          </div>

          {([1, 2] as const).map((j) => (
            <div className="jumeau" key={j}>
              <div className="jumeau-tete">
                <span className="pastille">{j}</span>
                <label>
                  {j === 1 ? "Premier enfant" : "Second enfant"}
                  <input
                    type="text"
                    className="prenom"
                    maxLength={18}
                    placeholder="Son prénom"
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
                        <span className="vide">Enfant {j}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="couv-prenoms">{texteCouv}</div>
            </div>
          </div>
          <p className="note-apercu">
            Aperçu indicatif — sur la couverture imprimée, vos deux héros sont
            illustrés ensemble dans une scène complète.
          </p>
          {apercuDispo && (
            <button
              type="button"
              className="btn-apercu"
              disabled={!prenoms[1] || !prenoms[2]}
              onClick={() => setApercuOuvert(true)}
            >
              ✨ Feuilleter de vraies pages avec vos prénoms
              {(!prenoms[1] || !prenoms[2]) && (
                <small>ajoutez d&apos;abord les deux prénoms</small>
              )}
            </button>
          )}
          {apercuOuvert && apercuDispo && (
            <ApercuLivre
              apercu={apercuDispo}
              prenom1={prenoms[1]}
              prenom2={prenoms[2]}
              onClose={() => setApercuOuvert(false)}
            />
          )}

          {memeArchetype && (
            <div className="distinctif">
              <p className="distinctif-tete">
                Jumeaux monozygotes&nbsp;: choisissez un petit détail pour
                distinguer le second.
              </p>
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
                    <span className="acc-label">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="commande" onSubmit={commander}>
            <div className="prix-ligne">
              <span className="prix">{PRIX}</span>
              <span className="prix-note">+ 4,99&nbsp;€ de livraison suivie</span>
            </div>
            <input
              type="email"
              className="champ-email"
              placeholder="Votre e-mail (facultatif)"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-commander" disabled={!pret || envoi}>
              Commander notre livre
            </button>
            <p className="mention-cgv">
              Livre personnalisé&nbsp;: pas de droit de rétractation
              (art.&nbsp;L221-28) — <a href="/cgv">CGV</a>
            </p>
            <p className={`statut ${statut.cls}`}>{statut.txt}</p>
          </form>
        </aside>
      </div>
    </section>
  );
}
