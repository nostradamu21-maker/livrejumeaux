# MÉMO — quoi lancer, et quand

Repère rapide de tout ce qui s'exécute. **Avant chaque commande Python**, ouvre un
terminal dans le projet et active l'environnement :

```bash
cd ~/livrejumeaux
source .venv/bin/activate      # le prompt affiche (.venv)
```

---

## 0. UNE SEULE FOIS — activer le site (avant les vraies ventes)

Aucune commande à taper : ce sont des réglages dans les dashboards.

- **Supabase → SQL Editor** : exécuter le contenu de `site/supabase/schema.sql`
  (crée les tables `commandes`, `combos`, `sur_mesure`, le bucket `sur-mesure`
  et les colonnes `traitee_le`, `langue`). À relancer si on ajoute une colonne.
- **Stripe → Developers → Webhooks** : ajouter l'endpoint
  `https://boutique.gemellite.com/api/stripe/webhook`, événement
  `checkout.session.completed`. Copier le `whsec_…`.
- **Resend** : vérifier le domaine `jumelio.com` (SPF + DKIM), créer une clé API.
- **Vercel → Settings → Environment Variables** (Production), puis **Redeploy** :
  - `STRIPE_SECRET_KEY` (`sk_live_…`), `STRIPE_WEBHOOK_SECRET` (`whsec_…`)
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `RESEND_API_KEY`, `EMAIL_FROM="Deux comme nous <contact@jumelio.com>"`,
    `EMAIL_NOTIF=contact@jumelio.com`
  - (option) `PRIX_CENTIMES`, `LIVRAISON_CENTIMES`, `PRIX_SUR_MESURE_CENTIMES`,
    `REDUC_REUTILISATION_CENTIMES`, `GEN_QUALITE`
- **Ton `.env` local (Mac)** — pour les scripts Python : `OPENAI_API_KEY`,
  `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GELATO_API_KEY`.
- **Médiateur de la consommation** : adhérer (obligation légale), puis me donner
  ses coordonnées pour les CGV.

Où voir les commandes : **Supabase → Table Editor → `commandes`** (colonne `ref` =
id Stripe ; `combo_id` = paire ou `sur-mesure` ; `langue`).

---

## 1. Une commande arrive (paire d'ARCHÉTYPES = cas normal)

```bash
python commandes.py
```
Relève les commandes payées, affiche le coût API, demande confirmation, puis pour
chacune : génère les pages si la combo est nouvelle → **tri dans le navigateur** →
PDF final (dans la bonne langue). Les combos déjà en cache = PDF immédiat, gratuit.

- Consulter sans rien produire : `python commandes.py --liste`
- **Ensuite (manuel) : commande Gelato** — voir §4.

---

## 2. Une commande SUR-MESURE arrive (personnages d'après photo)

Le client a payé **et choisi ses personnages en ligne** → tu reçois l'e-mail
« 🎨 Variantes choisies ». Récupère la `ref` (dans l'e-mail ou table `commandes`).

```bash
python sur_mesure.py --liste            # commandes sur-mesure prêtes
python sur_mesure.py <ref>              # télécharge les persos + génère + tri + PDF
```
- **Ensuite (manuel) : commande Gelato** — voir §4.

---

## 3. Le client a pris l'option −30 € (réutilisation du personnage)

Transforme ses 2 personnages en **archétypes commandables par tous** (+ exemple
flipbook). À faire une fois le livre sur-mesure produit :

```bash
python promouvoir_archetype.py sur-mesure-<prenoms> \
  --a1 "g7-marceau:garçon:Brun, cheveux courts" \
  --a2 "f7-jade:fille:Brune, couettes" \
  --exemple
```
Adapter id / genre / libellé (libellé court, SANS mention de peau). Le script
affiche la ligne `git add … && git commit && git push` à lancer ensuite. Après
redéploiement Vercel, les personnages sont dans le configurateur.

---

## 4. Commande Gelato (impression + expédition) — MANUEL pour l'instant

Après le PDF (`livres/<id>/impression-*.pdf`) :
1. Dashboard Gelato → créer une commande (produit photobook 200×200).
2. Coller l'**adresse du client** (dans l'e-mail de commande / Supabase) + son e-mail.
3. Uploader le PDF, valider (tu paies ~23 €, le client t'a déjà payé via Stripe).

Gelato imprime, expédie directement chez le client et lui envoie le suivi.
*(L'automatisation de cette étape reste à faire — dis-moi quand tu veux.)*

---

## 5. Enrichir le site (optionnel, quand tu veux)

- **Aperçu « vraies pages » d'une combo produite** (le configurateur propose
  « Feuilleter de vraies pages avec vos prénoms » pour cette paire) :
  ```bash
  python publier_apercu.py <combo-id>
  ```
- **Ajouter un exemplaire au flipbook** (« Feuilletez un exemplaire réel ») :
  ```bash
  python publier_apercu.py <id> --exemple "Prénom1,Prénom2"
  ```
- **Générer les fiches d'archétypes manquantes** (catalogue) : `python archetypes.py`

Dans tous les cas : le script affiche le `git add/commit/push` à lancer ; après le
push, Vercel redéploie tout seul.

---

## Aide-mémoire des scripts

| Script | Rôle |
|---|---|
| `commandes.py` | Produit les commandes **combo** (relève Supabase → tri → PDF) |
| `sur_mesure.py` | Produit une commande **sur-mesure** (photo → persos → tri → PDF) |
| `promouvoir_archetype.py` | Personnage sur-mesure → **archétype public** (option −30 €) |
| `publier_apercu.py` | Publie les aperçus d'un livre sur le **site** (configurateur / flipbook) |
| `livre.py <id>` | Moteur d'un livre (génération + tri + PDF) — appelé par les autres |
| `combo.py` | Prépare le `livre.yaml` d'une paire d'archétypes — appelé par `commandes.py` |
| `archetypes.py` | Génère les fiches de référence d'archétypes |
| `gelato.py` | Client API Gelato (catalogue, cotes ; commande auto à venir) |

**Règle simple :** commande normale → `commandes.py` · commande sur-mesure →
`sur_mesure.py` · option −30 € → `promouvoir_archetype.py` · puis **Gelato à la main**.
