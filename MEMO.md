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

## 4. Commande Gelato (impression + expédition) — AUTOMATISÉE (`expedier.py`)

Prérequis UNE FOIS :
1. Supabase → SQL Editor → relancer `site/supabase/schema.sql` (colonnes
   `adresse`/`telephone`/`gelato_id`/`expedie_le` + bucket `impressions`).
2. `pip install pypdf`.

Le produit est celui du livre test validé (photobook 20×20, couverture rigide,
170 g soyeux, pelliculage mat, 30 pages) : uid en dur dans `expedier.py`,
surchargeable via `GELATO_PRODUCT_UID` / `GELATO_PAGE_COUNT` dans `.env`.
Les gardes vierges du PDF client sont retirées automatiquement (intérieur = 30
pages de contenu, comme la commande test).

Ensuite, après le PDF (`livres/<id>/impression-*.pdf`) :
```bash
python expedier.py --liste        # état de chaque commande payée
python expedier.py <ref>          # BROUILLON Gelato (rien ne s'imprime)
#   → vérifier fichiers + adresse dans le dashboard Gelato, puis :
python expedier.py <ref> --imprimer   # commande réelle (impression + débit ~23 €)
```
Le script scinde le PDF (couverture/intérieur), héberge les fichiers (liens
signés 7 j), reprend l'**adresse client collectée par Stripe** et écrit le
`gelato_id` dans Supabase. Gelato imprime, expédie chez le client et envoie le suivi.
⚠️ Les commandes passées AVANT cette mise à jour n'ont pas d'adresse en base :
pour elles, reprendre l'adresse dans l'e-mail interne (ou dashboard Stripe).

---

## 4 bis. Trier depuis ton TÉLÉPHONE (tri web mobile)

Prérequis UNE FOIS :
1. Supabase → SQL Editor → relancer `site/supabase/schema.sql` (table `tris` + bucket `tri`).
2. Choisir un secret : `openssl rand -hex 24`, puis le mettre AUX DEUX endroits :
   - `.env` (Mac/VPS) : `ADMIN_TRI_SECRET=<secret>`
   - Vercel → Environment Variables : `ADMIN_TRI_SECRET=<secret>` + Redeploy.

Ensuite, deux façons :
```bash
python livre.py <id> --tri-web    # la machine à états utilise le tri web :
                                  # elle envoie les variantes, affiche l'URL,
                                  # attend tes choix (téléphone), puis continue
# ou, à la main :
python tri_web.py <id>            # envoie + URL du tri
python tri_web.py <id> --rapatrier  # applique les choix quand tu as fini
```
Sur la page (URL affichée, ouvre-la sur ton téléphone) : un tap = un choix,
« 🔁 Aucune ne va, à refaire » = l'unité sera regénérée à la prochaine passe.
Tout s'enregistre tout seul ; les fichiers du bucket sont nettoyés à la fin.

---

## 4 ter. Une commande d'AFFICHE (poster) arrive

`python commandes.py` les liste à part. Production :
```bash
python affiche.py <livre>                       # génère + trie l'illustration (1 fois par paire, ~0,17 $)
python affiche.py <livre> --prenoms "A,B" --taille 30x40   # PDF du poster (gratuit)
python expedier.py <ref>                        # brouillon Gelato, puis --imprimer
```
`<livre>` = la combo (ex. `combo-f1…__f2…`) OU le livre sur-mesure du client
(ex. `sur-mesure-elia-luna`) : l'affiche SUR MESURE reprend ses personnages
validés (upsell proposé après l'achat, lien `/?sm=<ref>#affiche`).
**Affiche sur-mesure SEULE** (sans livre) : le client choisit « L'affiche seule »
dans le formulaire sur-mesure (prix poster + supplément 15 €, env
`PRIX_AFFICHE_SM_SUPPLEMENT`). Même tunnel photos → variantes → choix client,
puis `python sur_mesure.py <ref>` détecte le produit et enchaîne affiche.py
automatiquement.
Prérequis UNE FOIS : relancer `site/supabase/schema.sql` (colonnes `produit`/`taille`).
Les uid Gelato des posters (170 g non couché, 21x30 = A4) sont EN DUR dans
`expedier.py`, surchargeables via `GELATO_AFFICHE_<TAILLE>` dans `.env`.
Prix de vente par défaut : 19,90 / 24,90 / 29,90 / 34,90 € (variables Vercel
`PRIX_AFFICHE_21X30` etc. pour ajuster).

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
| `expedier.py` | **Expédie une commande chez Gelato** (livre ou affiche → brouillon → impression) |
| `affiche.py` | Produit l'**affiche/poster** d'une paire (illustration dédiée + prénoms, 4 tailles) |
| `tri_web.py` | **Tri depuis le téléphone** (envoi des variantes → page /admin/tri → rapatriement) |
| `gelato.py` | Client API Gelato (catalogue, cotes, création de commande) — utilisé par `expedier.py` |

**Règle simple :** commande normale → `commandes.py` · commande sur-mesure →
`sur_mesure.py` · option −30 € → `promouvoir_archetype.py` · puis
**`expedier.py <ref>`** (brouillon) et **`expedier.py <ref> --imprimer`**.
