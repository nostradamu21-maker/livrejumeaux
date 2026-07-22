// Source de vérité SEO : URL canonique, FAQ (affichage + données structurées
// Google) et balisage Schema.org. Mots-clés visés : « cadeau jumeaux »,
// « cadeau jumelles », « cadeau parents de jumeaux », « livre personnalisé
// jumeaux ».

export const URL_SITE = "https://boutique.gemellite.com";
export const NOM_SITE = "Deux comme nous";
export const IMAGE_COUVERTURE = `${URL_SITE}/apercus/test-filles/couverture.jpg`;

export interface QuestionFaq {
  q: string;
  r: string;
}

// Réponses en texte simple : elles servent aussi au balisage FAQPage.
export const FAQ: QuestionFaq[] = [
  {
    q: "Quel cadeau offrir à des jumeaux ou à des parents de jumeaux ?",
    r: "Un cadeau que les parents de jumeaux n'ont jamais reçu deux fois : un livre personnalisé où leurs deux enfants sont les héros de la même histoire. Contrairement aux cadeaux de naissance classiques (achetés en double), « Deux comme nous » célèbre ce que ces enfants ont d'unique : être deux. Il suffit de connaître leurs prénoms pour l'offrir, à la naissance, à un anniversaire ou à Noël.",
  },
  {
    q: "Pour quel âge est-ce adapté ?",
    r: "De la naissance à 6 ans environ. Offert à la naissance, c'est un souvenir qui grandit avec eux ; vers 2-3 ans, c'est l'histoire du soir qu'ils réclament : celle où les héros portent leurs prénoms.",
  },
  {
    q: "Ça marche pour un garçon et une fille ?",
    r: "Oui ! Toutes les combinaisons sont possibles : deux garçons, deux filles (un cadeau de jumelles très demandé), ou un garçon et une fille. Le texte est écrit pour fonctionner naturellement dans tous les cas.",
  },
  {
    q: "Nos jumeaux sont identiques… comment les distinguer dans le livre ?",
    r: "C'est prévu : si vous choisissez le même personnage pour les deux, vous sélectionnez un petit détail (doudou, lunettes, casquette, foulard) que porte le second sur toutes les pages. Chacun se reconnaît au premier coup d'œil.",
  },
  {
    q: "Quels sont les délais et frais de livraison ?",
    r: "Chaque livre est imprimé à la demande puis expédié directement chez vous en livraison suivie (4,99 €). Comptez environ une semaine en tout. Si votre combinaison de personnages est créée pour la première fois, nous ajoutons 1 à 2 jours pour vérifier chaque illustration à la main.",
  },
  {
    q: "Quelle est la qualité du livre ?",
    r: "Un vrai livre relié : format carré 20×20 cm, couverture rigide avec pelliculage mat, papier épais 170 g soyeux, 30 pages. Conçu pour être lu, relu, mordillé et transmis.",
  },
  {
    q: "Et si aucun personnage ne leur ressemble ?",
    r: "Nous proposons une édition sur mesure : envoyez-nous une photo et nous dessinons leurs personnages à leur image. Votre photo est supprimée dès le livre créé.",
  },
];

/** Balisage Schema.org de la page d'accueil (Produit + FAQ + site). */
export function donneesStructurees() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Deux comme nous, le livre personnalisé des jumeaux et jumelles",
      description:
        "Livre personnalisé pour jumeaux et jumelles : leurs prénoms et leurs personnages, ensemble sur chaque page. Le cadeau de naissance et d'anniversaire préféré des parents de jumeaux. Relié 20×20 cm, 30 pages.",
      image: IMAGE_COUVERTURE,
      brand: { "@type": "Brand", name: NOM_SITE },
      audience: {
        "@type": "PeopleAudience",
        suggestedMinAge: 0,
        suggestedMaxAge: 6,
      },
      offers: {
        "@type": "Offer",
        url: `${URL_SITE}/#creer`,
        price: "44.90",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: "4.99",
            currency: "EUR",
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "FR",
          },
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, r }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: r },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: NOM_SITE,
      url: URL_SITE,
      inLanguage: "fr-FR",
    },
  ];
}
