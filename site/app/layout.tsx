import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deux comme nous — le cadeau des parents de jumeaux",
  description:
    "Le livre personnalisé pensé pour les jumeaux : leurs prénoms, leur allure, leur complicité — ensemble sur chaque page. Relié 20×20 cm, livré chez vous. Le cadeau de naissance et d'anniversaire des jumeaux et jumelles.",
  keywords: [
    "cadeau jumeaux",
    "livre personnalisé jumeaux",
    "cadeau naissance jumeaux",
    "cadeau jumelles",
    "livre enfant personnalisé",
  ],
  openGraph: {
    title: "Deux comme nous — le cadeau des parents de jumeaux",
    description:
      "Enfin une histoire où ils sont deux : le livre personnalisé qui célèbre le lien de vos jumeaux, relié et livré chez vous.",
    url: "https://boutique.gemellite.com",
    siteName: "Deux comme nous",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/apercus/test-filles/couverture.jpg" }],
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
