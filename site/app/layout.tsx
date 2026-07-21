import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deux comme nous — le livre personnalisé de vos jumeaux",
  description:
    "Un album tendre et unique qui célèbre le lien de vos jumeaux : leurs prénoms, leur allure, leur complicité — page après page.",
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
