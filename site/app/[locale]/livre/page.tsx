import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Flipbook from "@/components/Flipbook";
import LivreTunnel from "@/components/LivreTunnel";
import Etapes from "@/components/Etapes";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import BarreMobile from "@/components/BarreMobile";
import { cataloguePublic } from "@/lib/catalogue";
import { donneesStructurees, URL_SITE } from "@/lib/seo";
import { LOCALES, estLocale, prefixe, t, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = estLocale(locale) ? locale : "fr";
  const d = t(l);
  const languages: Record<string, string> = { "x-default": "/livre" };
  for (const loc of LOCALES) languages[loc] = `${prefixe(loc)}/livre`;
  return {
    title: d.pages.livre.metaTitle,
    description: d.pages.livre.metaDesc,
    alternates: { canonical: `${prefixe(l)}/livre`, languages },
    openGraph: {
      title: d.pages.livre.metaTitle,
      description: d.pages.livre.metaDesc,
      url: `${URL_SITE}${prefixe(l)}/livre`,
      images: [{ url: "/og/livre.jpg", width: 1200, height: 630, alt: d.pages.livre.metaTitle }],
    },
    twitter: { card: "summary_large_image", images: ["/og/livre.jpg"] },
  };
}

// Page produit LIVRE : les deux façons de le créer (sur mesure d'après photo,
// puis personnages du catalogue), avec le feuilletage en preuve à l'appui.
export default async function PageLivre({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(donneesStructurees(locale, "livre")),
        }}
      />
      <Nav l={locale} />
      <header className="page-tete">
        <h1>{d.pages.livre.h1}</h1>
        <p>{d.pages.livre.sub}</p>
      </header>
      <LivreTunnel archetypes={archetypes} l={locale} />
      <Flipbook l={locale} />
      <Etapes l={locale} href="#tunnel-haut" />
      <Faq l={locale} />
      <Footer l={locale} />
      <BarreMobile l={locale} variante="livre" href="#tunnel-haut" />
    </>
  );
}
