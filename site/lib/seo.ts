// SEO : URL canonique et balisage Schema.org (Produit + FAQ + site), localisé.
// Les questions/réponses viennent du dictionnaire i18n (source unique pour
// l'affichage ET les données structurées Google).

import { t, prefixe, type Locale } from "@/lib/i18n";

export const URL_SITE = "https://boutique.gemellite.com";
export const NOM_SITE = "Deux comme nous";
export const IMAGE_COUVERTURE = `${URL_SITE}/apercus/test-filles/couverture.jpg`;

const LANGUES: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
};

/** Balisage Schema.org de la page d'accueil, dans la langue demandée. */
export function donneesStructurees(l: Locale = "fr") {
  const d = t(l);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: d.meta.ogTitle,
      description: d.meta.description,
      image: IMAGE_COUVERTURE,
      brand: { "@type": "Brand", name: NOM_SITE },
      audience: {
        "@type": "PeopleAudience",
        suggestedMinAge: 0,
        suggestedMaxAge: 6,
      },
      offers: {
        "@type": "Offer",
        url: `${URL_SITE}${prefixe(l)}#creer`,
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
            addressCountry: { fr: "FR", en: "GB", es: "ES", de: "DE" }[l],
          },
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: d.faq.items.map(({ q, r }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: r },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: NOM_SITE,
      url: `${URL_SITE}${prefixe(l)}`,
      inLanguage: LANGUES[l],
    },
  ];
}
