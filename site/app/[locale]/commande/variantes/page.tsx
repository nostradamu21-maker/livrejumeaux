import { Suspense } from "react";
import ChoixVariantes from "./ChoixVariantes";
import { estLocale, type Locale } from "@/lib/i18n";

export const metadata = { title: "Deux comme nous" };

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
