// Internationalisation du site : FR (défaut, racine), EN, ES, DE.
// Les prix restent en euros, identiques partout. Le TEXTE DU LIVRE imprimé
// est pour l'instant en français : les versions EN/ES/DE l'annoncent
// honnêtement (note + FAQ).

export type Locale = "fr" | "en" | "es" | "de";
export const LOCALES: Locale[] = ["fr", "en", "es", "de"];
export const LOCALE_DEFAUT: Locale = "fr";

export function estLocale(x: string): x is Locale {
  return (LOCALES as string[]).includes(x);
}

/** Préfixe d'URL pour une langue ("" pour le français, servi à la racine). */
export function prefixe(l: Locale): string {
  return l === "fr" ? "" : `/${l}`;
}

export interface QA {
  q: string;
  r: string;
}

export interface Dict {
  meta: {
    title: string;
    description: string;
    keywords: string[];
    ogTitle: string;
    ogDesc: string;
  };
  nav: { livre: string; pourquoi: string; offrir: string; questions: string; cta: string };
  hero: {
    eyebrow: string;
    h1a: string; // avant le mot en italique
    h1em: string; // le mot en italique
    lead: string;
    ctaCreer: string;
    ctaFeuilleter: string;
    points: [string, string, string];
    alt: string;
  };
  flip: {
    h2: string;
    sub: string;
    hintClic: string;
    page: string; // « Page »
    exA: string; // avant « Elia & Luna »
    exB: string; // avant les prénoms défilants
    exC: string; // après
    prenoms: [string, string][];
  };
  pourquoi: {
    h2a: string;
    h2em: string;
    sub: string;
    cartes: { icone: string; titre: string; texte: string }[];
  };
  etapes: { h2: string; liste: { t: string; p: string }[]; cta: string };
  config: {
    h2: string;
    sub: string;
    afficher: string;
    filtreTous: string;
    filtreGarcons: string;
    filtreFilles: string;
    premier: string;
    second: string;
    phPrenom: string;
    couvChoisir: string;
    couvAjouter: string;
    enfant: string;
    distinctifTete: string;
    prixNote: string;
    phEmail: string;
    cta: string;
    mentionCgv: string;
    cgv: string;
    noteApercu: string;
    noteLangue: string; // "" en FR ; ailleurs : le texte du livre est en français
    btnApercu: string;
    btnApercuHint: string;
    stTraitement: string;
    stRedirection: string;
    stErreur: string;
    stServeur: string;
  };
  visionneuse: {
    couverture: string;
    fermer: string;
    precedente: string;
    suivante: string;
    note: string;
  };
  sm: {
    eyebrow: string;
    h2: string;
    intro: string;
    points: [string, string, string, string];
    comment: string;
    prixNote: string;
    phP1: string;
    phP2: string;
    phEmail: string;
    zyIdent: string;
    zyIdentSub: string;
    zyDiff: string;
    zyDiffSub: string;
    distinctifAvant: string; // avant le prénom
    distinctifApres: string; // après le prénom
    leSecond: string;
    photoMono: string;
    photoDe: string; // « Photo de »
    premierEnfant: string;
    secondEnfant: string;
    photoNote: string;
    vousEtes: string;
    relParent: string;
    relGrandParent: string;
    relOncleTante: string;
    relParrain: string;
    relProche: string;
    consentement: string;
    obligatoire: string;
    option15: string;
    cta: string;
    question: string;
    ecrivez: string;
    reponse: string;
  };
  cadeau: {
    eyebrow: string;
    h2: string;
    texte: string;
    occasions: [string, string, string, string];
    cta: string;
  };
  faq: { titre: string; items: QA[] };
  footer: { tagline: string; seo: string; fin: string; mentions: string; cgv: string; conf: string };
  barre: { note: string; cta: string };
  succes: {
    merciTitre: string;
    merciMsg: string;
    nonFinal: string;
    nonFinalMsg: string;
    introuvable: string;
    introuvableMsg: string;
    smTitre: string;
    smMsg: (p1: string, p2: string) => string;
    livreMsg: (p1: string, p2: string) => string;
    choisir: string;
    retour: string;
  };
  variantes: {
    titre: string;
    intro1: string;
    introN: string;
    persoDe: string;
    avecSigne: string; // suffixe « avec son signe distinctif »
    proposition: string;
    attente: string;
    valider: string;
    merci: string;
    merciMsg: (p1: string, p2: string) => string;
    photosRecues: string;
    photosRecuesMsg: (p1: string, p2: string) => string;
    lienInvalide: string;
    chargement: string;
    introuvable: string;
  };
  archetypes: Record<string, string>; // labels par id (vide en FR = catalogue)
  accessoires: Record<string, string>;
}

