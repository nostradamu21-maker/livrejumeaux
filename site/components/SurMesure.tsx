"use client";

import { useRef, useState } from "react";
import { ACCESSOIRES, ACCESSOIRE_DEFAUT } from "@/lib/accessoires";

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
  apercu,
  onChoisir,
}: {
  libelle: string;
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
            <img src={apercu} alt="Photo choisie" className="sm-photo-apercu" />
            <span>Changer de photo</span>
          </>
        ) : (
          <span>📷 {libelle}</span>
        )}
      </button>
    </>
  );
}

export default function SurMesure() {
  const [prenoms, setPrenoms] = useState({ 1: "", 2: "" });
  const [email, setEmail] = useState("");
  const [reutilisation, setReutilisation] = useState(false);
  const [monozygote, setMonozygote] = useState(true);
  const [accessoire, setAccessoire] = useState<string>(ACCESSOIRE_DEFAUT);
  const [photos, setPhotos] = useState<{ 1: File | null; 2: File | null }>({ 1: null, 2: null });
  const [apercus, setApercus] = useState<{ 1: string | null; 2: string | null }>({ 1: null, 2: null });
  const [envoi, setEnvoi] = useState(false);
  const [statut, setStatut] = useState<{ txt: string; cls: string }>({ txt: "", cls: "" });

  const prix = reutilisation ? "114 €" : "129 €";
  const pret = !!(prenoms[1] && prenoms[2] && photos[1] && (monozygote || photos[2]));

  function choisirPhoto(n: 1 | 2, f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setStatut({ txt: "Choisissez une image (JPEG ou PNG).", cls: "erreur" });
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
    setStatut({ txt: "Envoi des photos…", cls: "" });
    try {
      const form = new FormData();
      form.set("prenom1", prenoms[1]);
      form.set("prenom2", prenoms[2]);
      form.set("email", email.trim());
      form.set("reutilisation", reutilisation ? "1" : "0");
      form.set("monozygote", monozygote ? "1" : "0");
      if (monozygote) form.set("accessoire", accessoire);
      form.set("photo1", await reduirePhoto(photos[1]), "photo1.jpg");
      if (!monozygote && photos[2]) {
        form.set("photo2", await reduirePhoto(photos[2]), "photo2.jpg");
      }
      setStatut({ txt: "Traitement…", cls: "" });
      const r = await fetch("/api/sur-mesure", { method: "POST", body: form });
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

  return (
    <section id="sur-mesure" className="sur-mesure">
      <div className="sm-carte">
        <div className="sm-texte">
          <span className="sm-eyebrow">Édition sur mesure</span>
          <h2>Vous ne trouvez pas de ressemblance&nbsp;?</h2>
          <p>
            Nos douze personnages ne ressemblent pas assez à vos enfants&nbsp;?
            Nous créons leur livre entièrement <strong>sur mesure</strong>, à
            leur image, à partir d&apos;une simple photo.
          </p>
          <ul className="sm-points">
            <li>Personnages dessinés d&apos;après vos photos</li>
            <li>
              <strong>Vous choisissez</strong> parmi 3 propositions par enfant,
              juste après la commande
            </li>
            <li>Même livre relié 20×20&nbsp;cm (+ 4,99&nbsp;€ de livraison)</li>
            <li>
              <strong>Vos photos ne sont jamais conservées</strong>&nbsp;:
              supprimées automatiquement dès que le livre est généré.
            </li>
          </ul>
          <p className="sm-comment">
            Comment ça marche&nbsp;? Vous ajoutez la ou les photos et payez en
            ligne. Dans la minute, vous choisissez vos personnages préférés
            parmi nos propositions. Nous créons le livre, vous validez, nous
            imprimons.
          </p>
        </div>
        <form className="sm-offre" onSubmit={commander}>
          <span className="sm-prix">{prix}</span>
          <span className="sm-prix-note">livre sur mesure, à partir d&apos;une photo</span>
          <input
            type="text"
            className="champ-email"
            placeholder="Prénom du premier enfant"
            maxLength={18}
            value={prenoms[1]}
            onChange={(e) => setPrenoms((p) => ({ ...p, 1: e.target.value.trim() }))}
          />
          <input
            type="text"
            className="champ-email"
            placeholder="Prénom du second enfant"
            maxLength={18}
            value={prenoms[2]}
            onChange={(e) => setPrenoms((p) => ({ ...p, 2: e.target.value.trim() }))}
          />
          <input
            type="email"
            className="champ-email"
            placeholder="Votre e-mail (facultatif)"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="sm-zygote" role="radiogroup" aria-label="Vos jumeaux">
            <button
              type="button"
              className={`sm-zy${monozygote ? " actif" : ""}`}
              onClick={() => setMonozygote(true)}
            >
              Identiques
              <small>une seule photo suffit</small>
            </button>
            <button
              type="button"
              className={`sm-zy${!monozygote ? " actif" : ""}`}
              onClick={() => setMonozygote(false)}
            >
              Différents
              <small>une photo par enfant</small>
            </button>
          </div>
          {monozygote && (
            <div className="sm-distinctif">
              <p className="sm-distinctif-tete">
                Un petit détail pour distinguer{" "}
                {prenoms[2] ? <strong>{prenoms[2]}</strong> : "le second"} dans
                le livre&nbsp;:
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
          <BoutonPhoto
            libelle={monozygote ? "Ajouter la photo de vos enfants" : `Photo de ${prenoms[1] || "l'aîné·e"}`}
            apercu={apercus[1]}
            onChoisir={(f) => choisirPhoto(1, f)}
          />
          {!monozygote && (
            <BoutonPhoto
              libelle={`Photo de ${prenoms[2] || "l'autre enfant"}`}
              apercu={apercus[2]}
              onChoisir={(f) => choisirPhoto(2, f)}
            />
          )}
          <span className="sm-photo-note">
            Visages bien visibles, JPEG ou PNG. Photos supprimées après création
            du livre.
          </span>
          <label className="sm-option">
            <input
              type="checkbox"
              checked={reutilisation}
              onChange={(e) => setReutilisation(e.target.checked)}
            />
            <span>
              <strong>−15&nbsp;€</strong>&nbsp;: j&apos;accepte que le
              personnage dessiné (jamais la photo) soit conservé pour de
              futures créations.
            </span>
          </label>
          <button type="submit" className="sm-cta" disabled={!pret || envoi}>
            Commander mon livre sur mesure
          </button>
          <p className={`statut ${statut.cls}`}>{statut.txt}</p>
          <span className="sm-note">
            Une question d&apos;abord&nbsp;?{" "}
            <a href="mailto:bonjour@gemellite.com?subject=Livre%20sur%20mesure">
              Écrivez-nous
            </a>
            , réponse sous 48&nbsp;h.
          </span>
        </form>
      </div>
    </section>
  );
}
