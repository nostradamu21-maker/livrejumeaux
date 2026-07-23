"""Relève des commandes Supabase et production à la chaîne.

    python commandes.py            # liste + coût estimé + confirmation + production
    python commandes.py --liste    # liste seulement, ne produit rien

Pour chaque commande non traitée (colonne traitee_le vide) :
  1. combo inconnue  → `combo.py` (livre.yaml) puis `livre.py <combo>` :
     génération (coût annoncé par livre.py, confirmation) + TRI dans le navigateur ;
  2. `livre.py <combo> --prenoms "A,B"` → PDF client (gratuit, secondes) ;
  3. la commande est marquée traitée dans Supabase et la combo enregistrée
     dans la table `combos` (cache) → les ventes suivantes seront instantanées.

Clés lues dans .env (les mêmes noms que sur Vercel) :
  SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY.
Appels réseau via curl, comme gelato.py (TLS du Python 3.9 macOS trop ancien).
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent
LIVRES = ROOT / "livres"

# Mêmes hypothèses de coût que livre.py.
N_VARIANTES = 2
PRIX_IMAGE = 0.175  # $ / image en qualité haute


# ----------------------------- Supabase (REST) -----------------------------

def _config() -> tuple[str, str]:
    env = dotenv_values(ROOT / ".env")
    url = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    cle = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not url or not cle:
        raise SystemExit(
            "SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY "
            "sont requis dans .env"
        )
    return url, cle


def _curl(methode: str, chemin: str, corps: dict | None = None) -> list | dict:
    url, cle = _config()
    cmd = [
        "curl", "-sS", "--fail-with-body", "-X", methode,
        "-H", f"apikey: {cle}", "-H", f"Authorization: Bearer {cle}",
        "-H", "Content-Type: application/json", "-H", "Prefer: return=representation",
        f"{url}/rest/v1/{chemin}",
    ]
    if corps is not None:
        cmd += ["-d", json.dumps(corps)]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if p.returncode != 0:
        raise RuntimeError(f"Supabase {methode} {chemin} : {p.stderr.strip()} {p.stdout[:400]}")
    return json.loads(p.stdout) if p.stdout.strip() else []


def commandes_a_traiter() -> list[dict]:
    return _curl(
        "GET",
        "commandes?traitee_le=is.null&select=*&order=cree_le.asc",
    )


def marquer_traitee(commande_id: str) -> None:
    horodatage = datetime.now(timezone.utc).isoformat()
    _curl("PATCH", f"commandes?id=eq.{commande_id}", {"traitee_le": horodatage})


def enregistrer_combo_cache(combo_id: str, a1: str, a2: str) -> None:
    """Upsert dans `combos` → le site (et ce script) sauront qu'elle est en cache."""
    _curl(
        "POST",
        "combos?on_conflict=combo_id",
        {"combo_id": combo_id, "archetype1": a1, "archetype2": a2},
    )


# ------------------------------ État local ---------------------------------

def _accessoire_de(combo_id: str) -> str | None:
    if "__acc-" in combo_id:
        return combo_id.rsplit("__acc-", 1)[1]
    return None


def _pages_livret() -> list[str]:
    scenes = yaml.safe_load((ROOT / "scenes.yaml").read_text(encoding="utf-8"))
    return [n for n, p in scenes["pages"].items() if not p.get("texte_seul")]


def _page_generee(dossier: Path, num: str) -> bool:
    # Même convention que livre.py : livres/<id>/variantes/page-<num>/vN.png
    return (dossier / "variantes" / f"page-{num}" / f"v{N_VARIANTES}.png").exists()