const FR: Dict = {
  meta: {
    title: "Cadeau jumeaux & jumelles : le livre personnalisé | Deux comme nous",
    description:
      "LE cadeau des parents de jumeaux : un livre personnalisé où vos deux enfants sont les héros de la même histoire. Prénoms, personnages à leur image, relié 20×20 cm. Cadeau de naissance ou d'anniversaire pour jumeaux et jumelles, expédié chez vous.",
    keywords: [
      "cadeau jumeaux", "cadeau jumelles", "cadeau parents de jumeaux", "cadeau naissance jumeaux",
      "cadeau anniversaire jumeaux", "livre personnalisé jumeaux", "livre personnalisé jumelles",
      "idée cadeau jumeaux", "cadeau original jumeaux",
    ],
    ogTitle: "Cadeau jumeaux & jumelles : le livre personnalisé Deux comme nous",
    ogDesc:
      "Enfin une histoire où ils sont deux : le livre personnalisé qui célèbre le lien de vos jumeaux, relié et expédié chez vous. Le cadeau préféré des parents de jumeaux.",
  },
  nav: { livre: "Le livre", pourquoi: "Pourquoi", offrir: "Offrir", questions: "Questions", cta: "Créer le vôtre" },
  hero: {
    eyebrow: "Le cadeau des parents de jumeaux",
    h1a: "Enfin une histoire",
    h1em: "deux",
    lead:
      "Le livre personnalisé pensé pour les jumeaux : leurs prénoms, leur allure, leur complicité. Ensemble sur chaque page, du premier câlin au dernier bisou du soir.",
    ctaCreer: "Créer leur livre",
    ctaFeuilleter: "Feuilleter un exemple",
    points: [
      "Deux héros à leur image",
      "Relié 20×20 cm, vérifié à la main",
      "Par les créateurs de Jumelio & Gemellite.com",
    ],
    alt: "Livre personnalisé pour jumelles : couverture avec les deux enfants, cadeau pour jumeaux et jumelles",
  },
  flip: {
    h2: "Feuilletez un exemplaire réel",
    sub:
      "Voici le livre personnalisé d'Elia & Luna : tournez les pages pour découvrir les illustrations douces à l'aquarelle. Extrait de quelques pages, le livre complet en compte 30.",
    hintClic: "Cliquez pour tourner les pages",
    page: "Page",
    exA: "Dans cet exemplaire, les héroïnes s'appellent",
    exB: "Dans le vôtre, ce sont",
    exC: "Vos prénoms, sur chaque page.",
    prenoms: [["Léo", "Emma"], ["Jade", "Tom"], ["Noah", "Lina"], ["Gabin", "Rose"], ["Sacha", "Alix"], ["Maël", "Nina"]],
  },
  pourquoi: {
    h2a: "Les albums personnalisés n'ont qu'un héros.",
    h2em: "Vos enfants sont deux.",
    sub:
      "Offrir deux livres séparés à des jumeaux, c'est raconter deux histoires qui s'ignorent. « Deux comme nous » est écrit pour eux : une seule histoire, leurs deux prénoms, leur lien au centre de chaque page.",
    cartes: [
      { icone: "👑👑", titre: "Deux héros, une histoire", texte: "Ils apparaissent ensemble sur chaque illustration, câlins, fous rires et bêtises compris. Pas un héros et son figurant : deux premiers rôles." },
      { icone: "✨", titre: "Chacun sa place", texte: "Chacun son prénom, son personnage, son caractère. Le livre célèbre leur complicité et ce qui les rend uniques. Jamais « les jumeaux », toujours eux deux." },
      { icone: "💛", titre: "Par des parents de jumeaux", texte: "Par les créateurs de Jumelio et Gemellite.com. Les rythmes différents, la ressemblance, le « toi et moi » : tout ce que vous vivez est dans le texte." },
      { icone: "📖", titre: "Fait pour durer", texte: "Couverture rigide 20×20 cm, papier épais, 30 pages illustrées et vérifiées une à une avant impression. Le genre de livre qu'on garde." },
    ],
  },
  etapes: {
    h2: "Un cadeau unique en trois minutes",
    liste: [
      { t: "Vous composez", p: "Un personnage et un prénom pour chaque enfant. Votre duo et leurs prénoms s'affichent en direct dans l'aperçu." },
      { t: "Nous soignons chaque page", p: "Les illustrations sont personnalisées puis vérifiées une à une, à la main, avant d'être confiées à l'imprimeur." },
      { t: "Ils se découvrent en héros", p: "Le livre arrive relié chez vous. Il ne reste qu'à ouvrir la première page, et à la relire tous les soirs." },
    ],
    cta: "Créer leur livre",
  },
  config: {
    h2: "Composez le livre de vos jumeaux",
    sub: "Choisissez un personnage pour chacun, ajoutez leurs prénoms, et voyez la couverture de leur livre personnalisé prendre vie.",
    afficher: "Afficher :",
    filtreTous: "Tous", filtreGarcons: "Garçons", filtreFilles: "Filles",
    premier: "Premier enfant", second: "Second enfant",
    phPrenom: "Son prénom",
    couvChoisir: "Choisissez deux archétypes",
    couvAjouter: "Ajoutez les prénoms",
    enfant: "Enfant",
    distinctifTete: "Jumeaux monozygotes : choisissez un petit détail pour distinguer le second.",
    prixNote: "+ 4,99 € de livraison suivie",
    phEmail: "Votre e-mail (facultatif)",
    cta: "Commander notre livre",
    mentionCgv: "Livre personnalisé : pas de droit de rétractation (art. L221-28)",
    cgv: "CGV",
    noteApercu: "Aperçu indicatif : sur la couverture imprimée, vos deux héros sont illustrés ensemble dans une scène complète.",
    noteLangue: "",
    btnApercu: "✨ Feuilleter de vraies pages avec vos prénoms",
    btnApercuHint: "ajoutez d'abord les deux prénoms",
    stTraitement: "Traitement…",
    stRedirection: "Redirection vers le paiement sécurisé…",
    stErreur: "Une erreur est survenue.",
    stServeur: "Serveur injoignable.",
  },
  visionneuse: {
    couverture: "Couverture",
    fermer: "Fermer",
    precedente: "Page précédente",
    suivante: "Page suivante",
    note: "Extrait de quelques pages seulement : le livre complet compte 30 pages. Vraies pages d'un exemplaire imprimé, avec vos prénoms ; votre livre est vérifié page à page avant impression.",
  },
  sm: {
    eyebrow: "Édition sur mesure",
    h2: "Vous ne trouvez pas de ressemblance ?",
    intro: "Nos douze personnages ne ressemblent pas assez à vos enfants ? Nous créons leur livre entièrement sur mesure, à leur image, à partir d'une simple photo.",
    points: [
      "Personnages dessinés d'après vos photos",
      "Vous choisissez parmi 3 propositions par enfant, juste après la commande",
      "Même livre relié 20×20 cm (+ 4,99 € de livraison)",
      "Vos photos ne sont jamais conservées : supprimées automatiquement dès que le livre est généré.",
    ],
    comment: "Comment ça marche ? Vous ajoutez la ou les photos et payez en ligne. Dans la minute, vous choisissez vos personnages préférés parmi nos propositions. Nous créons le livre, vous validez, nous imprimons.",
    prixNote: "livre sur mesure, à partir d'une photo",
    phP1: "Prénom du premier enfant",
    phP2: "Prénom du second enfant",
    phEmail: "Votre e-mail (facultatif)",
    zyIdent: "Identiques", zyIdentSub: "une seule photo suffit",
    zyDiff: "Différents", zyDiffSub: "une photo par enfant",
    distinctifAvant: "Un petit détail pour distinguer", distinctifApres: "dans le livre :",
    leSecond: "le second",
    photoMono: "Ajouter la photo de vos enfants",
    photoDe: "Photo de",
    premierEnfant: "votre premier enfant",
    secondEnfant: "votre second enfant",
    photoNote: "Visages bien visibles, JPEG ou PNG. Photos supprimées après création du livre.",
    vousEtes: "Vous êtes :",
    relParent: "Parent des enfants", relGrandParent: "Grand-parent", relOncleTante: "Oncle / tante",
    relParrain: "Parrain / marraine", relProche: "Autre proche de la famille",
    consentement: "Je certifie avoir plus de 18 ans et disposer de l'autorisation des parents (ou représentants légaux) des enfants pour l'utilisation de cette photo.",
    obligatoire: "Obligatoire.",
    option15: "−15 € : j'accepte que le personnage dessiné (jamais la photo) soit conservé pour de futures créations.",
    cta: "Commander mon livre sur mesure",
    question: "Une question d'abord ?", ecrivez: "Écrivez-nous", reponse: "réponse sous 48 h.",
  },
  cadeau: {
    eyebrow: "Vous cherchez un cadeau pour des jumeaux ou des jumelles ?",
    h2: "Vous venez de le trouver.",
    texte: "Demandez aux parents de jumeaux : les cadeaux de naissance arrivent en double, jamais pensés pour deux. Offrez celui qui ne finit pas au fond d'un placard, l'anniversaire qui fait briller deux paires d'yeux d'un coup. Il vous suffit de connaître leurs prénoms, on s'occupe du reste : le livre est imprimé puis expédié directement chez eux.",
    occasions: ["🍼 Naissance & baby shower", "🎂 Premier anniversaire", "🎄 Noël", "🌟 Grands-parents, parrains & marraines"],
    cta: "Offrir ce livre",
  },
  faq: {
    titre: "Vos questions",
    items: [
      { q: "Quel cadeau offrir à des jumeaux ou à des parents de jumeaux ?", r: "Un cadeau que les parents de jumeaux n'ont jamais reçu deux fois : un livre personnalisé où leurs deux enfants sont les héros de la même histoire. Contrairement aux cadeaux de naissance classiques (achetés en double), « Deux comme nous » célèbre ce que ces enfants ont d'unique : être deux. Il suffit de connaître leurs prénoms pour l'offrir, à la naissance, à un anniversaire ou à Noël." },
      { q: "Pour quel âge est-ce adapté ?", r: "De la naissance à 6 ans environ. Offert à la naissance, c'est un souvenir qui grandit avec eux ; vers 2-3 ans, c'est l'histoire du soir qu'ils réclament : celle où les héros portent leurs prénoms." },
      { q: "Ça marche pour un garçon et une fille ?", r: "Oui ! Toutes les combinaisons sont possibles : deux garçons, deux filles (un cadeau de jumelles très demandé), ou un garçon et une fille. Le texte est écrit pour fonctionner naturellement dans tous les cas." },
      { q: "Nos jumeaux sont identiques… comment les distinguer dans le livre ?", r: "C'est prévu : si vous choisissez le même personnage pour les deux, vous sélectionnez un petit détail (doudou, lunettes, casquette, foulard) que porte le second sur toutes les pages. Chacun se reconnaît au premier coup d'œil." },
      { q: "Quels sont les délais et frais de livraison ?", r: "Chaque livre est imprimé à la demande puis expédié directement chez vous en livraison suivie (4,99 €). Comptez environ une semaine en tout. Si votre combinaison de personnages est créée pour la première fois, nous ajoutons 1 à 2 jours pour vérifier chaque illustration à la main." },
      { q: "Quelle est la qualité du livre ?", r: "Un vrai livre relié : format carré 20×20 cm, couverture rigide avec pelliculage mat, papier épais 170 g soyeux, 30 pages. Conçu pour être lu, relu, mordillé et transmis." },
      { q: "Et si aucun personnage ne leur ressemble ?", r: "Nous proposons une édition sur mesure : envoyez-nous une photo et nous dessinons leurs personnages à leur image. Votre photo est supprimée dès le livre créé." },
    ],
  },
  footer: {
    tagline: "Le livre personnalisé des jumeaux et des jumelles : deux héros, une histoire.",
    seo: "« Deux comme nous » est le cadeau pour jumeaux et jumelles imaginé par des parents de jumeaux : un livre personnalisé avec leurs prénoms, à offrir à la naissance, pour un anniversaire ou à Noël. Une idée cadeau originale pour des jumeaux, expédiée en France, en Belgique, en Suisse et au-delà.",
    fin: "Par les créateurs de Jumelio & Gemellite.com, des parents de jumeaux, pour des parents de jumeaux. 💛",
    mentions: "Mentions légales", cgv: "CGV", conf: "Confidentialité",
  },
  barre: { note: "+ 4,99 € de livraison", cta: "Créer leur livre" },
  succes: {
    merciTitre: "Merci ! Commande confirmée",
    merciMsg: "Votre commande est bien enregistrée. Nous préparons votre livre et vous tenons informé par e-mail.",
    nonFinal: "Paiement non finalisé",
    nonFinalMsg: "Le paiement n'a pas été confirmé. Aucun montant n'a été débité.",
    introuvable: "Paiement introuvable",
    introuvableMsg: "Nous n'avons pas pu retrouver votre paiement.",
    smTitre: "Merci ! Photo bien reçue",
    smMsg: (p1, p2) => `Votre édition sur mesure pour ${p1} & ${p2} est confirmée et vos photos sont bien reçues. Choisissez maintenant vos personnages préférés parmi nos propositions dessinées d'après vos photos.`,
    livreMsg: (p1, p2) => `Le livre de ${p1} & ${p2} est en préparation. Nous validons les illustrations puis il est imprimé et expédié chez vous.`,
    choisir: "Choisir nos personnages",
    retour: "Revenir à l'accueil",
  },
  variantes: {
    titre: "Choisissez vos personnages",
    intro1: "Voici les personnages dessinés d'après votre photo. Choisissez votre préféré : il servira de référence pour tout le livre.",
    introN: "Voici les personnages dessinés d'après vos photos. Choisissez votre préféré pour chaque enfant : il servira de référence pour tout le livre.",
    persoDe: "Le personnage de",
    avecSigne: "avec son signe distinctif",
    proposition: "Proposition",
    attente: "🎨 Nous dessinons les propositions… environ une minute, la page se met à jour toute seule.",
    valider: "Valider mon choix",
    merci: "Merci ! 💛",
    merciMsg: (p1, p2) => `Vos personnages sont choisis. Nous créons maintenant le livre de ${p1} & ${p2}, vous validez les illustrations par e-mail, puis il part à l'impression.`,
    photosRecues: "Vos photos sont bien reçues",
    photosRecuesMsg: (p1, p2) => `Nous préparons les personnages de ${p1} & ${p2} et vous les proposerons par e-mail sous 24 h pour validation.`,
    lienInvalide: "Lien invalide.",
    chargement: "Chargement…",
    introuvable: "Commande introuvable.",
  },
  archetypes: {},
  accessoires: {},
};

