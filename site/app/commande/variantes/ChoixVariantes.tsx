"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Etat {
  ok: boolean;
  actif?: boolean;
  monozygote?: boolean;
  prenoms?: [string, string];
  nEnfants?: number;
  variantes?: Record<string, string[]>;
  choix?: Record<string, string>;
  erreur?: string;
}

export default function ChoixVariantes() {
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
      .catch(() => setEtat({ ok: false, erreur: "Serveur injoignable." }));
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
              ? { ...e, variantes: { ...(e.variantes ?? {}), [String(manquant)]: d.urls } }
              : e,
          );
        } else if (d.repli) {
          setEtat((e) => (e ? { ...e, actif: false } : e));
        } else {
          setErreur(d.erreur || "La génération a échoué, réessayez dans un instant.");
        }
      })
      .catch(() => setErreur("Serveur injoignable."))
      .finally(() => setEnCours(null));
  }, [etat, enCours, sessionId, valide]);

  async function validerChoix() {
    setErreur("");
    const r = await fetch("/api/sur-mesure/variantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, action: "choix", choix: selection }),
    }).then((x) => x.json()).catch(() => ({ ok: false }));
    if (r.ok) setValide(true);
    else setErreur(r.erreur || "Impossible d'enregistrer votre choix.");
  }

  if (!sessionId) return <main className="variantes"><p>Lien invalide.</p></main>;
  if (!etat) return <main className="variantes"><p className="v-attente">Chargement…</p></main>;
  if (!etat.ok) return <main className="variantes"><p>{etat.erreur ?? "Commande introuvable."}</p></main>;

  const n = etat.nEnfants ?? 1;
  const [p1, p2] = etat.prenoms ?? ["", ""];
  const tousChoisis =
    Array.from({ length: n }, (_, i) => i + 1).every((e) => selection[String(e)] !== undefined);

  if (valide) {
    return (
      <main className="variantes">
        <h1>Merci ! 💛</h1>
        <p className="v-intro">
          Vos personnages sont choisis. Nous créons maintenant le livre de{" "}
          <strong>{p1} &amp; {p2}</strong>, vous validez les illustrations par
          e-mail, puis il part à l&apos;impression.
        </p>
      </main>
    );
  }

  if (etat.actif === false) {
    return (
      <main className="variantes">
        <h1>Vos photos sont bien reçues</h1>
        <p className="v-intro">
          Nous préparons les personnages de {p1} &amp; {p2} et vous les
          proposerons par e-mail sous 24&nbsp;h pour validation.
        </p>
      </main>
    );
  }

  return (
    <main className="variantes">
      <h1>Choisissez vos personnages</h1>
      <p className="v-intro">
        Voici les personnages dessinés d&apos;après {n === 1 ? "votre photo" : "vos photos"}.
        Choisissez votre préféré{n > 1 ? " pour chaque enfant" : ""} : il servira
        de référence pour tout le livre.
      </p>
      {Array.from({ length: n }, (_, i) => i + 1).map((enfant) => {
        const urls = etat.variantes?.[String(enfant)] ?? [];
        const nom = etat.monozygote ? `${p1} & ${p2}` : enfant === 1 ? p1 : p2;
        return (
          <section key={enfant} className="v-groupe">
            <h2>{etat.monozygote ? `Le personnage de ${nom}` : `Le personnage de ${nom}`}</h2>
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
                    <img src={u} alt={`Proposition ${idx + 1}`} />
                    <span>Proposition {idx + 1}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="v-attente">
                🎨 Nous dessinons les propositions… environ une minute, la page
                se met à jour toute seule.
              </p>
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
        Valider mon choix
      </button>
      {erreur && <p className="statut erreur">{erreur}</p>}
    </main>
  );
}
