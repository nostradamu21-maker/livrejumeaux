import { Suspense } from "react";
import ChoixVariantes from "./ChoixVariantes";
import { estLocale, type Locale } from "@/lib/i18n";

// Page de tunnel : jamais indexée. robots.txt interdit déjà /commande/, mais un
// lien partagé par un client peut la faire découvrir autrement.
export const metadata = {
  title: "Deux comme nous",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: Locale = estLocale(locale) ? locale : "fr";
  return (
    <Suspense>
      <ChoixVariantes l={l} />
    </Suspense>
  );
}
