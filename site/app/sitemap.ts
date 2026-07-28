import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/seo";
import { LOCALES, prefixe } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  // Home + pages produit, déclinées par langue avec leurs alternates hreflang.
  const pages = ["", "/livre", "/affiche", "/contact"];
  const entrees: MetadataRoute.Sitemap = [];
  for (const page of pages) {
    const langues: Record<string, string> = {};
    for (const l of LOCALES) langues[l] = `${URL_SITE}${prefixe(l)}${page}` || URL_SITE;
    for (const l of LOCALES) {
      entrees.push({
        url: `${URL_SITE}${prefixe(l)}${page}` || URL_SITE,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: (page === "" ? 1 : page === "/contact" ? 0.4 : 0.9) - (l === "fr" ? 0 : 0.1),
        alternates: { languages: langues },
      });
    }
  }

  return [
    ...entrees,
    { url: `${URL_SITE}/mentions-legales`, priority: 0.2 },
    { url: `${URL_SITE}/cgv`, priority: 0.2 },
    { url: `${URL_SITE}/confidentialite`, priority: 0.2 },
  ];
}