const EN: Dict = {
  meta: {
    title: "Twin gift: the personalized book for twins | Deux comme nous",
    description:
      "THE gift for twin parents: a personalized book where both children are the heroes of the same story. Their names, characters in their likeness, 8×8\" hardcover. A birth or birthday gift for twin boys and girls, shipped to your door.",
    keywords: [
      "gift for twins", "twin gift", "twin baby gift", "personalized twin book", "twin birth gift",
      "gift for twin parents", "twin birthday gift", "personalized book for twins",
    ],
    ogTitle: "Twin gift: the personalized book Deux comme nous",
    ogDesc: "At last, a story where they are two: the personalized book that celebrates your twins' bond, hardbound and shipped to your door.",
  },
  nav: { livre: "The book", pourquoi: "Why", offrir: "Gift it", questions: "FAQ", cta: "Create yours" },
  hero: {
    eyebrow: "The gift for twin parents",
    h1a: "At last, a story",
    h1em: "two",
    lead: "The personalized book made for twins: their names, their looks, their bond. Together on every page, from the first hug to the last goodnight kiss.",
    ctaCreer: "Create their book",
    ctaFeuilleter: "Browse a sample",
    points: ["Two heroes in their likeness", "8×8\" hardcover, checked by hand", "By the creators of Jumelio & Gemellite.com"],
    alt: "Personalized book for twin girls: cover with both children, a gift for twins",
  },
  flip: {
    h2: "Flip through a real copy",
    sub: "This is Elia & Luna's personalized book: turn the pages to discover the soft watercolor illustrations. A short excerpt; the full book has 30 pages.",
    hintClic: "Click to turn the pages",
    page: "Page",
    exA: "In this copy, the heroines are called",
    exB: "In yours, they are",
    exC: "Your names, on every page.",
    prenoms: [["Leo", "Emma"], ["Mia", "Tom"], ["Noah", "Lily"], ["Oscar", "Rose"], ["Charlie", "Alix"], ["Milo", "Nina"]],
  },
  pourquoi: {
    h2a: "Personalized books have one hero.",
    h2em: "Your children are two.",
    sub: "Giving twins two separate books means telling two stories that ignore each other. \"Deux comme nous\" is written for them: one story, both their names, their bond at the heart of every page.",
    cartes: [
      { icone: "👑👑", titre: "Two heroes, one story", texte: "They appear together in every illustration, hugs, giggles and mischief included. Not a hero and a sidekick: two leading roles." },
      { icone: "✨", titre: "Each their own place", texte: "Each with their name, their character, their personality. The book celebrates their bond and what makes each of them unique. Never \"the twins\", always the two of them." },
      { icone: "💛", titre: "By twin parents", texte: "By the creators of Jumelio and Gemellite.com. The different rhythms, the resemblance, the \"you and me\": everything you live is in the text." },
      { icone: "📖", titre: "Made to last", texte: "8×8\" hardcover, thick paper, 30 illustrated pages checked one by one before printing. The kind of book you keep." },
    ],
  },
  etapes: {
    h2: "A unique gift in three minutes",
    liste: [
      { t: "You compose", p: "A character and a name for each child. Your duo and their names appear live in the preview." },
      { t: "We craft every page", p: "The illustrations are personalized then checked one by one, by hand, before going to print." },
      { t: "They discover themselves as heroes", p: "The hardbound book arrives at your door. All that's left is to open the first page, and read it again every night." },
    ],
    cta: "Create their book",
  },
  config: {
    h2: "Compose your twins' book",
    sub: "Pick a character for each child, add their names, and watch the cover of their personalized book come to life.",
    afficher: "Show:",
    filtreTous: "All", filtreGarcons: "Boys", filtreFilles: "Girls",
    premier: "First child", second: "Second child",
    phPrenom: "Their name",
    couvChoisir: "Choose two characters",
    couvAjouter: "Add the names",
    enfant: "Child",
    distinctifTete: "Identical twins: pick a small detail to tell the second one apart.",
    prixNote: "+ €4.99 tracked shipping",
    phEmail: "Your email (optional)",
    cta: "Order our book",
    mentionCgv: "Personalized item: no right of withdrawal (French consumer law, art. L221-28)",
    cgv: "Terms",
    noteApercu: "Indicative preview: on the printed cover, your two heroes are illustrated together in a full scene.",
    noteLangue: "The story text is currently written in French.",
    btnApercu: "✨ Browse real pages with your names",
    btnApercuHint: "add both names first",
    stTraitement: "Processing…",
    stRedirection: "Redirecting to secure payment…",
    stErreur: "Something went wrong.",
    stServeur: "Server unreachable.",
  },
  visionneuse: {
    couverture: "Cover",
    fermer: "Close",
    precedente: "Previous page",
    suivante: "Next page",
    note: "A short excerpt only: the full book has 30 pages. Real pages from a printed copy, with your names; the story text is currently in French. Every book is checked page by page before printing.",
  },
  sm: {
    eyebrow: "Custom edition",
    h2: "No character looks quite like them?",
    intro: "Our twelve characters don't look enough like your children? We create their book fully custom, in their likeness, from a simple photo.",
    points: [
      "Characters drawn from your photos",
      "You choose among 3 proposals per child, right after ordering",
      "Same 8×8\" hardcover book (+ €4.99 shipping)",
      "Your photos are never kept: automatically deleted as soon as the book is generated.",
    ],
    comment: "How does it work? Add the photo(s) and pay online. Within a minute, choose your favorite characters among our proposals. We create the book, you approve, we print.",
    prixNote: "custom book, from a photo",
    phP1: "First child's name",
    phP2: "Second child's name",
    phEmail: "Your email (optional)",
    zyIdent: "Identical", zyIdentSub: "one photo is enough",
    zyDiff: "Fraternal", zyDiffSub: "one photo per child",
    distinctifAvant: "A small detail to tell", distinctifApres: "apart in the book:",
    leSecond: "the second one",
    photoMono: "Add a photo of your children",
    photoDe: "Photo of",
    premierEnfant: "your first child",
    secondEnfant: "your second child",
    photoNote: "Faces clearly visible, JPEG or PNG. Photos deleted after the book is created.",
    vousEtes: "You are:",
    relParent: "The children's parent", relGrandParent: "Grandparent", relOncleTante: "Uncle / aunt",
    relParrain: "Godparent", relProche: "Another close relative",
    consentement: "I certify that I am over 18 and have the authorization of the children's parents (or legal guardians) to use this photo.",
    obligatoire: "Required.",
    option15: "−€15: I agree that the drawn character (never the photo) may be kept for future creations.",
    cta: "Order my custom book",
    question: "A question first?", ecrivez: "Write to us", reponse: "reply within 48 h.",
  },
  cadeau: {
    eyebrow: "Looking for a gift for twins?",
    h2: "You just found it.",
    texte: "Ask any twin parents: baby gifts arrive in duplicate, never designed for two. Give the one that won't end up at the back of a cupboard, the birthday gift that lights up two pairs of eyes at once. All you need to know is their names, we take care of the rest: the book is printed and shipped straight to their home.",
    occasions: ["🍼 Birth & baby shower", "🎂 First birthday", "🎄 Christmas", "🌟 Grandparents & godparents"],
    cta: "Gift this book",
  },
  faq: {
    titre: "Your questions",
    items: [
      { q: "What language is the book in?", r: "The story is currently written in French, with a warm, simple text designed for twins. English, Spanish and German editions are in preparation; the website will let you choose the language as soon as they are available." },
      { q: "What gift should I give to twins or twin parents?", r: "A gift twin parents have never received twice: a personalized book where both children are the heroes of the same story. Unlike classic baby gifts (bought in duplicate), \"Deux comme nous\" celebrates what makes these children unique: being two. All you need is their names, for a birth, a birthday or Christmas." },
      { q: "What age is it suitable for?", r: "From birth to about 6 years old. Given at birth, it's a keepsake that grows with them; around 2-3, it becomes the bedtime story they ask for: the one where the heroes bear their names." },
      { q: "Does it work for a boy and a girl?", r: "Yes! All combinations are possible: two boys, two girls, or a boy and a girl. The text is written to work naturally in every case." },
      { q: "Our twins are identical… how do we tell them apart in the book?", r: "It's built in: if you choose the same character for both, you pick a small detail (plush toy, glasses, cap, scarf) worn by the second twin on every page. Each child recognizes themselves at a glance." },
      { q: "What about delivery times and costs?", r: "Each book is printed on demand then shipped to your door with tracked delivery (€4.99). Allow about a week in total. If your character combination is created for the first time, we add 1-2 days to check every illustration by hand." },
      { q: "What is the quality of the book?", r: "A real hardbound book: square 8×8\" (20×20 cm) format, hardcover with matte lamination, thick 170 gsm silk paper, 30 pages. Made to be read, re-read, chewed on and passed down." },
      { q: "What if no character looks like them?", r: "We offer a custom edition: send us a photo and we draw their characters in their likeness. Your photo is deleted as soon as the book is created." },
    ],
  },
  footer: {
    tagline: "The personalized book for twins: two heroes, one story.",
    seo: "\"Deux comme nous\" is the gift for twins imagined by twin parents: a personalized book with their names, to give at birth, for a birthday or for Christmas. An original gift idea for twins, shipped across Europe and beyond.",
    fin: "By the creators of Jumelio & Gemellite.com, twin parents, for twin parents. 💛",
    mentions: "Legal notice", cgv: "Terms of sale", conf: "Privacy",
  },
  barre: { note: "+ €4.99 shipping", cta: "Create their book" },
  succes: {
    merciTitre: "Thank you! Order confirmed",
    merciMsg: "Your order has been received. We are preparing your book and will keep you posted by email.",
    nonFinal: "Payment not completed",
    nonFinalMsg: "The payment was not confirmed. No amount was charged.",
    introuvable: "Payment not found",
    introuvableMsg: "We could not find your payment.",
    smTitre: "Thank you! Photos received",
    smMsg: (p1, p2) => `Your custom edition for ${p1} & ${p2} is confirmed and your photos have been received. Now choose your favorite characters among our proposals drawn from your photos.`,
    livreMsg: (p1, p2) => `${p1} & ${p2}'s book is in preparation. We check the illustrations, then it is printed and shipped to your door.`,
    choisir: "Choose our characters",
    retour: "Back to home",
  },
  variantes: {
    titre: "Choose your characters",
    intro1: "Here are the characters drawn from your photo. Pick your favorite: it will be the reference for the whole book.",
    introN: "Here are the characters drawn from your photos. Pick your favorite for each child: it will be the reference for the whole book.",
    persoDe: "The character of",
    avecSigne: "with their distinctive detail",
    proposition: "Proposal",
    attente: "🎨 We are drawing the proposals… about a minute, the page updates by itself.",
    valider: "Confirm my choice",
    merci: "Thank you! 💛",
    merciMsg: (p1, p2) => `Your characters are chosen. We are now creating ${p1} & ${p2}'s book; you will approve the illustrations by email, then it goes to print.`,
    photosRecues: "Your photos have been received",
    photosRecuesMsg: (p1, p2) => `We are preparing ${p1} & ${p2}'s characters and will send you proposals by email within 24 h for approval.`,
    lienInvalide: "Invalid link.",
    chargement: "Loading…",
    introuvable: "Order not found.",
  },
  archetypes: {
    "g1-chatain-clair": "Light brown, short hair",
    "g2-brun-mat": "Dark brown, short hair",
    "g3-blond-clair": "Blond, short hair",
    "g4-noir-fonce": "Short black hair",
    "g5-roux-clair": "Redhead, freckles",
    "g6-asiatique": "Dark hair, straight fringe",
    "f1-natte-brune": "One brown braid",
    "f2-nattes-brune": "Two brown braids",
    "f3-blonde-claire": "Blonde, mid-length",
    "f4-bouclee-mate": "Curly, brown",
    "f5-tressee-fonce": "Beaded braids",
    "f6-asiatique": "Brown bob, fringe",
  },
  accessoires: {
    "doudou-lapin": "Bunny plush", "doudou-ours": "Bear plush", "doudou-chat": "Cat plush",
    "lunettes": "Round glasses", "casquette": "Cap", "foulard": "Scarf",
  },
};

