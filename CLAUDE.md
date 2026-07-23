# CLAUDE.md — Projet « Deux comme nous »
Livre pour enfants personnalisé sur la gémellité, vendu aux parents de jumeaux, imprimé à la demande et expédié directement via Gelato. Les parents choisissent un archétype visuel pour chaque jumeau et leurs prénoms. Tous les visuels sont générés par IA (API OpenAI gpt-image), validés humainement, puis assemblés par un pipeline déterministe. Débouché commercial : la communauté Gémellité.com du propriétaire du projet (Simon).
## Décisions structurantes (ne pas remettre en cause sans demander)
- **ARCHITECTURE (révisée par Simon, juillet 2026) : génération INTÉGRALE des pages** — chaque page est générée d'un bloc (scène complète avec les deux jumeaux, gpt-image-1 + références personnage/style/décor), et non plus composée à partir d'assets détourés. Validé par test A/B : intégration très supérieure (câlins réels, ombres et lumière natives). L'ancienne chaîne de composition (briques 1-3, assets détourés) reste fonctionnelle et documentée comme plan B.
- **Personnalisation par archétypes fermés** (pas de génération libre ni d'upload photo à la commande) : **catalogue de 12 archétypes** (`archetypes.yaml`, 6 garçons + 6 filles) — un personnage FIGÉ par archétype (physique + tenue fixe), les parents en choisissent un par jumeau, **mixage libre** (n'importe quelle paire, y compris garçon+fille). Chaque archétype a UNE fiche de référence produite une fois (déclinaison d'une base validée via `archetypes.py`, triée par Simon) puis réutilisée.
  - **Modèle « combo à la commande + cache »** (validé par Simon, juillet 2026) : on ne pré-génère PAS les 78 paires possibles. Grâce au print-on-demand (fenêtre de validation de 1-2 j avant impression), un livre-combo est généré + trié à la **première commande** de cette paire, puis **mis en cache** ; les ventes suivantes de la même combo sont instantanées et gratuites (prénoms injectés en texte vectoriel). On ne dépense que pour les combos réellement vendus.
  - Le **recolorage** (peau/cheveux) sert à fabriquer vite les fiches de référence d'archétypes, PAS à éviter la génération des pages : avec la génération intégrale, chaque combo = ses pages générées d'un bloc.
- **Style graphique figé** : la formulation exacte du style est LA constante du projet. Elle est identique dans tous les prompts de génération. Ne jamais la modifier.
- **Tenue fixe par archétype** : ancre de cohérence pour le modèle d'image. Ne jamais faire varier les vêtements d'un archétype. Exception validée par Simon : la pose `dormir-borde` (enfant bordé sous une couverture bleu clair, tête et bras seuls visibles, col du t-shirt apparent) — utilisée pages 4 et 19 à la place de `dormir`, qui montrait les baskets au lit.
- **Texte jamais dans les images** : tout le texte est vectoriel, posé par le moteur de composition (police Andika, embarquée).
- **Texte épicène** : le texte du livre doit fonctionner pour toute combinaison garçon/fille des archétypes — aucun accord masculin/féminin rapporté à {prenom1} ou {prenom2} (règles détaillées en tête de `manuscrit-livret-test.md`).
- **Format (révisé par Simon)** : livre carré **20×20 cm** (produit Gelato « hardcover photobook 200×200 mm », papier 170 g couché soyeux, pelliculage mat), **30 pages de contenu** = 28 pages illustrées + 2 pages « mot aux parents » (texte seul, sans IA), + gardes + couverture. Le nombre de pages a été ajusté au **minimum imposé par Gelato** (les 2 pages parents comblent les 2 pages manquantes). Fond perdu selon specs Gelato, 300 dpi, PDF sRGB. L'ancien 21×21 n'existe pas au catalogue Gelato.
- **Validation humaine** : chaque image générée est triée/validée par Simon avant d'entrer dans `assets/`. Ne jamais envoyer à l'impression un visuel non validé.
## Pipeline unifié (livre.py)
Un livre = une combinaison d'archétypes = un dossier `livres/<id>/` avec son `livre.yaml`
(références, sélections, prénoms par défaut). Les 30 pages du livret (28 illustrées + 2
pages « mot aux parents ») sont dans `scenes.yaml` (ancres de décor incluses : fichiers pour
chambre/parc, `page:NN` pour les paires jardin 5-6 et salon 13-14). Une page marquée
`texte_seul: true` (pages 29-30) est rendue directement — fond crème, cadre doux, titre +
texte vectoriel — SANS génération IA (gratuit) ; elle est ignorée à la génération et au tri.
**Texte mono/dizygote** : les pages qui reposent sur la ressemblance (07 « on se ressemble »
et 08) ont une variante `texte_dizygote` / `scene_dizygote` dans `scenes.yaml`. `livre.py`
(`champ_page()`) choisit la variante dizygote quand `livre.yaml` porte `monozygote: false`
(archétypes différents) ; sinon la version standard. Par défaut (flag absent) = monozygote,
donc les livres déjà produits ne changent pas.
UN SEUL point d'entrée :
- `livre.command` (double-clic) = `python livre.py <id>` → fait l'étape suivante :
  génération des pages manquantes (coût annoncé + confirmation), puis TRI CLIQUABLE dans
  le navigateur (serveur local, les choix s'enregistrent seuls), puis pages ancrées, puis
  PDF complet + aperçus dans `livres/<id>/`.
- `python livre.py <id> --prenoms "A,B"` = mode COMMANDE CLIENT : PDF final en secondes
  sur une combo validée. C'est ce que le site appellera (formulaire au début, API Gelato ensuite).
Le tri humain reste obligatoire en production de combo, jamais dans le parcours client.

## Personnalisation & commercialisation (cap produit)
Modèle retenu (juillet 2026, validé par Simon) :
- **Catalogue fermé de 12 archétypes** (`archetypes.yaml`, 6 garçons + 6 filles : carnations
  claires/mates/foncées, asiatiques, roux, blonds, bruns, coiffures variées). Fiches de
  référence produites une fois via `archetypes.py` (déclinaison d'une base validée + tri
  Simon), stockées dans `archetypes/<id>.png`. Bases actuelles : `reference.png` (garçon),
  `livres/test-filles/base-luna.png` (fille). 3 fiches déjà validées (g1, f1, f2).
- **Personnalisation client** = choisir un archétype par jumeau (mixage libre) + les prénoms.
  Chaque archétype porte un `distinctif` (petit accessoire) appliqué au SECOND jumeau quand
  les deux enfants choisissent le MÊME archétype, pour les distinguer et mapper les prénoms.
- **Combo à la commande + cache** : un livre-combo (paire d'archétypes) est généré + trié à
  la 1ʳᵉ vente, puis mis en cache ; ventes suivantes instantanées et gratuites. On ne paie
  que les combos vendus (vs 78 combos si tout pré-généré).
- **Économie** : coût Gelato ~23 € / livre → prix de vente premium (cadeau personnalisé) ;
  l'atout décisif est le canal **Gémellité.com** (coût d'acquisition quasi nul). Coût marginal
  IA par vente ≈ 0 (hors 1ʳᵉ vente d'une combo, amortie dès cette vente).
- **Tunnel cible** : communauté → landing → configurateur d'archétypes + prénoms → **aperçu
  live** (les `apercus/*.jpg` avec prénoms) → paiement (Stripe) → `livre.py --prenoms` +
  `gelato.py` commande auto.
- **Phase 2 (si la demande le justifie)** : vrai configurateur « pièce par pièce » façon
  HourraHeros (yeux, coupes…). Ce serait un système d'**illustration vectorielle en couches**
  (pas d'IA), qui scale linéairement avec les looks — mais impose un style flat et un gros
  investissement d'assets modulaires. `compose.py` en est déjà la base. À financer par les
  bénéfices de la phase 1.

## État du projet
| Brique | Contenu | État |
|---|---|---|
| 1 | Script de génération des poses d'un archétype (API OpenAI, config YAML, planche contact) | ✅ Validée — archétype garçon cohérent sur 6 poses |
| 2 | Détourage (rembg/BiRefNet) + upscale ×4 + recadrage → PNG transparents | ✅ Validée — 6 assets propres |
| 3 | Moteur de composition `compose.py` : décor + personnages (x/y/scale/mirror/rotate) + ombre + texte vectoriel avec variables prénoms → PDF gabarit + preview JPEG | ✅ Validée — page test conforme |
| — | Page à deux personnages `chacun-son-rythme` (poses, échelles et plans différents, décor miroir) | ✅ Validée par Simon — ancrage au sol via passe d'harmonisation IA (voir ci-dessous) |
| — | Manuscrit du livret test « Deux comme nous » (20 pages), voir `manuscrit-livret-test.md` | ✅ Rédigé — en attente de relecture par Simon |
| — | 2 pages « mot aux parents » (texte seul, sans IA) — mécanisme `texte_seul`, épicènes (pages 29-30) | ✅ Ajoutées — comblent le minimum de pages Gelato |
| — | Catalogue de 12 archétypes (`archetypes.yaml`) + script de déclinaison/tri (`archetypes.py`) | 🟡 Scaffoldé — 3 fiches validées (g1, f1, f2), 9 à générer |
## Harmonisation IA (ancrage au sol des poses assises/couchées)
Une ellipse ou une ombre procédurale ne suffit pas pour les poses au sol (leçon de la page test : fesses et pieds touchent le sol, l'ombre doit entourer la base, jamais passer dessous). La solution validée : une passe d'édition gpt-image-1 sur la page composée, masque limité au sol (personnage verrouillé pixel par pixel + 2 px de garde), prompt « sol et ombre uniquement », `input_fidelity high`. Outil : `ancrer-jules.command` (à généraliser en script paramétrable par page). ~0,18 $/variante en haute qualité. Les résultats vont dans `output/harmonisation/`, Simon choisit, puis le PDF final est reconstruit à partir du raster retenu avec le texte vectoriel. Payant → toujours annoncer volume et coût avant.

## Prochaines étapes, dans l'ordre
0. **Commande Gelato de test en cours** (test-filles, Elia & Luna, ~23 € le livre) — vérifier le rendu physique à réception.
0.a **Catalogue d'archétypes** : générer les 9 fiches manquantes (`python archetypes.py`, coût annoncé avant, ~quelques $) puis tri Simon → 12 fiches validées dans `archetypes/`.
0.b **Générateur de livres-combos** (`combo.py`, ✅ scaffoldé) : `python combo.py <archétype1> <archétype2>` crée le `livre.yaml` d'une combo depuis `archetypes.yaml` (id canonique = paire triée pour le cache ; réutilise les fiches validées comme références directes, gratuites ; ne génère une variante `distinctif` que pour une paire identique), puis `python livre.py <combo>` lance le pipeline en mode « combo à la commande + cache ».
0.c **Front-end de commande** (`site/`, Next.js 15, ✅ EN PRODUCTION sur **https://boutique.gemellite.com**, déployé via Vercel depuis GitHub `nostradamu21-maker/livrejumeaux`, root = `site`) : configurateur d'archétypes + prénoms + aperçu live, **sélecteur d'accessoire distinctif** pour les paires identiques (vignettes illustrées `site/public/accessoires/`, générées sur g1), section « sur mesure » 129 € (option −15 € si réutilisation du personnage, RGPD photo supprimée après génération). Stripe + Supabase câblés (mock si non configurés) ; le parcours client ne génère aucune image ni tri. Le sur-mesure a son **paiement Stripe** (129 €/114 € via `/api/sur-mesure`) avec **upload de photo** : 1 photo (monozygotes) ou 2 (dizygotes), réduites côté navigateur, bucket privé Supabase `sur-mesure`, liens signés 30 j dans l'email interne, à supprimer après génération. **Après paiement**, `/commande/variantes` génère automatiquement **3 variantes de personnage par photo** (gpt-image-1 via `site/lib/generation.ts`, clé `OPENAI_API_KEY` Vercel, qualité `GEN_QUALITE`, style figé repris tel quel) et le client choisit sa préférée par enfant (table `sur_mesure`, notification email du choix) — la validation humaine de Simon reste requise avant impression. Monozygotes : **signe distinctif obligatoire** (sélecteur d'accessoires du configurateur) → 2 jeux de variantes générés depuis la même photo (base + version avec l'accessoire pour le second jumeau). Livraison 4,99 € + collecte d'adresse au checkout. Emails transactionnels via Resend (`site/lib/email.ts`, no-op sans clé). Pages légales (`/mentions-legales`, `/cgv`, `/confidentialite`), SEO (métadonnées, JSON-LD, sitemap/robots). Reste à activer les clés en prod (Stripe live, Resend) + la vraie commande `gelato.py`. L'ancien scaffold Flask `serveur.py` + `web/` reste comme plan B.
1. (ancienne chaîne, plan B) Ajouter 3 poses au catalogue (`sauter`, `montrer-du-doigt`, `rire`) via la config de la brique 1 — ce sont les seules poses bloquantes pour composer tout le livret.
2. Générer l'**archétype fille** (référence fournie par Simon) : briques 1 puis 2.
3. Utiliser `rotate` pour les scènes de sommeil (personnages couchés sur les lits) — pages 4 et 19 du manuscrit.
4. Créer les layouts JSON des 20 pages du manuscrit + les composer (notes de production page par page dans le manuscrit). Au passage : passer le texte de `layouts/page-test.json` à « en premier » (épicène). Prévoir la passe d'harmonisation IA pour les pages avec personnages assis/couchés (généraliser `ancrer-jules.command`).
5. Couverture au gabarit Gelato (avec dos) — vérifier les specs et le nombre de pages minimum du format sur le site Gelato avant de finaliser la pagination (le manuscrit prévoit 4 pages optionnelles si 24 pages sont imposées).
6. Assembler le PDF complet du livret et préparer la commande test Gelato.
## Structure du dossier
- `brief-claude-code-brique{1,2,3}.md` — les briefs d'origine des briques (référence).
- `manuscrit-livret-test.md` — texte complet du livret (20 pages) avec règles d'écriture et notes de production page par page.
- `reference.png`, `style1.png`, `style2.png` — références personnage et style.
- `config.yaml` — config brique 1 (archétype en cours, poses, style).
- `archetypes.yaml` — catalogue des 12 archétypes (genre, physique, tenue fixe, distinctif, base).
- `archetypes.py` — production + tri des fiches de référence d'archétypes (déclinaison d'une base).
- `combo.py` — générateur de livres-combos : prépare le `livre.yaml` d'une paire d'archétypes (`python combo.py <a1> <a2>`), réutilise les fiches validées comme références directes (gratuit), distinctif généré seulement pour les paires identiques. Aucune image générée par ce script. Écrit un flag `monozygote: true/false` dans le `livre.yaml`. Option `--accessoire <id>` : pour une paire IDENTIQUE, applique l'accessoire distinctif CHOISI par le parent (doudou-lapin/ours/chat, lunettes, casquette, foulard) au 2ᵉ jumeau ; l'id de cache devient `combo-{a}__{b}__acc-{id}` (aligné sur `site/lib/combo.ts`).
- `commandes.py` (+ `commandes.command`) — **relève des commandes du site** : lit les commandes non traitées dans Supabase (clés `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` dans `.env`, appels via curl comme `gelato.py`), affiche l'état de chaque combo (en cache / à trier / à produire) et le **coût API estimé**, demande confirmation, puis enchaîne pour chaque commande : `combo.py` si besoin → `livre.py <combo>` (génération + tri) → `livre.py --prenoms` (PDF client) → marque la commande traitée (`traitee_le`) et **enregistre la combo dans la table `combos`** (cache côté site). `--liste` = consultation seule. Nécessite la colonne `traitee_le` (voir `site/supabase/schema.sql`).
- `test_doudou.py` — test ponctuel : ajoute un doudou dans les bras d'une fiche validée (g1) pour valider le rendu d'un accessoire (2 variantes). Sortie `output/test-doudou/`.
- `generer_accessoires.py` — génère les vignettes d'aperçu des accessoires du sélecteur (décline g1 avec chaque accessoire, medium) dans `site/public/accessoires/<id>.png` ; réutilise le doudou lapin déjà généré (gratuit). Payant → annoncer le coût.
- `site/` — **front-end de commande de PRODUCTION** (Next.js 15 / React 19 / TS, App Router), déployé sur Vercel → **https://boutique.gemellite.com** (repo GitHub `nostradamu21-maker/livrejumeaux`, root Vercel = `site`). Remplace le scaffold Flask `serveur.py` (conservé comme plan B). Configurateur d'archétypes + prénoms + aperçu live, sélecteur d'accessoire distinctif (paires identiques), section « sur mesure » 129 € (option −15 € si réutilisation du personnage, mention RGPD photo supprimée après génération). Stripe + Supabase câblés (mock si non configurés). Catalogue porté dans `site/lib/catalogue.ts` (champ `label` client SANS mention de peau ; `description` technique la garde pour la génération). Le parcours client ne génère aucune image.
- `serveur.py` + `web/` — ancien front-end Flask (phase 1, plan B) : `python serveur.py` → http://127.0.0.1:5001/. Écrit les commandes dans `livres/commandes.json`. Ne génère aucune image.
- `archetypes/` — fiches de référence validées (`<id>.png`) ; `_variantes/` = variantes en attente de tri.
- `site/public/accessoires/` — vignettes illustrées des accessoires distinctifs (générées sur g1) affichées dans le sélecteur du configurateur.
- `output/archetype-test/` — générations brutes de la brique 1 (4 variantes par pose + planche contact).
- `selected/archetype1/` — générations retenues (brutes, une par pose).
- `assets/archetype1/` — PNG transparents haute résolution prêts à composer.
- `backgrounds/` — décors (`chambre`, `parc`) ; `.cache/` = versions plein format mises en cache par `compose.py`.
- `layouts/` — un JSON par page (`page-test`, `chacun-son-rythme`).
- `fonts/` — Andika (OFL).
- `output/pages/`, `output/previews/` — PDF et aperçus.
- `.env` — clé API OpenAI. Ne jamais l'afficher, la copier ni la committer.
## Règles de travail avec Simon
- Répondre en français.
- Avant toute génération d'images payante : annoncer le volume et le coût estimé, attendre confirmation.
- Signaler explicitement toute décision prise qui s'écarte d'un brief (comme fait jusqu'ici).
- Les choix artistiques (tri des images, DA, texte du livre) appartiennent à Simon : proposer, ne pas décider.
