import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Flipbook from "@/components/Flipbook";
import Pourquoi from "@/components/Pourquoi";
import Etapes from "@/components/Etapes";
import Configurateur from "@/components/Configurateur";
import SurMesure from "@/components/SurMesure";
import Cadeau from "@/components/Cadeau";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import BarreMobile from "@/components/BarreMobile";
import { cataloguePublic } from "@/lib/catalogue";
import { donneesStructurees } from "@/lib/seo";
import { estLocale, t } from "@/lib/i18n";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
  const d = t(locale);
  // Libellés d'archétypes localisés (le FR vient du catalogue).
  const archetypes = cataloguePublic().map((a) => ({
    ...a,
    label: d.archetypes[a.id] ?? a.label,
  }));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(donneesStructurees(locale)),
        }}
      />
      <Nav l={locale} />
      <Hero l={locale} />
      <Flipbook l={locale} />
      <Pourquoi l={locale} />
      <Etapes l={locale} />
      <Configurateur archetypes={archetypes} l={locale} />
      <SurMesure l={locale} />
      <Cadeau l={locale} />
      <Faq l={locale} />
      <Footer l={locale} />
      <BarreMobile l={locale} />
    </>
  );
}
