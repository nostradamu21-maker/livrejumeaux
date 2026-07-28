import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import AfficheTunnel from "@/components/AfficheTunnel";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import { cataloguePublic } from "@/lib/catalogue";
import { URL_SITE } from "@/lib/seo";
import { LOCALES, estLocale, prefixe, t, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = estLocale(locale) ? locale : "fr";
  const d = t(l);
  const languages: Record<string, string> = { "x-default": "/affiche" };
  for (const loc of LOCALES) languages[loc] = `${prefixe(loc)}/affiche`;
  return {
    title: d.pages.affiche.metaTitle,
    description: d.pages.affiche.metaDesc,
    alternates: { canonical: `${prefixe(l)}/affiche`, languages },
    openGraph: {
      title: d.pages.affiche.metaTitle,
      description: d.pages.affiche.metaDesc,
      url: `${URL_SITE}${prefixe(l)}/affiche`,
    },
  };
}

// Page produit AFFICHE : le poster au catalogue (+ upsell ?sm=), puis le
// formulaire sur mesure pré-basculé sur l'affiche d'après photo.
export default async function PageAffiche({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
  const d = t(locale);
  const archetypes = cataloguePublic().map((a) => ({
    ...a,
    label: d.archetypes[a.id] ?? a.label,
  }));
  return (
    <>
      <Nav l={locale} />
      <header className="page-tete">
        <h1>{d.pages.affiche.h1}</h1>
        <p>{d.pages.affiche.sub}</p>
      </header>
      <AfficheTunnel archetypes={archetypes} l={locale} />
      <Faq l={locale} />
      <Footer l={locale} />
    </>
  );
}