const ES: Dict = {
  meta: {
    title: "Regalo para gemelos y mellizos: el libro personalizado | Deux comme nous",
    description:
      "EL regalo para padres de gemelos: un libro personalizado donde sus dos hijos son los héroes de la misma historia. Sus nombres, personajes a su imagen, tapa dura 20×20 cm. Regalo de nacimiento o cumpleaños para gemelos y mellizos, enviado a casa.",
    keywords: [
      "regalo gemelos", "regalo mellizos", "regalo gemelas", "regalo nacimiento gemelos",
      "libro personalizado gemelos", "regalo padres de gemelos", "idea regalo gemelos",
      "libro personalizado niños gemelos",
    ],
    ogTitle: "Regalo para gemelos: el libro personalizado Deux comme nous",
    ogDesc: "Por fin una historia donde son dos: el libro personalizado que celebra el vínculo de tus gemelos, encuadernado y enviado a casa.",
  },
  nav: { livre: "El libro", pourquoi: "Por qué", offrir: "Regalar", questions: "Preguntas", cta: "Crear el vuestro" },
  hero: {
    eyebrow: "El regalo de los padres de gemelos",
    h1a: "Por fin una historia",
    h1em: "dos",
    lead: "El libro personalizado pensado para gemelos: sus nombres, su aspecto, su complicidad. Juntos en cada página, del primer abrazo al último beso de buenas noches.",
    ctaCreer: "Crear su libro",
    ctaFeuilleter: "Hojear un ejemplo",
    points: ["Dos héroes a su imagen", "Tapa dura 20×20 cm, revisado a mano", "Por los creadores de Jumelio & Gemellite.com"],
    alt: "Libro personalizado para gemelas: portada con los dos niños, regalo para gemelos",
  },
  flip: {
    h2: "Hojea un ejemplar real",
    sub: "Este es el libro personalizado de Elia & Luna: pasa las páginas y descubre las suaves ilustraciones en acuarela. Es un extracto; el libro completo tiene 30 páginas.",
    hintClic: "Haz clic para pasar las páginas",
    page: "Página",
    exA: "En este ejemplar, las heroínas se llaman",
    exB: "En el vuestro, son",
    exC: "Vuestros nombres, en cada página.",
    prenoms: [["Leo", "Emma"], ["Lucía", "Hugo"], ["Noa", "Martina"], ["Mateo", "Rosa"], ["Sara", "Alex"], ["Marco", "Nina"]],
  },
  pourquoi: {
    h2a: "Los libros personalizados tienen un solo héroe.",
    h2em: "Tus hijos son dos.",
    sub: "Regalar dos libros separados a unos gemelos es contar dos historias que se ignoran. «Deux comme nous» está escrito para ellos: una sola historia, sus dos nombres, su vínculo en el centro de cada página.",
    cartes: [
      { icone: "👑👑", titre: "Dos héroes, una historia", texte: "Aparecen juntos en cada ilustración, con abrazos, risas y travesuras incluidos. No un héroe y su acompañante: dos protagonistas." },
      { icone: "✨", titre: "Cada uno su lugar", texte: "Cada uno con su nombre, su personaje y su carácter. El libro celebra su complicidad y lo que hace único a cada uno. Nunca «los gemelos», siempre ellos dos." },
      { icone: "💛", titre: "Por padres de gemelos", texte: "Por los creadores de Jumelio y Gemellite.com. Los ritmos distintos, el parecido, el «tú y yo»: todo lo que vivís está en el texto." },
      { icone: "📖", titre: "Hecho para durar", texte: "Tapa dura 20×20 cm, papel grueso, 30 páginas ilustradas y revisadas una a una antes de imprimir. El tipo de libro que se guarda." },
    ],
  },
  etapes: {
    h2: "Un regalo único en tres minutos",
    liste: [
      { t: "Tú lo compones", p: "Un personaje y un nombre para cada niño. Vuestro dúo y sus nombres aparecen al instante en la vista previa." },
      { t: "Cuidamos cada página", p: "Las ilustraciones se personalizan y se revisan una a una, a mano, antes de ir a imprenta." },
      { t: "Se descubren como héroes", p: "El libro llega encuadernado a casa. Solo queda abrir la primera página, y releerla cada noche." },
    ],
    cta: "Crear su libro",
  },
  config: {
    h2: "Compón el libro de tus gemelos",
    sub: "Elige un personaje para cada uno, añade sus nombres y mira cómo cobra vida la portada de su libro personalizado.",
    afficher: "Mostrar:",
    filtreTous: "Todos", filtreGarcons: "Niños", filtreFilles: "Niñas",
    premier: "Primer niño", second: "Segundo niño",
    phPrenom: "Su nombre",
    couvChoisir: "Elige dos personajes",
    couvAjouter: "Añade los nombres",
    enfant: "Niño",
    distinctifTete: "Gemelos idénticos: elige un pequeño detalle para distinguir al segundo.",
    prixNote: "+ 4,99 € de envío con seguimiento",
    phEmail: "Tu correo (opcional)",
    cta: "Pedir nuestro libro",
    mentionCgv: "Artículo personalizado: sin derecho de desistimiento (ley francesa, art. L221-28)",
    cgv: "Condiciones",
    noteApercu: "Vista previa indicativa: en la portada impresa, tus dos héroes aparecen ilustrados juntos en una escena completa.",
    noteLangue: "El texto de la historia está por ahora en francés.",
    btnApercu: "✨ Hojear páginas reales con vuestros nombres",
    btnApercuHint: "añade antes los dos nombres",
    stTraitement: "Procesando…",
    stRedirection: "Redirigiendo al pago seguro…",
    stErreur: "Ha ocurrido un error.",
    stServeur: "Servidor no disponible.",
  },
  visionneuse: {
    couverture: "Portada",
    fermer: "Cerrar",
    precedente: "Página anterior",
    suivante: "Página siguiente",
    note: "Solo un extracto de algunas páginas: el libro completo tiene 30. Páginas reales de un ejemplar impreso, con vuestros nombres; el texto está por ahora en francés. Cada libro se revisa página a página antes de imprimir.",
  },
  sm: {
    eyebrow: "Edición a medida",
    h2: "¿Ningún personaje se les parece?",
    intro: "¿Nuestros doce personajes no se parecen lo suficiente a tus hijos? Creamos su libro totalmente a medida, a su imagen, a partir de una simple foto.",
    points: [
      "Personajes dibujados a partir de tus fotos",
      "Eliges entre 3 propuestas por niño, justo después del pedido",
      "El mismo libro de tapa dura 20×20 cm (+ 4,99 € de envío)",
      "Tus fotos nunca se conservan: se eliminan automáticamente en cuanto se genera el libro.",
    ],
    comment: "¿Cómo funciona? Añades la(s) foto(s) y pagas en línea. En un minuto, eliges tus personajes favoritos entre nuestras propuestas. Creamos el libro, lo validas, lo imprimimos.",
    prixNote: "libro a medida, a partir de una foto",
    phP1: "Nombre del primer niño",
    phP2: "Nombre del segundo niño",
    phEmail: "Tu correo (opcional)",
    zyIdent: "Idénticos", zyIdentSub: "una sola foto basta",
    zyDiff: "Mellizos", zyDiffSub: "una foto por niño",
    distinctifAvant: "Un pequeño detalle para distinguir a", distinctifApres: "en el libro:",
    leSecond: "el segundo",
    photoMono: "Añadir la foto de tus hijos",
    photoDe: "Foto de",
    premierEnfant: "tu primer hijo",
    secondEnfant: "tu segundo hijo",
    photoNote: "Caras bien visibles, JPEG o PNG. Fotos eliminadas tras crear el libro.",
    vousEtes: "Eres:",
    relParent: "Padre/madre de los niños", relGrandParent: "Abuelo/a", relOncleTante: "Tío/tía",
    relParrain: "Padrino/madrina", relProche: "Otro familiar cercano",
    consentement: "Certifico ser mayor de 18 años y contar con la autorización de los padres (o tutores legales) de los niños para el uso de esta foto.",
    obligatoire: "Obligatorio.",
    option15: "−15 €: acepto que el personaje dibujado (nunca la foto) se conserve para futuras creaciones.",
    cta: "Pedir mi libro a medida",
    question: "¿Una pregunta antes?", ecrivez: "Escríbenos", reponse: "respuesta en 48 h.",
  },
  cadeau: {
    eyebrow: "¿Buscas un regalo para gemelos o mellizos?",
    h2: "Acabas de encontrarlo.",
    texte: "Pregunta a cualquier padre de gemelos: los regalos de nacimiento llegan por duplicado, nunca pensados para dos. Regala el que no acaba al fondo de un armario, el cumpleaños que ilumina dos pares de ojos a la vez. Solo necesitas saber sus nombres, nosotros nos ocupamos del resto: el libro se imprime y se envía directamente a su casa.",
    occasions: ["🍼 Nacimiento y baby shower", "🎂 Primer cumpleaños", "🎄 Navidad", "🌟 Abuelos, padrinos y madrinas"],
    cta: "Regalar este libro",
  },
  faq: {
    titre: "Vuestras preguntas",
    items: [
      { q: "¿En qué idioma está el libro?", r: "La historia está por ahora escrita en francés, con un texto cálido y sencillo pensado para gemelos. Las ediciones en español, inglés y alemán están en preparación; la web permitirá elegir el idioma en cuanto estén disponibles." },
      { q: "¿Qué regalar a unos gemelos o a padres de gemelos?", r: "Un regalo que los padres de gemelos nunca han recibido dos veces: un libro personalizado donde sus dos hijos son los héroes de la misma historia. A diferencia de los regalos clásicos (comprados por duplicado), «Deux comme nous» celebra lo que hace únicos a estos niños: ser dos. Solo necesitas sus nombres, para un nacimiento, un cumpleaños o Navidad." },
      { q: "¿Para qué edad es adecuado?", r: "Desde el nacimiento hasta los 6 años aproximadamente. Regalado al nacer, es un recuerdo que crece con ellos; hacia los 2-3 años, es el cuento de buenas noches que piden: aquel donde los héroes llevan sus nombres." },
      { q: "¿Funciona para un niño y una niña?", r: "¡Sí! Todas las combinaciones son posibles: dos niños, dos niñas o un niño y una niña. El texto está escrito para funcionar con naturalidad en todos los casos." },
      { q: "Nuestros gemelos son idénticos… ¿cómo distinguirlos en el libro?", r: "Está previsto: si eliges el mismo personaje para los dos, seleccionas un pequeño detalle (peluche, gafas, gorra, pañuelo) que lleva el segundo en todas las páginas. Cada uno se reconoce al primer vistazo." },
      { q: "¿Plazos y gastos de envío?", r: "Cada libro se imprime bajo demanda y se envía a casa con seguimiento (4,99 €). Cuenta con una semana aproximadamente. Si tu combinación de personajes se crea por primera vez, añadimos 1-2 días para revisar cada ilustración a mano." },
      { q: "¿Qué calidad tiene el libro?", r: "Un libro encuadernado de verdad: formato cuadrado 20×20 cm, tapa dura con laminado mate, papel grueso de 170 g, 30 páginas. Hecho para leerse, releerse, mordisquearse y transmitirse." },
      { q: "¿Y si ningún personaje se les parece?", r: "Ofrecemos una edición a medida: envíanos una foto y dibujamos sus personajes a su imagen. Tu foto se elimina en cuanto se crea el libro." },
    ],
  },
  footer: {
    tagline: "El libro personalizado de los gemelos y mellizos: dos héroes, una historia.",
    seo: "«Deux comme nous» es el regalo para gemelos y mellizos imaginado por padres de gemelos: un libro personalizado con sus nombres, para regalar en un nacimiento, un cumpleaños o en Navidad. Una idea de regalo original para gemelos, con envío a España y toda Europa.",
    fin: "Por los creadores de Jumelio & Gemellite.com, padres de gemelos, para padres de gemelos. 💛",
    mentions: "Aviso legal", cgv: "Condiciones de venta", conf: "Privacidad",
  },
  barre: { note: "+ 4,99 € de envío", cta: "Crear su libro" },
  succes: {
    merciTitre: "¡Gracias! Pedido confirmado",
    merciMsg: "Tu pedido ha sido registrado. Estamos preparando tu libro y te mantendremos informado por correo.",
    nonFinal: "Pago no finalizado",
    nonFinalMsg: "El pago no se ha confirmado. No se ha cobrado ningún importe.",
    introuvable: "Pago no encontrado",
    introuvableMsg: "No hemos podido encontrar tu pago.",
    smTitre: "¡Gracias! Fotos recibidas",
    smMsg: (p1, p2) => `Tu edición a medida para ${p1} & ${p2} está confirmada y tus fotos se han recibido. Elige ahora tus personajes favoritos entre nuestras propuestas dibujadas a partir de tus fotos.`,
    livreMsg: (p1, p2) => `El libro de ${p1} & ${p2} está en preparación. Validamos las ilustraciones y después se imprime y se envía a tu casa.`,
    choisir: "Elegir nuestros personajes",
    retour: "Volver al inicio",
  },
  variantes: {
    titre: "Elige vuestros personajes",
    intro1: "Aquí están los personajes dibujados a partir de tu foto. Elige tu favorito: será la referencia de todo el libro.",
    introN: "Aquí están los personajes dibujados a partir de tus fotos. Elige tu favorito para cada niño: será la referencia de todo el libro.",
    persoDe: "El personaje de",
    avecSigne: "con su detalle distintivo",
    proposition: "Propuesta",
    attente: "🎨 Estamos dibujando las propuestas… un minuto aproximadamente, la página se actualiza sola.",
    valider: "Confirmar mi elección",
    merci: "¡Gracias! 💛",
    merciMsg: (p1, p2) => `Vuestros personajes están elegidos. Ahora creamos el libro de ${p1} & ${p2}; validarás las ilustraciones por correo y después irá a imprenta.`,
    photosRecues: "Tus fotos se han recibido",
    photosRecuesMsg: (p1, p2) => `Estamos preparando los personajes de ${p1} & ${p2} y te enviaremos propuestas por correo en 24 h para su validación.`,
    lienInvalide: "Enlace no válido.",
    chargement: "Cargando…",
    introuvable: "Pedido no encontrado.",
  },
  archetypes: {
    "g1-chatain-clair": "Castaño claro, pelo corto",
    "g2-brun-mat": "Castaño oscuro, pelo corto",
    "g3-blond-clair": "Rubio, pelo corto",
    "g4-noir-fonce": "Pelo negro corto",
    "g5-roux-clair": "Pelirrojo, pecas",
    "g6-asiatique": "Pelo oscuro, flequillo liso",
    "f1-natte-brune": "Una trenza castaña",
    "f2-nattes-brune": "Dos trenzas castañas",
    "f3-blonde-claire": "Rubia, media melena",
    "f4-bouclee-mate": "Rizada, castaña",
    "f5-tressee-fonce": "Trenzas con cuentas",
    "f6-asiatique": "Melena corta, flequillo",
  },
  accessoires: {
    "doudou-lapin": "Peluche conejo", "doudou-ours": "Peluche oso", "doudou-chat": "Peluche gato",
    "lunettes": "Gafas redondas", "casquette": "Gorra", "foulard": "Pañuelo",
  },
};

