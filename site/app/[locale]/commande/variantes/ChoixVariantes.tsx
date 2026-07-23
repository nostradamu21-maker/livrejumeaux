"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

interface Etat {
  ok: boolean;
  actif?: boolean;
  monozygote?: boolean;
  prenoms?: [string, string];
  nEnfants?: number;
  libelles?: string[];
  variantes?: Record<string, string[]>; // URLs signées (affichage)
  chemins?: Record<string, string[]>; // chemins bucket (renvoyés au choix)
  choix?: Record<string, string>;
  erreur?: string;
}

export default function ChoixVariantes({ l }: { l: Locale }) {
  const d = t(l);
  const sessionId = useSearchParams().get("session_id") ?? "";
  const [etat, setEtat] = useState<Etat | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [valide, setValide] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/sur-mesure/variantes?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d: Etat) => {
        setEtat(d);
        if (d.ok && d.choix && Object.keys(d.choix).length) setValide(true);
      })
      .catch(() => setEtat({ ok: false, erreur: t(l).config.stServeur }));
  }, [sessionId]);

  // Lance la génération des variantes manquantes, enfant par enfant.
  useEffect(() => {
    if (!etat?.ok || !etat.actif || valide) return;
    const n = etat.nEnfants ?? 1;
    const manquant = Array.from({ length: n }, (_, i) => i + 1).find(
      (e) => !(etat.variantes?.[String(e)]?.length),
    );
    if (!manquant || enCours !== null) return;
    setEnCours(manquant);
    fetch("/api/sur-mesure/variantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, action: "generer", enfant: manquant }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.urls) {
          setEtat((e) =>
            e
              ? {
                  ...e,
                  variantes: { ...(e.variantes ?? {}), [String(manquant)]: d.urls },
                  chemins: { ...(e.chemins ?? {}), [String(manquant)]: d.chemins ?? [] },
                }
              : e,
          );
        } else if (d.repli) {
          setEtat((e) => (e ? { ...e, actif: false } : e));
        } else {
          setErreur(d.erreur || t(l).config.stErreur);
        }
      })
      .catch(() => setErreur(t(l).config.stServeur))
      .finally(() => setEnCours(null));
  }, [etat, enCours, sessionId, valide]);

  async function validerChoix() {
    setErreur("");
    // On envoie les CHEMINS retenus (source de vérité, sans dépendre de la
    // relecture DB) + les index en repli.
    const cheminsChoisis: Record<string, string> = {};
    for (const [enfant, idx] of Object.entries(selection)) {
      const c = etat?.chemins?.[enfant]?.[idx];
      if (c) cheminsChoisis[enfant] = c;
    }
    const r = await fetch("/api/sur-mesure/variantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        action: "choix",
        choix: selection,
        chemins: cheminsChoisis,
      }),
    }).then((x) => x.json()).catch(() => ({ ok: false }));
    if (r.ok) setValide(true);
    else setErreur(r.erreur || t(l).config.stErreur);
  }

  if (!sessionId) return <main className="variantes"><p>{d.variantes.lienInvalide}</p></main>;
  if (!etat) return <main className="variantes"><p className="v-attente">{d.variantes.chargement}</p></main>;
  if (!etat.ok) return <main className="variantes"><p>{etat.erreur ?? d.variantes.introuvable}</p></main>;

  const n = etat.nEnfants ?? 1;
  const [p1, p2] = etat.prenoms ?? ["", ""];
  const tousChoisis =
    Array.from({ length: n }, (_, i) => i + 1).every((e) => selection[String(e)] !== undefined);

  if (valide) {
    return (
      <main className="variantes">
        <h1>{d.variantes.merci}</h1>
        <p className="v-intro">{d.variantes.merciMsg(p1, p2)}</p>
      </main>
    );
  }

  if (etat.actif === false) {
    return (
      <main className="variantes">
        <h1>{d.variantes.photosRecues}</h1>
        <p className="v-intro">{d.variantes.photosRecuesMsg(p1, p2)}</p>
      </main>
    );
  }

  return (
    <main className="variantes">
      <h1>{d.variantes.titre}</h1>
      <p className="v-intro">{n === 1 ? d.variantes.intro1 : d.variantes.introN}</p>
      {Array.from({ length: n }, (_, i) => i + 1).map((enfant) => {
        const urls = etat.variantes?.[String(enfant)] ?? [];
        const titre =
          etat.libelles?.[enfant - 1] ??
          `${d.variantes.persoDe} ${etat.monozygote ? `${p1} & ${p2}` : enfant === 1 ? p1 : p2}`;
        return (
          <section key={enfant} className="v-groupe">
            <h2>{titre}</h2>
            {urls.length ? (
              <div className="v-grille">
                {urls.map((u, idx) => (
                  <button
                    key={u}
                    type="button"
                    className={`v-carte${selection[String(enfant)] === idx ? " actif" : ""}`}
                    onClick={() => setSelection((s) => ({ ...s, [String(enfant)]: idx }))}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`${d.variantes.proposition} ${idx + 1}`} />
                    <span>{d.variantes.proposition} {idx + 1}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="v-attente">{d.variantes.attente}</p>
            )}
          </section>
        );
      })}
      <button
        type="button"
        className="btn btn-primary v-valider"
        disabled={!tousChoisis}
        onClick={validerChoix}
      >
        {d.variantes.valider}
      </button>
      {erreur && <p className="statut erreur">{erreur}</p>}
    </main>
  );
}
