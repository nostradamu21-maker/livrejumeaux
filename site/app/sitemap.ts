import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: URL_SITE, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${URL_SITE}/mentions-legales`, priority: 0.2 },
    { url: `${URL_SITE}/cgv`, priority: 0.2 },
    { url: `${URL_SITE}/confidentialite`, priority: 0.2 },
  ];
}
