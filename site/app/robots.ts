import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/commande/"] }],
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
