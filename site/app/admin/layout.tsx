import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "../globals.css";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--font-fraunces" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", variable: "--font-nunito" });

// Coin admin (tri des variantes) : jamais indexé, interface en français.
export const metadata: Metadata = {
  title: "Tri — Deux comme nous",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
