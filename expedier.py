"""Expédition Gelato d'une commande payée — « Deux comme nous ».

    python expedier.py --liste           # commandes payées, PDF prêt ou non, état Gelato
    python expedier.py <ref>             # commande BROUILLON Gelato (vérifiable au dashboard)
    python expedier.py <ref> --imprimer  # commande RÉELLE (part en impression, débit Gelato)

Chaîne complète pour une commande dont le PDF client existe déjà
(`livre.py <combo> --prenoms` fait par commandes.py / sur_mesure.py) :
  1. lit la commande dans Supabase (adresse structurée écrite par le webhook Stripe) ;
  2. scinde le PDF d'impression : page 1 = couverture intégrale (gabarit Gelato),
     pages suivantes = intérieur ;
  3. téléverse les deux PDF dans le bucket privé `impressions` et crée des liens
     signés (7 jours) que Gelato télécharge ;
  4. crée la commande Gelato (brouillon par défaut : rien ne part en impression
     tant que tu ne la valides pas dans le dashboard, ou relance avec --imprimer) ;
  5. enregistre `gelato_id` (+ `expedie_le` si réelle) dans la commande Supabase.

.env : GELATO_API_KEY, GELATO_PRODUCT_UID (uid du photobook 20×20 — trouvable via
`python gelato.py catalogue`), SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL),
SUPABASE_SERVICE_ROLE_KEY. Dépendance : pypdf (`pip install pypdf`).
Journal : livres/gelato-journal.txt.
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import dotenv_values

import gelato

ROOT = Path(__file__).resolve().parent
LIVRES = ROOT / "livres"
BUCKET = "impressions"
SIGNE_SECONDES = 7 * 24 * 3600  # liens signés valables 7 jours
JOURNAL = LIVRES / "gelato-journal.txt"

ENV = dotenv_values(ROOT / ".env")

# Produit du livre test validé physiquement (Elia & Luna) : photobook 20×20 cm,
# couverture rigide, papier 170 g couché soyeux, pelliculage mat, reliure collée.
# Surchargeable via GELATO_PRODUCT_UID dans .env si le produit change.
PRODUCT_UID_DEFAUT = (
    "photobooks-hardcover_pf_200x200-mm-8x8-inch_pt_170-gsm-65lb-coated-silk"
    "_cl_4-4_ccl_4-4_bt_glued-left_ct_matt-lamination_prt_1-0"
    "_cpt_130-gsm-65-lb-cover-coated-silk_ver"
)
# Nombre de pages intérieures du produit (commande test : 30). Les gardes
# vierges du PDF client n'en font pas partie (Gelato pose les siennes).
PAGES_PRODUIT = int(ENV.get("GELATO_PAGE_COUNT") or 30)


def _journal(msg: str) -> None:
    with JOURNAL.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")


# ------------------------------ Supabase -----------------------------------

def _supabase() -> tuple[str, str]:
    url = (ENV.get("SUPABASE_URL") or ENV.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    cle = ENV.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not url or not cle:
        raise SystemExit("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env")
    return url, cle


def _curl_json(args: list[str], timeout: int = 120) -> dict | list:
    p = subprocess.run(["curl", "-sS", "--fail-with-body"] + args,
                       capture_output=True, text=True, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(f"curl ({p.returncode}) : {p.stderr.strip()} {p.stdout[:400]}")
    return json.loads(p.stdout) if p.stdout.strip() else {}


def _rest(chemin: str, methode: str = "GET", corps: dict | None = None) -> dict | list:
    url, cle = _supabase()
    args = ["-H", f"apikey: {cle}", "-H", f"Authorization: Bearer {cle}"]
    if methode != "GET":
        args += ["-X", methode, "-H", "Content-Type: application/json",
                 "-H", "Prefer: return=representation", "-d", json.dumps(corps or {})]
    return _curl_json(args + [f"{url}/rest/v1/{chemin}"])


def _upload(chemin_bucket: str, fichier: Path) -> None:
    url, cle = _supabase()
    _curl_json(["-X", "POST",
                "-H", f"apikey: {cle}", "-H", f"Authorization: Bearer {cle}",
                "-H", "Content-Type: application/pdf",
                "-H", "x-upsert: true",
                "--data-binary", f"@{fichier}",
                f"{url}/storage/v1/object/{BUCKET}/{chemin_bucket}"])


def _lien_signe(chemin_bucket: str) -> str:
    url, cle = _supabase()
    r = _curl_json(["-X", "POST",
                    "-H", f"apikey: {cle}", "-H", f"Authorization: Bearer {cle}",
                    "-H", "Content-Type: application/json",
                    "-d", json.dumps({"expiresIn": SIGNE_SECONDES}),
                    f"{url}/storage/v1/object/sign/{BUCKET}/{chemin_bucket}"])
    signed = r.get("signedURL") if isinstance(r, dict) else None
    if not signed:
        raise RuntimeError(f"Lien signé impossible pour {chemin_bucket} : {r}")
    return f"{url}/storage/v1{signed}"


# ------------------------------ Commande -----------------------------------

def lire_commande(ref: str) -> dict:
    data = _rest(f"commandes?ref=eq.{ref}&select=*")
    if not data:
        raise SystemExit(f"Aucune commande avec ref={ref}")
    return data[0]


def trouver_pdf(cmd: dict) -> Path:
    """PDF client : impression-<P1>-<P2>[-<langue>].pdf dans livres/<combo>/
    (sur-mesure : le combo_id vaut « sur-mesure », on cherche dans tous les
    dossiers sur-mesure-*)."""
    p1, p2 = cmd["prenom1"], cmd["prenom2"]
    langue = (cmd.get("langue") or "fr").lower()
    suffixe = "" if langue == "fr" else f"-{langue}"
    nom = f"impression-{p1}-{p2}{suffixe}.pdf".replace(" ", "_")
    if cmd["combo_id"] == "sur-mesure":
        candidats = sorted(LIVRES.glob(f"sur-mesure-*/{nom}"))
    else:
        candidats = [LIVRES / cmd["combo_id"] / nom]
    for c in candidats:
        if c.exists():
            return c
    raise SystemExit(
        f"PDF introuvable : {nom}\n"
        f"Produis-le d'abord (python commandes.py ou python sur_mesure.py).")


def scinder(pdf: Path, dossier_tmp: Path) -> tuple[Path, Path, int]:
    """Page 1 = couverture intégrale ; intérieur = les pages de CONTENU.
    Le PDF client contient une garde vierge après la couverture et une autre en
    dernière page (confort de lecture) : elles sont retirées quand le compte
    retombe ainsi sur PAGES_PRODUIT (30), car le produit Gelato pose ses propres
    gardes à la reliure. Renvoie (couverture, interieur, nb_pages_interieur)."""
    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        raise SystemExit("pypdf manquant : pip install pypdf")
    lecteur = PdfReader(str(pdf))
    if len(lecteur.pages) < 2:
        raise SystemExit(f"PDF inattendu ({len(lecteur.pages)} page) : {pdf}")
    dossier_tmp.mkdir(parents=True, exist_ok=True)
    pages_int = list(lecteur.pages[1:])
    if len(pages_int) == PAGES_PRODUIT + 2:
        pages_int = pages_int[1:-1]  # retire les 2 gardes vierges
        print(f"Gardes vierges retirées → {len(pages_int)} pages de contenu")
    elif len(pages_int) != PAGES_PRODUIT:
        print(f"⚠️ Intérieur de {len(pages_int)} pages (produit : {PAGES_PRODUIT}) "
              "— vérifie le brouillon Gelato avant d'imprimer.")
    couv, interieur = PdfWriter(), PdfWriter()
    couv.add_page(lecteur.pages[0])
    for page in pages_int:
        interieur.add_page(page)
    p_couv = dossier_tmp / "couverture.pdf"
    p_int = dossier_tmp / "interieur.pdf"
    with p_couv.open("wb") as f:
        couv.write(f)
    with p_int.open("wb") as f:
        interieur.write(f)
    return p_couv, p_int, len(pages_int)


def analyser_dpi(pdf: Path, seuil: int = 250) -> bool:
    """Rapport de résolution : pour chaque page, taille en pixels de l'image
    principale et dpi effectifs à la taille d'impression. True si tout ≥ seuil."""
    from pypdf import PdfReader
    lecteur = PdfReader(str(pdf))
    tout_bon = True
    print(f"\nRésolution des images — {pdf.name} (seuil {seuil} dpi) :")
    for i, page in enumerate(lecteur.pages, 1):
        boite = page.mediabox
        larg_pouces = float(boite.width) / 72.0
        haut_pouces = float(boite.height) / 72.0
        try:
            xobjs = page["/Resources"]["/XObject"]
        except KeyError:
            print(f"  p{i:>2} : (pas d'image — page texte/garde)")
            continue
        meilleur = None
        for nom in xobjs:
            o = xobjs[nom].get_object()
            if o.get("/Subtype") == "/Image":
                w, h = int(o["/Width"]), int(o["/Height"])
                if meilleur is None or w * h > meilleur[0] * meilleur[1]:
                    meilleur = (w, h)
        if not meilleur:
            print(f"  p{i:>2} : (pas d'image — page texte/garde)")
            continue
        w, h = meilleur
        dpi = min(w / larg_pouces, h / haut_pouces)
        marque = "✓" if dpi >= seuil else "⚠️ FAIBLE"
        if dpi < seuil:
            tout_bon = False
        print(f"  p{i:>2} : {w}×{h}px sur {larg_pouces * 2.54:.0f}×{haut_pouces * 2.54:.0f} cm "
              f"→ {dpi:.0f} dpi {marque}")
    if not tout_bon:
        print(f"⚠️ Des pages sont sous {seuil} dpi : rendu d'impression possiblement doux.")
    return tout_bon


