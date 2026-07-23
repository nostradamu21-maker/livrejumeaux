import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/seo";
import { LOCALES, prefixe } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const languesAccueil: Record<string, string> = {};
  for (const l of LOCALES) languesAccueil[l] = `${URL_SITE}${prefixe(l) || ""}` || URL_SITE;

  const accueils: MetadataRoute.Sitemap = LOCALES.map((l) => ({
    url: `${URL_SITE}${prefixe(l)}` || URL_SITE,
    changeFrequency: "weekly" as const,
    priority: l === "fr" ? 1 : 0.9,
    alternates: { languages: languesAccueil },
  }));

  return [
    ...accueils,
    { url: `${URL_SITE}/mentions-legales`, priority: 0.2 },
    { url: `${URL_SITE}/cgv`, priority: 0.2 },
    { url: `${URL_SITE}/confidentialite`, priority: 0.2 },
  ];
}
