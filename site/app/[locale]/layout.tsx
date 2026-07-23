import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, estLocale, prefixe, t, type Locale } from "@/lib/i18n";
import { URL_SITE, NOM_SITE } from "@/lib/seo";
import "../globals.css";

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
      images: [{ url: "/apercus/test-filles/couverture.jpg" }],
    },
    twitter: {
      card: "summary_large_image",
      title: d.meta.ogTitle,
      description: d.meta.ogDesc,
      images: ["/apercus/test-filles/couverture.jpg"],
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
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body id="top">{children}</body>
    </html>
  );
}