def payload_gelato(cmd: dict, url_couv: str, url_int: str, pages_int: int,
                   imprimer: bool) -> dict:
    produit = ENV.get("GELATO_PRODUCT_UID") or PRODUCT_UID_DEFAUT
    a = cmd.get("adresse") or {}
    if not a.get("line1"):
        raise SystemExit(
            "Adresse de livraison absente de la commande (colonne `adresse`).\n"
            "Commande antérieure à la collecte structurée ? Récupère l'adresse dans "
            "l'email de commande et complète la ligne Supabase, ou passe par le dashboard Gelato.")
    nom = (a.get("name") or "").strip() or "Client"
    morceaux = nom.split()
    prenom, reste = morceaux[0], " ".join(morceaux[1:]) or morceaux[0]
    return {
        "orderType": "order" if imprimer else "draft",
        "orderReferenceId": cmd["ref"],
        "customerReferenceId": cmd.get("email") or cmd["ref"],
        "currency": "EUR",
        "items": [{
            "itemReferenceId": f"{cmd['ref']}-livre",
            "productUid": produit,
            "pageCount": pages_int,
            "quantity": 1,
            "files": [
                {"type": "cover", "url": url_couv},
                {"type": "default", "url": url_int},
            ],
        }],
        "shipmentMethodUid": "normal",
        "shippingAddress": {
            "firstName": prenom,
            "lastName": reste,
            "addressLine1": a["line1"],
            "addressLine2": a.get("line2") or "",
            "postCode": a["postCode"],
            "city": a["city"],
            "state": a.get("state") or "",
            "country": a["country"],
            "email": cmd.get("email") or "contact@jumelio.com",
            "phone": cmd.get("telephone") or "",
        },
    }


