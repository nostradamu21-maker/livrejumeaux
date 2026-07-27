"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";

// Tri web MOBILE : pour chaque unité (référence, couverture, page), Simon tape
// sur sa variante préférée, ou « À refaire » pour regénérer. Les choix
// s'enregistrent à chaque tape ; le pipeline les rapatrie (tri_web.py).

type Variante = { chemin: string; url: string };
type Unite = { unite: string; variantes: Variante[] };

function libelle(unite: string): string {
  if (unite === "couv") return "Couverture";
  if (unite.startsWith("ref-")) return `Personnage ${unite.slice(4)}`;
  return `Page ${unite}`;
}

export default function TriPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cle = useMemo(
    () =>
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("cle") ?? ""
        : "",
    [],
  );
  const [unites, setUnites] = useState<Unite[] | null>(null);
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState("");
  const [enregistre, setEnregistre] = useState(true);

  useEffect(() => {
    if (!cle) {
      setErreur("Lien invalide : clé manquante.");
      return;
    }
    fetch(`/api/tri?id=${encodeURIComponent(id)}&cle=${encodeURIComponent(cle)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setErreur(d.erreur === "non autorisé" ? "Lien invalide." : `Erreur : ${d.erreur}`);
          return;
        }
        setUnites(d.unites);
        setChoix(d.choix ?? {});
        setNotes(d.notes ?? {});
      })
      .catch(() => setErreur("Serveur injoignable."));
  }, [id, cle]);

  const enregistrer = useCallback(
    async (nouveaux: Record<string, string>, nouvellesNotes: Record<string, string>) => {
      setEnregistre(false);
      try {
        const r = await fetch(`/api/tri?cle=${encodeURIComponent(cle)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, choix: nouveaux, notes: nouvellesNotes }),
        });
        const d = await r.json();
        if (d.ok) setEnregistre(true);
      } catch {
        /* le prochain tap retentera */
      }
    },
    [id, cle],
  );

  function choisir(unite: string, v: string) {
    const nouveaux = { ...choix, [unite]: choix[unite] === v ? "" : v };
    if (!nouveaux[unite]) delete nouveaux[unite];
    setChoix(nouveaux);
    void enregistrer(nouveaux, notes);
  }

  function noter(unite: string, texte: string) {
    setNotes((n) => ({ ...n, [unite]: texte }));
  }

  if (erreur) {
    return (
      <main className="tri-ecran">
        <div className="tri-carte-msg">⚠ {erreur}</div>
      </main>
    );
  }
  if (!unites) {
    return (
      <main className="tri-ecran">
        <div className="tri-carte-msg">Chargement…</div>
      </main>
    );
  }

  const faits = unites.filter((u) => choix[u.unite]).length;
  const fini = faits === unites.length;

  return (
    <main className="tri-ecran">
      <header className="tri-tete">
        <strong>{id}</strong>
        <span className={fini ? "tri-ok" : ""}>
          {faits}/{unites.length} {enregistre ? "" : "· enregistrement…"}
        </span>
      </header>
      {fini && (
        <div className="tri-fini">
          ✅ Tri terminé et enregistré. Le pipeline peut continuer
          (<code>python tri_web.py {id} --rapatrier</code>).
        </div>
      )}
      {unites.map((u) => (
        <section key={u.unite} className="tri-unite">
          <h2>
            {libelle(u.unite)}
            {choix[u.unite] === "regen" && <em> · à refaire 🔁</em>}
          </h2>
          <div className="tri-variantes">
            {u.variantes.map((v, i) => {
              const vid = `v${i + 1}`;
              const actif = choix[u.unite] === vid;
              return (
                <button
                  key={v.chemin}
                  type="button"
                  className={`tri-choix${actif ? " actif" : ""}`}
                  onClick={() => choisir(u.unite, vid)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.url} alt={`${libelle(u.unite)} ${vid}`} loading="lazy" />
                  {actif && <span className="tri-coche">✓</span>}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`tri-regen${choix[u.unite] === "regen" ? " actif" : ""}`}
            onClick={() => choisir(u.unite, "regen")}
          >
            🔁 Aucune ne va, à refaire
          </button>
          {choix[u.unite] === "regen" && (
            <textarea
              className="tri-note"
              rows={2}
              maxLength={300}
              placeholder="Qu'est-ce qu'il faut corriger ? (optionnel) ex. : le doudou doit être dans sa main, pas dans le dos"
              value={notes[u.unite] ?? ""}
              onChange={(e) => noter(u.unite, e.target.value)}
              onBlur={() => enregistrer(choix, notes)}
            />
          )}
        </section>
      ))}
      <footer className="tri-pied">
        Choix enregistrés automatiquement à chaque tape.
      </footer>
    </main>
  );
}
