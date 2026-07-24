"use client";

import { useRef, useState } from "react";
import { ACCESSOIRES, ACCESSOIRE_DEFAUT } from "@/lib/accessoires";
import { t, type Locale } from "@/lib/i18n";

/** Réduit la photo côté navigateur (max 1600 px, JPEG) : upload léger. */
async function reduirePhoto(fichier: File): Promise<Blob> {
  const bitmap = await createImageBitmap(fichier);
  const MAX = 1600;
  const ratio = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  if (ratio === 1 && fichier.size < 2 * 1024 * 1024) return fichier;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("conversion"))),
      "image/jpeg",
      0.87,
    ),
  );
}

function BoutonPhoto({
  libelle,
  changer,
  apercu,
  onChoisir,
}: {
  libelle: string;
  changer: string;
  apercu: string | null;
  onChoisir: (f: File | undefined) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png"
        className="sm-fichier"
        onChange={(e) => onChoisir(e.target.files?.[0])}
      />
      <button type="button" className="sm-photo-btn" onClick={() => ref.current?.click()}>
        {apercu ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={apercu} alt="" className="sm-photo-apercu" />
            <span>{changer}</span>
          </>
        ) : (
          <span>📷 {libelle}</span>
        )}
      </button>
    </>
  );
}

export default function SurMesure({ l }: { l: Locale }) {
  const d = t(l);
  const [prenoms, setPrenoms] = useState({ 1: "", 2: "" });
  const [email, setEmail] = useState("");
  const [reutilisation, setReutilisation] = useState(false);
  const [monozygote, setMonozygote] = useState(true);
  const [accessoire, setAccessoire] = useState<string>(ACCESSOIRE_DEFAUT);
  const [relation, setRelation] = useState("parent");
  const [consentement, setConsentement] = useState(false);
  const [photos, setPhotos] = useState<{ 1: File | null; 2: File | null }>({ 1: null, 2: null });
  const [apercus, setApercus] = useState<{ 1: string | null; 2: string | null }>({ 1: null, 2: null });
  const [envoi, setEnvoi] = useState(false);
  const [statut, setStatut] = useState<{ txt: string; cls: string }>({ txt: "", cls: "" });
  // Photo réelle « avant » (Jade) si présente, sinon repli sur le cadre placeholder.
  const [photoOk, setPhotoOk] = useState(true);

  const prix = reutilisation ? d.sm.prixReduit : d.sm.prix;
  const pret = !!(
    prenoms[1] &&
    prenoms[2] &&
    photos[1] &&
    (monozygote || photos[2]) &&
    consentement
  );

  const changer = { fr: "Changer de photo", en: "Change photo", es: "Cambiar la foto", de: "Foto ändern" }[l];

  function choisirPhoto(n: 1 | 2, f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setStatut({ txt: "JPEG / PNG", cls: "erreur" });
      return;
    }
    setPhotos((p) => ({ ...p, [n]: f }));
    setApercus((a) => ({ ...a, [n]: URL.createObjectURL(f) }));
    setStatut({ txt: "", cls: "" });
  }

  async function commander(e: React.FormEvent) {
    e.preventDefault();
    if (!photos[1]) return;
    setEnvoi(true);
    setStatut({ txt: d.config.stTraitement, cls: "" });
    try {
      const form = new FormData();
      form.set("prenom1", prenoms[1]);
      form.set("prenom2", prenoms[2]);
      form.set("email", email.trim());
      form.set("reutilisation", reutilisation ? "1" : "0");
      form.set("monozygote", monozygote ? "1" : "0");
      if (monozygote) form.set("accessoire", accessoire);
      form.set("relation", relation);
      form.set("consentement", consentement ? "1" : "0");
      form.set("langue", l);
      form.set("photo1", await reduirePhoto(photos[1]), "photo1.jpg");
      if (!monozygote && photos[2]) {
        form.set("photo2", await reduirePhoto(photos[2]), "photo2.jpg");
      }
      const r = await fetch("/api/sur-mesure", { method: "POST", body: form });
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

  return (
    <section id="sur-mesure" className="sur-mesure">
      <div className="sm-carte">
        <div className="sm-texte">
          <span className="sm-eyebrow">{d.sm.eyebrow}</span>
          <h2>{d.sm.h2}</h2>
          <p>{d.sm.intro}</p>
          {/* Avant → après : cadre photo (invitation) qui devient un vrai
              personnage dessiné (Jade). Le placeholder évite d'exposer une
              photo d'enfant réelle. */}
          <div className="aa">
            <figure className={`aa-carte ${photoOk ? "aa-photo-reelle" : "aa-photo"}`}>
              {photoOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/avant-apres/jade.png"
                  alt=""
                  loading="lazy"
                  onError={() => setPhotoOk(false)}
                />
              ) : (
                <span className="aa-cam" aria-hidden="true">📷</span>
              )}
              <figcaption>{d.sm.aaPhoto}</figcaption>
            </figure>
            <span className="aa-fleche" aria-hidden="true">→</span>
            <figure className="aa-carte aa-perso">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fiches/f7-jade.png" alt="" loading="lazy" />
              <figcaption>{d.sm.aaPerso}</figcaption>
            </figure>
          </div>
          <p className="aa-legende">{d.sm.aaLegende}</p>
          <ul className="sm-points">
            {d.sm.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="sm-comment">{d.sm.comment}</p>
        </div>
        <form className="sm-offre" onSubmit={commander}>
          <span className="sm-lancement">{d.sm.lancement}</span>
          <span className="sm-prix-ligne">
            <span className="sm-prix-barre">{d.sm.prixBarre}</span>
            <span className="sm-prix">{prix}</span>
          </span>
          <span className="sm-prix-note">{d.sm.prixNote}</span>
          <input
            type="text"
            className="champ-email"
            placeholder={d.sm.phP1}
            maxLength={18}
            value={prenoms[1]}
            onChange={(e) => setPrenoms((p) => ({ ...p, 1: e.target.value.trim() }))}
          />
          <input
            type="text"
            className="champ-email"
            placeholder={d.sm.phP2}
            maxLength={18}
            value={prenoms[2]}
            onChange={(e) => setPrenoms((p) => ({ ...p, 2: e.target.value.trim() }))}
          />
          <input
            type="email"
            className="champ-email"
            placeholder={d.sm.phEmail}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="sm-zygote" role="radiogroup">
            <button
              type="button"
              className={`sm-zy${monozygote ? " actif" : ""}`}
              onClick={() => setMonozygote(true)}
            >
              {d.sm.zyIdent}
              <small>{d.sm.zyIdentSub}</small>
            </button>
            <button
              type="button"
              className={`sm-zy${!monozygote ? " actif" : ""}`}
              onClick={() => setMonozygote(false)}
            >
              {d.sm.zyDiff}
              <small>{d.sm.zyDiffSub}</small>
            </button>
          </div>
          {monozygote && (
            <div className="sm-distinctif">
              <p className="sm-distinctif-tete">
                {d.sm.distinctifAvant}{" "}
                {prenoms[2] ? <strong>{prenoms[2]}</strong> : d.sm.leSecond}{" "}
                {d.sm.distinctifApres}
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
                    <span className="acc-label">{d.accessoires[a.id] ?? a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <BoutonPhoto
            libelle={monozygote ? d.sm.photoMono : `${d.sm.photoDe} ${prenoms[1] || d.sm.premierEnfant}`}
            changer={changer}
            apercu={apercus[1]}
            onChoisir={(f) => choisirPhoto(1, f)}
          />
          {!monozygote && (
            <BoutonPhoto
              libelle={`${d.sm.photoDe} ${prenoms[2] || d.sm.secondEnfant}`}
              changer={changer}
              apercu={apercus[2]}
              onChoisir={(f) => choisirPhoto(2, f)}
            />
          )}
          <span className="sm-photo-note">{d.sm.photoNote}</span>
          <label className="sm-relation">
            <span>{d.sm.vousEtes}</span>
            <select value={relation} onChange={(e) => setRelation(e.target.value)}>
              <option value="parent">{d.sm.relParent}</option>
              <option value="grand-parent">{d.sm.relGrandParent}</option>
              <option value="oncle-tante">{d.sm.relOncleTante}</option>
              <option value="parrain-marraine">{d.sm.relParrain}</option>
              <option value="proche">{d.sm.relProche}</option>
            </select>
          </label>
          <label className="sm-option">
            <input
              type="checkbox"
              checked={consentement}
              onChange={(e) => setConsentement(e.target.checked)}
            />
            <span>
              {d.sm.consentement} <em>{d.sm.obligatoire}</em>
            </span>
          </label>
          <label className="sm-option">
            <input
              type="checkbox"
              checked={reutilisation}
              onChange={(e) => setReutilisation(e.target.checked)}
            />
            <span>{d.sm.option15}</span>
          </label>
          <button type="submit" className="sm-cta" disabled={!pret || envoi}>
            {d.sm.cta}
          </button>
          <p className={`statut ${statut.cls}`}>{statut.txt}</p>
          <span className="sm-note">
            {d.sm.question}{" "}
            <a href="mailto:contact@jumelio.com?subject=Deux%20comme%20nous">
              {d.sm.ecrivez}
            </a>
            , {d.sm.reponse}
          </span>
        </form>
      </div>
    </section>
  );
}
