import type { Metadata } from "next";
import { URL_SITE, NOM_SITE } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default:
      "Cadeau jumeaux & jumelles : le livre personnalisé | Deux comme nous",
    template: `%s | ${NOM_SITE}`,
  },
  description:
    "LE cadeau des parents de jumeaux : un livre personnalisé où vos deux enfants sont les héros de la même histoire. Prénoms, personnages à leur image, relié 20×20 cm. Cadeau de naissance ou d'anniversaire pour jumeaux et jumelles, expédié chez vous.",
  keywords: [
    "cadeau jumeaux",
    "cadeau jumelles",
    "cadeau parents de jumeaux",
    "cadeau naissance jumeaux",
    "cadeau anniversaire jumeaux",
    "livre personnalisé jumeaux",
    "livre personnalisé jumelles",
    "idée cadeau jumeaux",
    "cadeau original jumeaux",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Cadeau jumeaux & jumelles : le livre personnalisé Deux comme nous",
    description:
      "Enfin une histoire où ils sont deux : le livre personnalisé qui célèbre le lien de vos jumeaux, relié et expédié chez vous. Le cadeau préféré des parents de jumeaux.",
    url: URL_SITE,
    siteName: NOM_SITE,
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/apercus/test-filles/couverture.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadeau jumeaux & jumelles : le livre personnalisé Deux comme nous",
    description:
      "Enfin une histoire où ils sont deux : le livre personnalisé des jumeaux et jumelles.",
    images: ["/apercus/test-filles/couverture.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
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