def expedier(ref: str, imprimer: bool) -> None:
    cmd = lire_commande(ref)
    if cmd.get("gelato_id") and cmd.get("expedie_le"):
        print(f"Déjà expédiée (Gelato {cmd['gelato_id']} le {cmd['expedie_le']}).")
        return
    pdf = trouver_pdf(cmd)
    print(f"PDF : {pdf.name} ({pdf.stat().st_size // 1024} Ko)")

    p_couv, p_int, pages_int = scinder(pdf, pdf.parent / "gelato-tmp")
    print(f"Scindé : couverture + {pages_int} pages intérieures")
    analyser_dpi(p_couv)
    analyser_dpi(p_int)

    # Limite Supabase Storage : 50 Mo par fichier (plan gratuit). Les PDF sont
    # désormais compressés JPEG à la source (livre.py) ; si ça dépasse encore,
    # le PDF vient d'une ancienne version → le regénérer (gratuit, secondes).
    for f in (p_couv, p_int):
        mo = f.stat().st_size / 1e6
        if mo > 49:
            raise SystemExit(
                f"{f.name} fait {mo:.0f} Mo (> limite Supabase 50 Mo).\n"
                f"Regénère le PDF avec la version à jour du pipeline :\n"
                f"  python livre.py {cmd['combo_id']} --prenoms \"{cmd['prenom1']},{cmd['prenom2']}\""
                + ("" if (cmd.get('langue') or 'fr') == 'fr' else f" --langue {cmd['langue']}"))
    prefixe = f"{ref}"
    _upload(f"{prefixe}/couverture.pdf", p_couv)
    _upload(f"{prefixe}/interieur.pdf", p_int)
    url_couv = _lien_signe(f"{prefixe}/couverture.pdf")
    url_int = _lien_signe(f"{prefixe}/interieur.pdf")
    print("PDF téléversés (liens signés 7 jours) :")
    print(f"  couverture : {url_couv}")
    print(f"  intérieur  : {url_int}")
    _journal(f"URLS {ref} couv={url_couv} int={url_int}")

    corps = payload_gelato(cmd, url_couv, url_int, pages_int, imprimer)
    mode = "RÉELLE (impression + débit)" if imprimer else "BROUILLON (à valider au dashboard)"
    print(f"\nCommande Gelato {mode}")
    print(f"  Livre : {cmd['prenom1']} & {cmd['prenom2']} ({cmd['combo_id']}, "
          f"{(cmd.get('langue') or 'fr').upper()})")
    a = cmd["adresse"]
    print(f"  Vers  : {a['name']}, {a['line1']}, {a['postCode']} {a['city']}, {a['country']}")
    if input("Envoyer à Gelato ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
        print("Annulé.")
        return

    reponse = gelato.creer_commande(corps)
    gid = reponse.get("id") or reponse.get("orderId") or ""
    if not gid:
        _journal(f"ECHEC {ref} : {json.dumps(reponse)[:1500]}")
        raise SystemExit(f"Réponse Gelato sans id — détails dans {JOURNAL}")
    _journal(f"{'ORDER' if imprimer else 'DRAFT'} {ref} → {gid}")

    maj: dict = {"gelato_id": gid}
    if imprimer:
        maj["expedie_le"] = datetime.now(timezone.utc).isoformat()
    _rest(f"commandes?ref=eq.{ref}", "PATCH", maj)

    print(f"\n✅ Commande Gelato créée : {gid}")
    if imprimer:
        print("   Elle part en impression. Suivi : dashboard Gelato.")
    else:
        print("   BROUILLON : vérifie le rendu dans le dashboard Gelato "
              "(fichiers, adresse), puis valide-la là-bas ou relance avec --imprimer.")


def lister() -> None:
    data = _rest("commandes?paiement=eq.stripe&order=cree_le.asc&select="
                 "ref,prenom1,prenom2,combo_id,langue,traitee_le,gelato_id,expedie_le,adresse")
    if not data:
        print("Aucune commande payée. ☕")
        return
    print(f"\n{len(data)} commande(s) payée(s) :\n")
    for c in data:
        if c.get("expedie_le"):
            etat = f"✅ expédiée ({c['gelato_id']})"
        elif c.get("gelato_id"):
            etat = f"📝 brouillon Gelato ({c['gelato_id']})"
        elif not c.get("traitee_le"):
            etat = "⏳ PDF à produire (commandes.py / sur_mesure.py)"
        elif not (c.get("adresse") or {}).get("line1"):
            etat = "⚠️ adresse manquante"
        else:
            etat = "📦 prête à expédier"
        print(f"  {etat:<46} {c['prenom1']} & {c['prenom2']:<12} "
              f"[{c['combo_id']}] ref={c['ref']}")
    print("\nExpédier : python expedier.py <ref> (brouillon) puis --imprimer")


def etat_gelato(ref: str) -> None:
    """Interroge l'API Gelato : état réel de la commande et de ses fichiers
    (le dashboard peut afficher des aperçus « en boucle » alors que tout est bon)."""
    cmd = lire_commande(ref)
    gid = cmd.get("gelato_id")
    if not gid:
        raise SystemExit("Pas de gelato_id sur cette commande (brouillon pas créé ?).")
    try:
        data = gelato.lire_commande(gid)
    except RuntimeError as e:
        if "NOT_FOUND" in str(e) or "404" in str(e):
            # Brouillon supprimé au dashboard : on oublie l'ancien id.
            _rest(f"commandes?ref=eq.{ref}", "PATCH", {"gelato_id": None})
            raise SystemExit(
                f"La commande Gelato {gid} n'existe plus (brouillon supprimé au "
                "dashboard). Ancien id nettoyé.\n"
                f"→ recréer le brouillon : python expedier.py {ref}")
        raise
    print(f"Commande Gelato {gid}")
    print(f"  statut global : {data.get('fulfillmentStatus') or data.get('status') or '?'}")
    print(f"  financier     : {data.get('financialStatus', '?')}")
    apercu_url = ""
    for item in data.get("items", []):
        print(f"  item {item.get('itemReferenceId', '?')} : "
              f"{item.get('fulfillmentStatus') or item.get('status') or '?'}")
        for f in item.get("files", []) or []:
            print(f"    fichier {f.get('type', '?')} : {str(f.get('url', ''))[:60]}…")
        for p in item.get("previews", []) or []:
            print(f"    aperçu {p.get('type', '?')} : {p.get('url', '')[:60]}…")
            if p.get("type") == "preview_default":
                apercu_url = p.get("url", "")
    _journal(f"ETAT {ref} → {json.dumps(data)[:2000]}")
    print(f"\nRéponse complète journalisée dans {JOURNAL}")
    if apercu_url:
        # Télécharge le rendu Gelato du livre et l'ouvre. Le format varie
        # (PDF ou image) : on détecte le vrai type avant de nommer le fichier.
        brut = LIVRES / f"gelato-apercu-{gid[:8]}.tmp"
        p = subprocess.run(["curl", "-sSL", "--fail", "-o", str(brut), apercu_url],
                           capture_output=True, text=True, timeout=180)
        if p.returncode == 0 and brut.exists() and brut.stat().st_size > 0:
            tete = brut.read_bytes()[:8]
            ext = (".pdf" if tete.startswith(b"%PDF") else
                   ".png" if tete.startswith(b"\x89PNG") else
                   ".jpg" if tete.startswith(b"\xff\xd8") else "")
            if ext:
                dest = brut.with_suffix(ext)
                brut.replace(dest)
                print(f"\n📖 Aperçu du rendu Gelato : {dest}")
                if sys.platform == "darwin":
                    subprocess.run(["open", str(dest)], check=False)
            else:
                contenu = brut.read_bytes()[:200]
                brut.unlink(missing_ok=True)
                print("\nAperçu au format inattendu (lien expiré ?) — début de la "
                      f"réponse : {contenu!r}\nRelance --etat pour un lien frais, "
                      f"ou ouvre l'URL :\n{apercu_url}")
        else:
            print(f"\nAperçu non téléchargeable automatiquement — URL complète :\n{apercu_url}")


def main() -> None:
    args = sys.argv[1:]
    if not args or "--liste" in args:
        lister()
        return
    if "--etat" in args:
        etat_gelato(args[0])
        return
    if "--dpi" in args:
        cmd = lire_commande(args[0])
        pdf = trouver_pdf(cmd)
        p_couv, p_int, _ = scinder(pdf, pdf.parent / "gelato-tmp")
        analyser_dpi(p_couv)
        analyser_dpi(p_int)
        return
    expedier(args[0], "--imprimer" in args)


if __name__ == "__main__":
    main()
