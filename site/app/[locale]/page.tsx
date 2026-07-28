import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import VideoPub from "@/components/VideoPub";
import Flipbook from "@/components/Flipbook";
import Pourquoi from "@/components/Pourquoi";
import Etapes from "@/components/Etapes";
import Cadeau from "@/components/Cadeau";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import BarreMobile from "@/components/BarreMobile";
import { donneesStructurees } from "@/lib/seo";
import { estLocale } from "@/lib/i18n";

// Home = vitrine courte : elle présente et convainc, les tunnels de commande
// vivent sur leurs pages produit (/livre et /affiche).
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
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
      <VideoPub l={locale} />
      <Flipbook l={locale} />
      <Pourquoi l={locale} />
      <Etapes l={locale} />
      <Cadeau l={locale} />
      <Faq l={locale} />
      <Footer l={locale} />
      <BarreMobile l={locale} />
    </>
  );
}
