# Manuscrit — « Deux comme nous »

Livret test, 20 pages intérieures. Public : enfants d'environ 4 ans, lus par leurs parents.
Propos : expliquer la gémellité avec bienveillance — on peut être deux, se ressembler,
et être chacun pleinement soi. Ni comparaison, ni « meilleur des deux » : les différences
sont toujours présentées comme une richesse, jamais comme un défaut.

## Règles d'écriture (à respecter dans toute adaptation)

- **Texte épicène** : les phrases fonctionnent quel que soit le sexe de chaque jumeau
  (archétypes garçon/fille librement combinés). Aucun adjectif accordé au masculin ou au
  féminin ne doit se rapporter à `{prenom1}` ou `{prenom2}`. On écrit « en premier »
  (invariable) et pas « le premier » ; « chacun joue de son côté » et pas « il joue tout seul » ;
  « le chagrin est moins lourd » et pas « on est moins triste(s) ». Le mot « jumeaux » lui-même
  n'apparaît jamais dans le texte des pages (il genrerait le duo) — seulement « deux », « à deux »,
  « ensemble ».
- **Variables** : `{prenom1}` et `{prenom2}` uniquement. Alterner qui mène l'action :
  ni l'un ni l'autre n'est « le héros » (comptage actuel : chacun mène ~la moitié des pages).
- **Longueur** : 1 à 3 phrases courtes par page, vocabulaire de 4 ans, sons répétés,
  rythme oral (le livre sera lu à voix haute).
