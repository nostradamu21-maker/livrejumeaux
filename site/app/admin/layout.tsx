import type { Metadata } from "next";
import "../globals.css";

// Coin admin (tri des variantes) : jamais indexé, interface en français.
export const metadata: Metadata = {
  title: "Tri — Deux comme nous",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
