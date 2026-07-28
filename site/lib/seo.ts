// SEO / GEO : URL canonique et balisage Schema.org localisé, par page.
// Les questions/réponses viennent du dictionnaire i18n (source unique pour
// l'affichage ET les données structurées) ; les prix affichés ici doivent
// rester alignés sur lib/stripe.ts (PRIX_CENTIMES & co).

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

/** Éditeur du site : entité commune référencée par les produits. */
function organisation() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${URL_SITE}/#organisation`,
    name: NOM_SITE,
    url: URL_SITE,
    logo: `${URL_SITE}/icon.svg`,
    image: IMAGE_COUVERTURE,
    sameAs: ["https://www.gemellite.com"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@jumelio.com",
      availableLanguage: ["fr", "en", "es", "de"],
    },
  };
}

function expedition(l: Locale) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: "4.99", currency: "EUR" },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: { fr: "FR", en: "GB", es: "ES", de: "DE" }[l],
    },
  };
}

/** Produit LIVRE : catalogue 44,90 € → sur-mesure 64,99 €. */
function produitLivre(l: Locale) {
  const d = t(l);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${URL_SITE}/livre#produit`,
    name: d.pages.livre.h1,
    description: d.pages.livre.metaDesc,
    image: [IMAGE_COUVERTURE, `${URL_SITE}/og/livre.jpg`],
    brand: { "@type": "Brand", name: NOM_SITE },
    audience: { "@type": "PeopleAudience", suggestedMinAge: 0, suggestedMaxAge: 6 },
    offers: {
      "@type": "AggregateOffer",
      url: `${URL_SITE}${prefixe(l)}/livre`,
      lowPrice: "44.90",
      highPrice: "64.99",
      priceCurrency: "EUR",
      offerCount: 2,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: expedition(l),
    },
  };
}

/** Produit AFFICHE : 4 tailles, 29,90 → 49,90 €. */
function produitAffiche(l: Locale) {
  const d = t(l);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${URL_SITE}/affiche#produit`,
    name: d.pages.affiche.h1,
    description: d.pages.affiche.metaDesc,
    image: [`${URL_SITE}/og/affiche.jpg`, `${URL_SITE}/photos/guide-tailles.jpg`],
    brand: { "@type": "Brand", name: NOM_SITE },
    audience: { "@type": "PeopleAudience", suggestedMinAge: 0, suggestedMaxAge: 6 },
    offers: {
      "@type": "AggregateOffer",
      url: `${URL_SITE}${prefixe(l)}/affiche`,
      lowPrice: "29.90",
      highPrice: "49.90",
      priceCurrency: "EUR",
      offerCount: 4,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: expedition(l),
    },
  };
}

function faq(l: Locale) {
  const d = t(l);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: d.faq.items.map(({ q, r }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: r },
    })),
  };
}

function filAriane(l: Locale, page: "livre" | "affiche") {
  const d = t(l);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: NOM_SITE,
        item: `${URL_SITE}${prefixe(l) || "/"}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page === "livre" ? d.nav.livre : d.pages.affiche.h1,
        item: `${URL_SITE}${prefixe(l)}/${page}`,
      },
    ],
  };
}

function siteWeb(l: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: NOM_SITE,
    url: `${URL_SITE}${prefixe(l)}`,
    inLanguage: LANGUES[l],
    publisher: { "@id": `${URL_SITE}/#organisation` },
  };
}

/** Balisage Schema.org de la page demandée, dans la langue demandée. */
export function donneesStructurees(
  l: Locale = "fr",
  page: "home" | "livre" | "affiche" = "home",
) {
  if (page === "livre") {
    return [organisation(), produitLivre(l), filAriane(l, "livre"), faq(l)];
  }
  if (page === "affiche") {
    return [organisation(), produitAffiche(l), filAriane(l, "affiche"), faq(l)];
  }
  return [organisation(), siteWeb(l), produitLivre(l), produitAffiche(l), faq(l)];
}