const DE: Dict = {
  meta: {
    title: "Zwillingsgeschenk: das personalisierte Buch für Zwillinge | Deux comme nous",
    description:
      "DAS Geschenk für Zwillingseltern: ein personalisiertes Buch, in dem beide Kinder die Helden derselben Geschichte sind. Ihre Namen, Figuren nach ihrem Vorbild, Hardcover 20×20 cm. Ein Geschenk zur Geburt oder zum Geburtstag für Zwillinge, direkt nach Hause geliefert.",
    keywords: [
      "Geschenk Zwillinge", "Zwillingsgeschenk", "Geschenk Zwillingseltern", "Geschenk Geburt Zwillinge",
      "personalisiertes Buch Zwillinge", "Zwillinge Geburtstagsgeschenk", "Geschenkidee Zwillinge",
      "personalisiertes Kinderbuch Zwillinge",
    ],
    ogTitle: "Zwillingsgeschenk: das personalisierte Buch Deux comme nous",
    ogDesc: "Endlich eine Geschichte, in der sie zu zweit sind: das personalisierte Buch, das die Verbundenheit Ihrer Zwillinge feiert, gebunden und nach Hause geliefert.",
  },
  nav: { livre: "Das Buch", pourquoi: "Warum", offrir: "Verschenken", questions: "Fragen", cta: "Jetzt gestalten" },
  hero: {
    eyebrow: "Das Geschenk der Zwillingseltern",
    h1a: "Endlich eine Geschichte,",
    h1em: "zwei",
    lead: "Das personalisierte Buch für Zwillinge: ihre Namen, ihr Aussehen, ihre Verbundenheit. Gemeinsam auf jeder Seite, von der ersten Umarmung bis zum letzten Gutenachtkuss.",
    ctaCreer: "Ihr Buch gestalten",
    ctaFeuilleter: "Beispiel durchblättern",
    points: ["Zwei Helden nach ihrem Vorbild", "Hardcover 20×20 cm, von Hand geprüft", "Von den Machern von Jumelio & Gemellite.com"],
    alt: "Personalisiertes Buch für Zwillingsmädchen: Cover mit beiden Kindern, ein Geschenk für Zwillinge",
  },
  flip: {
    h2: "Blättern Sie durch ein echtes Exemplar",
    sub: "Das ist das personalisierte Buch von Elia & Luna: Blättern Sie durch die Seiten mit sanften Aquarell-Illustrationen. Nur ein Auszug; das vollständige Buch hat 30 Seiten.",
    hintClic: "Klicken, um umzublättern",
    page: "Seite",
    exA: "In diesem Exemplar heißen die Heldinnen",
    exB: "In Ihrem sind es",
    exC: "Ihre Namen, auf jeder Seite.",
    prenoms: [["Leo", "Emma"], ["Mia", "Ben"], ["Noah", "Lina"], ["Jonas", "Rosa"], ["Finn", "Alex"], ["Milo", "Nina"]],
  },
  pourquoi: {
    h2a: "Personalisierte Bücher haben einen Helden.",
    h2em: "Ihre Kinder sind zwei.",
    sub: "Zwillingen zwei getrennte Bücher zu schenken heißt, zwei Geschichten zu erzählen, die nichts voneinander wissen. „Deux comme nous“ ist für sie geschrieben: eine Geschichte, beide Namen, ihre Verbundenheit im Mittelpunkt jeder Seite.",
    cartes: [
      { icone: "👑👑", titre: "Zwei Helden, eine Geschichte", texte: "Sie erscheinen gemeinsam auf jeder Illustration, mit Umarmungen, Lachanfällen und Streichen. Kein Held mit Nebenfigur: zwei Hauptrollen." },
      { icone: "✨", titre: "Jeder hat seinen Platz", texte: "Jeder mit seinem Namen, seiner Figur, seinem Charakter. Das Buch feiert ihre Verbundenheit und das, was jeden einzigartig macht. Nie „die Zwillinge“, immer die beiden." },
      { icone: "💛", titre: "Von Zwillingseltern", texte: "Von den Machern von Jumelio und Gemellite.com. Die unterschiedlichen Rhythmen, die Ähnlichkeit, das „du und ich“: alles, was Sie erleben, steckt im Text." },
      { icone: "📖", titre: "Gemacht für die Ewigkeit", texte: "Hardcover 20×20 cm, dickes Papier, 30 illustrierte Seiten, einzeln geprüft vor dem Druck. Die Art von Buch, die man behält." },
    ],
  },
  etapes: {
    h2: "Ein einzigartiges Geschenk in drei Minuten",
    liste: [
      { t: "Sie gestalten", p: "Eine Figur und ein Name für jedes Kind. Ihr Duo und die Namen erscheinen sofort in der Vorschau." },
      { t: "Wir gestalten jede Seite mit Sorgfalt", p: "Die Illustrationen werden personalisiert und einzeln von Hand geprüft, bevor sie in den Druck gehen." },
      { t: "Sie entdecken sich als Helden", p: "Das gebundene Buch kommt zu Ihnen nach Hause. Es bleibt nur, die erste Seite aufzuschlagen, und sie jeden Abend wieder zu lesen." },
    ],
    cta: "Ihr Buch gestalten",
  },
  config: {
    h2: "Gestalten Sie das Buch Ihrer Zwillinge",
    sub: "Wählen Sie für jedes Kind eine Figur, fügen Sie die Namen hinzu und sehen Sie zu, wie das Cover ihres personalisierten Buchs entsteht.",
    afficher: "Anzeigen:",
    filtreTous: "Alle", filtreGarcons: "Jungen", filtreFilles: "Mädchen",
    premier: "Erstes Kind", second: "Zweites Kind",
    phPrenom: "Sein/ihr Name",
    couvChoisir: "Wählen Sie zwei Figuren",
    couvAjouter: "Namen hinzufügen",
    enfant: "Kind",
    distinctifTete: "Eineiige Zwillinge: Wählen Sie ein kleines Detail, um das zweite Kind zu unterscheiden.",
    prixNote: "+ 4,99 € versicherter Versand",
    phEmail: "Ihre E-Mail (optional)",
    cta: "Unser Buch bestellen",
    mentionCgv: "Personalisierter Artikel: kein Widerrufsrecht (frz. Recht, Art. L221-28)",
    cgv: "AGB",
    noteApercu: "Unverbindliche Vorschau: Auf dem gedruckten Cover sind Ihre beiden Helden gemeinsam in einer vollständigen Szene illustriert.",
    noteLangue: "Der Text der Geschichte ist derzeit auf Französisch.",
    btnApercu: "✨ Echte Seiten mit Ihren Namen durchblättern",
    btnApercuHint: "fügen Sie zuerst beide Namen hinzu",
    stTraitement: "Wird bearbeitet…",
    stRedirection: "Weiterleitung zur sicheren Zahlung…",
    stErreur: "Ein Fehler ist aufgetreten.",
    stServeur: "Server nicht erreichbar.",
  },
  visionneuse: {
    couverture: "Cover",
    fermer: "Schließen",
    precedente: "Vorherige Seite",
    suivante: "Nächste Seite",
    note: "Nur ein Auszug weniger Seiten: das vollständige Buch hat 30. Echte Seiten eines gedruckten Exemplars, mit Ihren Namen; der Text ist derzeit auf Französisch. Jedes Buch wird vor dem Druck Seite für Seite geprüft.",
  },
  sm: {
    eyebrow: "Maßanfertigung",
    h2: "Keine Figur sieht ihnen ähnlich?",
    intro: "Unsere zwölf Figuren ähneln Ihren Kindern nicht genug? Wir gestalten ihr Buch komplett nach Maß, nach ihrem Vorbild, aus einem einfachen Foto.",
    points: [
      "Figuren, gezeichnet nach Ihren Fotos",
      "Sie wählen aus 3 Vorschlägen pro Kind, direkt nach der Bestellung",
      "Dasselbe Hardcover-Buch 20×20 cm (+ 4,99 € Versand)",
      "Ihre Fotos werden nie aufbewahrt: automatisch gelöscht, sobald das Buch erstellt ist.",
    ],
    comment: "Wie funktioniert es? Sie laden das Foto (oder die Fotos) hoch und zahlen online. Innerhalb einer Minute wählen Sie Ihre Lieblingsfiguren aus unseren Vorschlägen. Wir erstellen das Buch, Sie geben es frei, wir drucken.",
    prixNote: "Buch nach Maß, aus einem Foto",
    phP1: "Name des ersten Kindes",
    phP2: "Name des zweiten Kindes",
    phEmail: "Ihre E-Mail (optional)",
    zyIdent: "Eineiig", zyIdentSub: "ein Foto genügt",
    zyDiff: "Zweieiig", zyDiffSub: "ein Foto pro Kind",
    distinctifAvant: "Ein kleines Detail, um", distinctifApres: "im Buch zu unterscheiden:",
    leSecond: "das zweite Kind",
    photoMono: "Foto Ihrer Kinder hinzufügen",
    photoDe: "Foto von",
    premierEnfant: "Ihrem ersten Kind",
    secondEnfant: "Ihrem zweiten Kind",
    photoNote: "Gesichter gut sichtbar, JPEG oder PNG. Fotos werden nach Erstellung des Buchs gelöscht.",
    vousEtes: "Sie sind:",
    relParent: "Elternteil der Kinder", relGrandParent: "Großelternteil", relOncleTante: "Onkel / Tante",
    relParrain: "Pate / Patin", relProche: "Andere nahestehende Person",
    consentement: "Ich bestätige, über 18 Jahre alt zu sein und die Erlaubnis der Eltern (oder Erziehungsberechtigten) der Kinder zur Verwendung dieses Fotos zu haben.",
    obligatoire: "Erforderlich.",
    option15: "−15 €: Ich bin einverstanden, dass die gezeichnete Figur (nie das Foto) für künftige Kreationen aufbewahrt wird.",
    cta: "Mein Buch nach Maß bestellen",
    question: "Erst eine Frage?", ecrivez: "Schreiben Sie uns", reponse: "Antwort innerhalb von 48 h.",
  },
  cadeau: {
    eyebrow: "Sie suchen ein Geschenk für Zwillinge?",
    h2: "Sie haben es gerade gefunden.",
    texte: "Fragen Sie Zwillingseltern: Geschenke zur Geburt kommen doppelt an, aber nie für zwei gedacht. Schenken Sie das, was nicht hinten im Schrank landet, das Geburtstagsgeschenk, das zwei Augenpaare auf einmal zum Leuchten bringt. Sie müssen nur die Namen kennen, wir kümmern uns um den Rest: das Buch wird gedruckt und direkt nach Hause geliefert.",
    occasions: ["🍼 Geburt & Babyparty", "🎂 Erster Geburtstag", "🎄 Weihnachten", "🌟 Großeltern & Paten"],
    cta: "Dieses Buch verschenken",
  },
  faq: {
    titre: "Ihre Fragen",
    items: [
      { q: "In welcher Sprache ist das Buch?", r: "Die Geschichte ist derzeit auf Französisch geschrieben, mit einem warmen, einfachen Text für Zwillinge. Deutsche, englische und spanische Ausgaben sind in Vorbereitung; sobald sie verfügbar sind, können Sie die Sprache auf der Website wählen." },
      { q: "Was schenkt man Zwillingen oder Zwillingseltern?", r: "Ein Geschenk, das Zwillingseltern noch nie doppelt bekommen haben: ein personalisiertes Buch, in dem beide Kinder die Helden derselben Geschichte sind. Anders als klassische Geschenke (doppelt gekauft) feiert „Deux comme nous“ das, was diese Kinder einzigartig macht: zu zweit zu sein. Sie brauchen nur die Namen, zur Geburt, zum Geburtstag oder zu Weihnachten." },
      { q: "Für welches Alter ist es geeignet?", r: "Von der Geburt bis etwa 6 Jahre. Zur Geburt geschenkt, ist es ein Andenken, das mitwächst; mit 2-3 Jahren wird es die Gutenachtgeschichte, die sie sich wünschen: die, in der die Helden ihre Namen tragen." },
      { q: "Funktioniert es für einen Jungen und ein Mädchen?", r: "Ja! Alle Kombinationen sind möglich: zwei Jungen, zwei Mädchen oder Junge und Mädchen. Der Text ist so geschrieben, dass er in jedem Fall natürlich funktioniert." },
      { q: "Unsere Zwillinge sind eineiig… wie unterscheidet man sie im Buch?", r: "Dafür ist gesorgt: Wenn Sie für beide dieselbe Figur wählen, bestimmen Sie ein kleines Detail (Kuscheltier, Brille, Mütze, Halstuch), das das zweite Kind auf allen Seiten trägt. Jedes Kind erkennt sich auf den ersten Blick." },
      { q: "Wie sind Lieferzeiten und -kosten?", r: "Jedes Buch wird auf Bestellung gedruckt und versichert nach Hause geliefert (4,99 €). Rechnen Sie mit etwa einer Woche insgesamt. Wird Ihre Figurenkombination zum ersten Mal erstellt, kommen 1-2 Tage hinzu, um jede Illustration von Hand zu prüfen." },
      { q: "Welche Qualität hat das Buch?", r: "Ein echtes gebundenes Buch: quadratisches Format 20×20 cm, Hardcover mit matter Laminierung, dickes 170-g-Seidenpapier, 30 Seiten. Gemacht, um gelesen, wiedergelesen, angeknabbert und weitergegeben zu werden." },
      { q: "Und wenn keine Figur ihnen ähnelt?", r: "Wir bieten eine Maßanfertigung: Schicken Sie uns ein Foto und wir zeichnen die Figuren nach ihrem Vorbild. Ihr Foto wird gelöscht, sobald das Buch erstellt ist." },
    ],
  },
  footer: {
    tagline: "Das personalisierte Buch für Zwillinge: zwei Helden, eine Geschichte.",
    seo: "„Deux comme nous“ ist das Geschenk für Zwillinge, erdacht von Zwillingseltern: ein personalisiertes Buch mit ihren Namen, zur Geburt, zum Geburtstag oder zu Weihnachten. Eine originelle Geschenkidee für Zwillinge, mit Versand nach Deutschland, Österreich, in die Schweiz und ganz Europa.",
    fin: "Von den Machern von Jumelio & Gemellite.com, Zwillingseltern, für Zwillingseltern. 💛",
    mentions: "Impressum", cgv: "AGB", conf: "Datenschutz",
  },
  barre: { note: "+ 4,99 € Versand", cta: "Ihr Buch gestalten" },
  succes: {
    merciTitre: "Danke! Bestellung bestätigt",
    merciMsg: "Ihre Bestellung ist eingegangen. Wir bereiten Ihr Buch vor und halten Sie per E-Mail auf dem Laufenden.",
    nonFinal: "Zahlung nicht abgeschlossen",
    nonFinalMsg: "Die Zahlung wurde nicht bestätigt. Es wurde kein Betrag abgebucht.",
    introuvable: "Zahlung nicht gefunden",
    introuvableMsg: "Wir konnten Ihre Zahlung nicht finden.",
    smTitre: "Danke! Fotos erhalten",
    smMsg: (p1, p2) => `Ihre Maßanfertigung für ${p1} & ${p2} ist bestätigt und Ihre Fotos sind eingegangen. Wählen Sie jetzt Ihre Lieblingsfiguren aus unseren nach Ihren Fotos gezeichneten Vorschlägen.`,
    livreMsg: (p1, p2) => `Das Buch von ${p1} & ${p2} ist in Vorbereitung. Wir prüfen die Illustrationen, dann wird es gedruckt und zu Ihnen nach Hause geliefert.`,
    choisir: "Unsere Figuren wählen",
    retour: "Zurück zur Startseite",
  },
  variantes: {
    titre: "Wählen Sie Ihre Figuren",
    intro1: "Hier sind die nach Ihrem Foto gezeichneten Figuren. Wählen Sie Ihren Favoriten: Er dient als Referenz für das ganze Buch.",
    introN: "Hier sind die nach Ihren Fotos gezeichneten Figuren. Wählen Sie für jedes Kind Ihren Favoriten: Er dient als Referenz für das ganze Buch.",
    persoDe: "Die Figur von",
    avecSigne: "mit dem Erkennungszeichen",
    proposition: "Vorschlag",
    attente: "🎨 Wir zeichnen die Vorschläge… etwa eine Minute, die Seite aktualisiert sich von selbst.",
    valider: "Meine Wahl bestätigen",
    merci: "Danke! 💛",
    merciMsg: (p1, p2) => `Ihre Figuren sind gewählt. Wir erstellen jetzt das Buch von ${p1} & ${p2}; Sie geben die Illustrationen per E-Mail frei, dann geht es in den Druck.`,
    photosRecues: "Ihre Fotos sind eingegangen",
    photosRecuesMsg: (p1, p2) => `Wir bereiten die Figuren von ${p1} & ${p2} vor und senden Ihnen innerhalb von 24 h Vorschläge per E-Mail zur Freigabe.`,
    lienInvalide: "Ungültiger Link.",
    chargement: "Wird geladen…",
    introuvable: "Bestellung nicht gefunden.",
  },
  archetypes: {
    "g1-chatain-clair": "Hellbraun, kurze Haare",
    "g2-brun-mat": "Dunkelbraun, kurze Haare",
    "g3-blond-clair": "Blond, kurze Haare",
    "g4-noir-fonce": "Kurze schwarze Haare",
    "g5-roux-clair": "Rothaarig, Sommersprossen",
    "g6-asiatique": "Dunkles Haar, glatter Pony",
    "f1-natte-brune": "Ein brauner Zopf",
    "f2-nattes-brune": "Zwei braune Zöpfe",
    "f3-blonde-claire": "Blond, schulterlang",
    "f4-bouclee-mate": "Lockig, braun",
    "f5-tressee-fonce": "Zöpfchen mit Perlen",
    "f6-asiatique": "Brauner Bob, Pony",
  },
  accessoires: {
    "doudou-lapin": "Kuschelhase", "doudou-ours": "Kuschelbär", "doudou-chat": "Kuschelkatze",
    "lunettes": "Runde Brille", "casquette": "Mütze", "foulard": "Halstuch",
  },
};

export const DICTS: Record<Locale, Dict> = { fr: FR, en: EN, es: ES, de: DE };

export function t(l: Locale): Dict {
  return DICTS[l] ?? FR;
}
