"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArchetypePublic } from "@/lib/types";
import { t, type Locale } from "@/lib/i18n";

const TAILLES = ["21x30", "30x40", "40x50", "50x70"] as const;

// Produit AFFICHE : poster des deux jumeaux (illustration dédiée générée à
// la première commande de la paire, puis mise en cache), livré roulé.
export default function Affiche({
  archetypes,
  l,
  masquerSmCta = false,
}: {
  archetypes: ArchetypePublic[];
  l: Locale;
  // Dans le tunnel /affiche, le sur-mesure a son propre onglet : on masque le
  // renvoi interne vers #sur-mesure.
  masquerSmCta?: boolean;
}) {
  const d = t(l);
  const [choix, setChoix] = useState<{ 1: string; 2: string }>({ 1: "", 2: "" });
  const [prenoms, setPrenoms] = useState<{ 1: string; 2: string }>({ 1: "", 2: "" });
  const [taille, setTaille] = useState<string>("30x40");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [statut, setStatut] = useState<{ txt: string; cls: string }>({ txt: "", cls: "" });
  const [envoi, setEnvoi] = useState(false);
  // Mode SUR MESURE : ?sm=<ref> dans l'URL (upsell après une commande
  // sur-mesure) → l'affiche reprend les personnages du client, pas le catalogue.
  const [smRef, setSmRef] = useState("");
  useEffect(() => {
    const sm = new URLSearchParams(window.location.search).get("sm") ?? "";
    if (/^cs_(live|test)_[A-Za-z0-9]+$/.test(sm)) setSmRef(sm);
  }, []);
  // Exemple réel (l'affiche d'Elia & Luna) affiché tant que le visiteur n'a
  // rien choisi ; repli silencieux sur le mockup si l'image n'existe pas encore.
  const [exempleOk, setExempleOk] = useState(true);
  const montrerExemple = exempleOk && !smRef && !choix[1] && !choix[2];
  const phCode = { fr: "Code promo (facultatif)", en: "Promo code (optional)", es: "Código promocional (opcional)", de: "Rabattcode (optional)" }[l];

  const parId = useMemo(() => new Map(archetypes.map((a) => [a.id, a])), [archetypes]);
  const pret = smRef ? true : !!(choix[1] && choix[2] && prenoms[1] && prenoms[2]);

  async function commander(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setStatut({ txt: d.config.stTraitement, cls: "" });
    try {
      const r = await fetch("/api/affiche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype1: choix[1],
          archetype2: choix[2],
          sm: smRef,
          prenom1: prenoms[1],
          prenom2: prenoms[2],
          taille,
          email: email.trim(),
          langue: l,
          code: code.trim(),
        }),
      });
      const data = await r.json();
      if (data.ok && data.url) {
        setStatut({ txt: d.config.stRedirection, cls: "ok" });
        window.fbq?.("track", "InitiateCheckout");
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

  return (
    <section id="affiche" className="affiche-section">
      <div className="affiche-carte">
        <div className="affiche-visuel">
          {/* Scène murale À L'ÉCHELLE : le buffet fait 1,20 m de large, la
              scène représente 2,00 m de mur × 1,90 m de haut. L'affiche est
              accrochée au-dessus et prend sa taille RÉELLE selon le format
              choisi (bas du cadre fixe, largeur animée). Contenu : l'exemple
              réel d'Elia & Luna par défaut, sinon les fiches + prénoms. */}
          {(() => {
            const [tw, th] = taille.split("x").map(Number);
            return (
              <div className="mock-scene">
                <div className="mock-sol" />
                <svg
                  className="mock-buffet"
                  viewBox="0 0 120 102"
                  aria-hidden="true"
                >
                  {/* plante posée sur le buffet */}
                  <g stroke="rgba(74,58,48,0.3)" strokeWidth="1">
                    <ellipse cx="24" cy="12" rx="7" ry="9" fill="#8db39a" />
                    <ellipse cx="17" cy="18" rx="6" ry="7.5" fill="#7fa98d" />
                    <ellipse cx="31" cy="18" rx="6" ry="7.5" fill="#9bc0a7" />
                    <path d="M16 26 h16 l-2.5 12 h-11 z" fill="#c98d6b" />
                  </g>
                  {/* corps du buffet + pieds */}
                  <g stroke="rgba(74,58,48,0.35)" strokeWidth="1.2">
                    <rect x="2" y="38" width="116" height="50" rx="6" fill="#dcC09a" />
                    <line x1="60" y1="40" x2="60" y2="86" />
                    <circle cx="52" cy="63" r="2.2" fill="#a8846a" />
                    <circle cx="68" cy="63" r="2.2" fill="#a8846a" />
                    <rect x="12" y="88" width="7" height="12" rx="2.5" fill="#c9ab82" />
                    <rect x="101" y="88" width="7" height="12" rx="2.5" fill="#c9ab82" />
                  </g>
                </svg>
                <div
                  className="mock-cadre"
                  style={{ width: `${(tw / 200) * 100}%`, aspectRatio: `${tw} / ${th}` }}
                >
                  {montrerExemple ? (
                    <div className="affiche-passe affiche-passe-ex">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="affiche-exemple"
                        src="/apercus/test-filles/affiche.jpg"
                        alt={d.affiche.exLegende}
                        loading="lazy"
                        onError={() => setExempleOk(false)}
                      />
                      <span className="affiche-noms affiche-noms-ex">Elia & Luna</span>
                    </div>
                  ) : (
                    <div className="affiche-passe">
                      <div className="affiche-persos">
                        {([1, 2] as const).map((j) =>
                          choix[j] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={j} src={parId.get(choix[j])?.fiche} alt="" />
                          ) : (
                            <span key={j} className="affiche-vide">?</span>
                          ),
                        )}
                      </div>
                      <span className="affiche-noms">
                        {prenoms[1] || d.affiche.enfant1} & {prenoms[2] || d.affiche.enfant2}
                      </span>
                    </div>
                  )}
                  <span className="mock-dims">
                    {tw} × {th} cm
                  </span>
                </div>
              </div>
            );
          })()}
          <p className="affiche-ex-legende">
            {montrerExemple ? `${d.affiche.exLegende} ` : ""}
            {d.affiche.mockEchelle}
          </p>
        </div>
        <form className="affiche-form" onSubmit={commander}>
          <span className="sm-eyebrow">{d.affiche.eyebrow}</span>
          <h2>{d.affiche.h2}</h2>
          <p className="affiche-intro">{d.affiche.intro}</p>
          {smRef && <p className="affiche-sm-badge">{d.affiche.smBadge}</p>}
          {!smRef && !masquerSmCta && (
            <a
              href="#sur-mesure"
              className="affiche-vers-sm"
              onClick={() => window.dispatchEvent(new CustomEvent("dcn:produit-affiche"))}
            >
              <strong>{d.affiche.smCta}</strong>
              <span>{d.affiche.smSub}</span>
            </a>
          )}
          {!smRef && !masquerSmCta && (
            <p className="affiche-taille-titre">{d.affiche.ouCatalogue}</p>
          )}
          {!smRef && ([1, 2] as const).map((j) => (
            <div className="affiche-enfant" key={j}>
              <select
                value={choix[j]}
                onChange={(e) => setChoix((c) => ({ ...c, [j]: e.target.value }))}
              >
                <option value="">{j === 1 ? d.affiche.enfant1 : d.affiche.enfant2}…</option>
                {archetypes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="champ-email"
                placeholder={d.affiche.phPrenom}
                maxLength={18}
                value={prenoms[j]}
                onChange={(e) => setPrenoms((p) => ({ ...p, [j]: e.target.value.trim() }))}
              />
            </div>
          ))}
          {smRef && ([1, 2] as const).map((j) => (
            <input
              key={j}
              type="text"
              className="champ-email"
              placeholder={j === 1 ? d.affiche.enfant1 : d.affiche.enfant2}
              maxLength={18}
              value={prenoms[j]}
              onChange={(e) => setPrenoms((p) => ({ ...p, [j]: e.target.value.trim() }))}
            />
          ))}
          <p className="affiche-taille-titre">{d.affiche.tailleTitre}</p>
          <div className="affiche-tailles">
            {TAILLES.map((tl) => (
              <button
                key={tl}
                type="button"
                className={`affiche-tl${taille === tl ? " actif" : ""}`}
                onClick={() => setTaille(tl)}
                aria-pressed={taille === tl}
              >
                <strong>{tl.replace("x", "×")} cm</strong>
                <span>{d.affiche.prix[tl]}</span>
              </button>
            ))}
          </div>
          <input
            type="email"
            className="champ-email"
            placeholder={d.affiche.phEmail}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="text"
            className="champ-email champ-code"
            placeholder={phCode}
            autoComplete="off"
            maxLength={24}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" className="sm-cta" disabled={!pret || envoi}>
            {d.affiche.cta} · {d.affiche.prix[taille]}
          </button>
          <p className={`statut ${statut.cls}`}>{statut.txt}</p>
          <span className="affiche-note">{d.affiche.note}</span>
        </form>
      </div>
    </section>
  );
}
