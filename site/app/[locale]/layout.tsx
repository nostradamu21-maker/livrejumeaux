import type { Metadata } from "next";
import { Fraunces, Nunito, Amatic_SC } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import FacebookPixel from "@/components/FacebookPixel";
import { LOCALES, estLocale, prefixe, t, type Locale } from "@/lib/i18n";
import { URL_SITE, NOM_SITE } from "@/lib/seo";
import "../globals.css";

// Polices auto-hébergées au build (next/font) : plus aucune requête vers les
// serveurs Google au chargement (RGPD, jurisprudence allemande) et pas de CSS
// bloquant. Les variables CSS sont consommées dans globals.css.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
});
const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-nunito",
});
const amatic = Amatic_SC({
  subsets: ["latin", "latin-ext"],
  weight: "700",
  display: "swap",
  variable: "--font-amatic",
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = estLocale(locale) ? locale : "fr";
  const d = t(l);
  // hreflang : chaque langue pointe vers sa version, x-default = français.
  const languages: Record<string, string> = { "x-default": "/" };
  for (const loc of LOCALES) languages[loc] = prefixe(loc) || "/";
  return {
    metadataBase: new URL(URL_SITE),
    title: { default: d.meta.title, template: `%s | ${NOM_SITE}` },
    description: d.meta.description,
    keywords: d.meta.keywords,
    alternates: { canonical: prefixe(l) || "/", languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: d.meta.ogTitle,
      description: d.meta.ogDesc,
      url: `${URL_SITE}${prefixe(l)}`,
      siteName: NOM_SITE,
      locale: { fr: "fr_FR", en: "en_US", es: "es_ES", de: "de_DE" }[l],
      type: "website",
      // FR : visuel « Leur histoire prend vie » (texte incrusté en français) ;
      // autres langues : couverture du livre, sans texte marketing.
      images: [
        l === "fr"
          ? { url: "/og/home-fr.jpg", width: 1200, height: 630, alt: d.meta.ogTitle }
          : {
              url: "/apercus/test-filles/couverture.jpg",
              width: 1600,
              height: 859,
              alt: d.meta.ogTitle,
            },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: d.meta.ogTitle,
      description: d.meta.ogDesc,
      images: [l === "fr" ? "/og/home-fr.jpg" : "/apercus/test-filles/couverture.jpg"],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
  return (
    <html lang={locale} className={`${fraunces.variable} ${nunito.variable} ${amatic.variable}`}>
      <body id="top">
        {children}
        <Analytics />
        <FacebookPixel l={locale} />
      </body>
    </html>
  );
}