- **Ton** : chaleureux, apaisant, jamais moqueur. La dispute (p. 13) est normalisée
  (« ça arrive, même quand on s'aime très fort ») puis réparée (p. 14).

## Ressources nécessaires

- **Poses existantes** : `face-sourire`, `profil-marche`, `courir`, `assis-lecture`, `dormir`, `calin`.
- **Poses à ajouter** (déjà prévues au CLAUDE.md) : `sauter`, `montrer-du-doigt`, `rire`.
- **Décors existants** : `chambre`, `parc`. Aucun autre décor n'est indispensable pour le
  livret test. Option qualité : une variante `chambre-soir` (lumière tamisée) pour les
  pages 18-19 — à défaut, réutiliser `chambre` telle quelle.
- Deux archétypes en scène sur la plupart des pages : jumeau A = `{prenom1}`,
  jumeau B = `{prenom2}`. Pour le livret test, les deux sont l'archétype 1.

---

## Page 1 — Ouverture

**Texte :**
> Bonjour {prenom1} ! Bonjour {prenom2} !
> Vous êtes deux, comme le soleil et la lune.
> Deux, depuis le tout début.

**Production :** décor `chambre`. A : `face-sourire`, avant-plan gauche (scale ~0.44).
B : `face-sourire` en miroir, léger arrière-plan droite (scale ~0.40, rotate 2). Éviter
la symétrie : hauteurs de sol et échelles différentes.

## Page 2 — Une chambre pour deux

**Texte :**
> Deux lits, deux doudous, deux paires de chaussures…
> Et une chambre pour deux !

**Page décor** : `chambre` seule, sans personnage (le décor contient déjà les deux lits).
Texte en haut, comme les autres pages. Page de respiration — utile aussi pour caler
la pagination.

## Page 3 — Le réveil

**Texte :**
> {prenom1} ouvre les yeux en premier, comme tous les matins.

**Production :** page-test existante (`layouts/page-test.json`) ; remplacer « le premier »
par « en premier » (épicène) dans le layout.

## Page 4 — Chacun se réveille à sa façon

**Texte :**
> Chut… {prenom2} dort encore un petit peu.
> Chacun se réveille à sa façon.

**Production :** décor `chambre`. B : `dormir` avec `rotate` ≈ 90 pour l'allonger sur le
lit de droite (valider l'étape « rotate scènes de sommeil »). A : `face-sourire` ou
`profil-marche`, petit, à distance du lit, un doigt sur la bouche si une pose dédiée
est ajoutée un jour (sinon la pose existante suffit, le texte porte le « chut »).

## Page 5 — On se ressemble

**Texte :**
> Deux nez, deux sourires qui se ressemblent…
> Parfois, on vous mélange !
> « Tu es {prenom1}, ou tu es {prenom2} ? »

**Production :** décor `parc` ou `chambre`. A et B : `face-sourire` côte à côte —
ici la quasi-symétrie est VOULUE (c'est la page de la ressemblance), la seule du livre.
Différencier quand même légèrement les échelles (0.42 / 0.44).

## Page 6 — Chacun est soi

**Texte :**
> Pas de souci : il suffit de bien regarder avec le cœur.
> {prenom1} est {prenom1}. {prenom2} est {prenom2}.
> Et personne d'autre au monde !

**Production :** même duo que p. 5 mais composition cassée : A avant-plan
(`montrer-du-doigt` vers soi quand la pose existera, sinon `face-sourire`),
B arrière-plan avec `mirror`.

## Page 7 — En route !

**Texte :**
> Un, deux ! Un, deux !
> Sur le chemin du parc, on marche du même pas.

**Production :** décor `parc` (zone chemin). A et B : `profil-marche`, même direction,
échelles différentes (0.50 / 0.42) pour créer une file avec profondeur, l'un devant l'autre.

## Page 8 — Jouer ensemble

**Texte :**
> Au parc, {prenom1} et {prenom2} courent et sautent.
> À deux, c'est deux fois plus rigolo !

**Production :** décor `parc`. A : `courir` avant-plan. B : `sauter` (pose à créer)
arrière-plan, `mirror` pour croiser les trajectoires. En attendant la pose : `courir`
en miroir avec échelle nettement différente.

## Page 9 — Chacun son rythme

**Texte :**
> {prenom1} court sans s'arrêter, {prenom2} lit sous l'arbre.
> Chacun son rythme !

**Production :** page existante validée (`layouts/chacun-son-rythme.json`, version corrigée).

## Page 10 — Chacun ses goûts

**Texte :**
> {prenom2} adore les histoires de dragons.
> {prenom1} préfère compter les nuages.
> Et c'est très bien comme ça !

**Production :** décor `parc`. B : `assis-lecture` avant-plan. A : `face-sourire` tête
levée vers le ciel, arrière-plan (ou pose dédiée plus tard). Nuages du décor bienvenus.

## Page 11 — Le rire qui s'attrape

**Texte :**
> Quand {prenom1} rit, {prenom2} rit aussi.
> Le rire, à deux, ça s'attrape !

**Production :** décor `parc`. A et B : `rire` (pose à créer), face à face grâce au
`mirror`, échelles proches mais rotations opposées (+3 / −3) pour l'énergie.

## Page 12 — S'entraider

**Texte :**
> « Regarde là-bas ! » montre {prenom2}.
> À deux, on voit deux fois plus de choses.

**Production :** décor `parc`. B : `montrer-du-doigt` (pose à créer) avant-plan.
A : `profil-marche` ou `courir` petit, dans la direction pointée. La profondeur fait la scène.

## Page 13 — La dispute

**Texte :**
> Parfois, on n'est pas d'accord.
> « C'est mon livre ! — Non, c'est le mien ! »
> Ça arrive, même quand on s'aime très fort.

**Production :** décor `chambre`. A et B dos à dos : `profil-marche` + version `mirror`,
têtes à l'opposé, un peu d'espace entre les deux. L'`assis-lecture` peut fournir le livre
au sol en post-composition plus tard — sinon le texte suffit. Pose « bouder » possible
à ajouter au catalogue si le rendu manque d'expressivité (à décider après essai).

## Page 14 — Le câlin

**Texte :**
> Un gros câlin… et hop !
> La colère s'envole comme un petit nuage.

**Production :** décor `chambre`. A et B : `calin` face à face (`mirror` sur l'un),
proches, échelles quasi égales. Attention aux bras : chevauchement à régler finement
avec x et l'ordre de profondeur.

## Page 15 — Toujours là

**Texte :**
> Les jours de gros chagrin, {prenom2} n'est jamais loin de {prenom1}.
> À deux, le chagrin est deux fois moins lourd.

**Production :** décor `parc` (coin banc) ou `chambre`. A : `assis-lecture` sans livre
impossible — utiliser `face-sourire` petit, tête basse via `rotate` léger (−6), ou
prévoir pose `assis-calme` si besoin. B : `calin` ou `face-sourire` tourné vers A.
Scène douce, personnages proches.

## Page 16 — Chacun de son côté

**Texte :**
> Des fois, chacun joue de son côté.
> C'est bien aussi, d'être un peu tranquille.

**Production :** décor `chambre`. A : `assis-lecture` coin gauche. B : `face-sourire`
coin droit près des jouets du décor. Grande distance entre les deux, échelles égales —
la séparation est le sujet, aucune tension.

## Page 17 — Se retrouver

**Texte :**
> Et après… quelle joie de se retrouver !
> « On joue ensemble ? — Oh oui ! »

**Production :** décor `chambre` ou `parc`. A : `courir` vers B. B : `calin` bras ouverts.
Mouvement convergent, échelles proches.

## Page 18 — Le soir

**Texte :**
> Le soir, c'est deux pyjamas, deux bisous, deux doudous.
> Un pour chacun, et beaucoup d'amour pour deux.

**Production :** décor `chambre` (variante `chambre-soir` si créée). A et B :
`face-sourire` + `mirror`, chacun près de son lit, échelles différentes.

## Page 19 — Bonne nuit

**Texte :**
> Bonne nuit {prenom1}. Bonne nuit {prenom2}.
> Les rêves arrivent… un pour chacun.

**Production :** décor `chambre` (ou `chambre-soir`). A et B : `dormir` avec `rotate`
pour les allonger chacun sur son lit (A lit gauche, B lit droit `mirror`). C'est LA page
de validation du `rotate` sommeil.

## Page 20 — Deux comme nous

**Texte :**
> Des ressemblances, des différences… ensemble, et chacun soi.
> Deux comme nous, c'est deux fois plus d'amour !

**Production :** décor `parc`. A et B : `calin` côte à côte face lecteur, ou `face-sourire`
+ `rire`. Composition ample et joyeuse, personnages bien centrés — page finale, la plus
« affiche » du livre.

---

## Notes de pagination

- 20 pages intérieures + couverture (avec dos, gabarit Gelato — étape 6 du CLAUDE.md).
  Vérifier le minimum de pages du format 21×21 chez Gelato avant de figer ; si un
  multiple de 4 impose 24 pages, ajouter : page de titre intérieure, page de garde
  illustrée (décor seul), page dédicace « Ce livre appartient à {prenom1} et {prenom2} »,
  et une page « couleurs préférées » — textes à écrire le moment venu.
- Poses réellement bloquantes pour composer tout le livret : `sauter` (p. 8), `rire`
  (p. 11), `montrer-du-doigt` (p. 6, 12). Tout le reste se compose avec le catalogue actuel.