def etat_combo(combo_id: str) -> tuple[str, float]:
    """('cache' | 'a_generer' | 'a_trier', coût $ restant estimé)."""
    dossier = LIVRES / combo_id
    unites = _pages_livret() + ["couv"]
    if not (dossier / "livre.yaml").exists():
        return "a_generer", len(unites) * N_VARIANTES * PRIX_IMAGE
    manquantes = [n for n in unites if not _page_generee(dossier, n)]
    if manquantes:
        return "a_generer", len(manquantes) * N_VARIANTES * PRIX_IMAGE
    livre = yaml.safe_load((dossier / "livre.yaml").read_text(encoding="utf-8"))
    selections = livre.get("selections") or {}
    non_triees = [n for n in unites if str(n) not in {str(k) for k in selections}]
    if non_triees:
        return "a_trier", 0.0
    return "cache", 0.0


# ------------------------------- Production --------------------------------

def _lancer(args: list[str]) -> None:
    """Sous-commande interactive (hérite du terminal : confirmations, tri...)."""
    print(f"\n$ {' '.join(args)}")
    r = subprocess.run([sys.executable] + args, cwd=ROOT)
    if r.returncode != 0:
        raise SystemExit(f"Échec de : {' '.join(args)} (code {r.returncode})")


def produire(cmd: dict) -> None:
    cid = cmd["combo_id"]
    a1, a2 = cmd["archetype1"], cmd["archetype2"]
    p1, p2 = cmd["prenom1"], cmd["prenom2"]
    etat, _ = etat_combo(cid)

    if etat != "cache" and not (LIVRES / cid / "livre.yaml").exists():
        args = ["combo.py", a1, a2]
        acc = _accessoire_de(cid)
        if acc:
            args += ["--accessoire", acc]
        _lancer(args)

    if etat != "cache":
        # Génération (coût annoncé + confirmation par livre.py) puis TRI navigateur.
        _lancer(["livre.py", cid])

    # PDF client : gratuit, quelques secondes.
    _lancer(["livre.py", cid, "--prenoms", f"{p1},{p2}"])

    enregistrer_combo_cache(cid, a1, a2)
    marquer_traitee(cmd["id"])
    print(f"✅ Commande {p1} & {p2} traitée — PDF dans livres/{cid}/")


# ---------------------------------- Main -----------------------------------

def main() -> None:
    liste_seulement = "--liste" in sys.argv

    cmds = commandes_a_traiter()
    if not cmds:
        print("Aucune commande en attente. ☕")
        return

    print(f"\n{len(cmds)} commande(s) en attente :\n")
    cout_total = 0.0
    combos_vues: set[str] = set()
    for c in cmds:
        cid = c["combo_id"]
        etat, cout = etat_combo(cid)
        # Le coût d'une combo ne se paie qu'une fois, même si plusieurs
        # commandes attendent la même paire.
        if cid in combos_vues:
            cout = 0.0
        combos_vues.add(cid)
        cout_total += cout
        etiquette = {
            "cache": "EN CACHE → PDF immédiat, 0 $",
            "a_trier": "GÉNÉRÉE, tri à finir → 0 $",
            "a_generer": f"À PRODUIRE → ≈ {cout:.2f} $ d'API",
        }[etat]
        date = (c.get("cree_le") or "")[:16].replace("T", " ")
        print(f"  • {c['prenom1']} & {c['prenom2']:<12} {cid}")
        print(f"    {date} · {c.get('email') or 'email inconnu'} · {etiquette}")
    print(f"\nCoût API total estimé : ≈ {cout_total:.2f} $ "
          f"(estimation ; livre.py redemande confirmation avant chaque génération)")

    if liste_seulement:
        return
    if input("\nLancer la production à la chaîne ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
        print("Annulé.")
        return

    for c in cmds:
        print(f"\n──── {c['prenom1']} & {c['prenom2']} · {c['combo_id']} ────")
        produire(c)

    print("\n🎉 Toutes les commandes sont traitées.")
    print("Prochaine étape : vérifier les PDF puis passer les commandes Gelato "
          "(gelato.py) avec les adresses reçues par email.")


if __name__ == "__main__":
    main()
