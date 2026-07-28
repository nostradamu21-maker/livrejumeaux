import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/seo";

// SEO + GEO : le site accueille explicitement les crawlers des moteurs IA
// (ChatGPT, Claude, Perplexity, Gemini…) — être cité par les assistants est
// un canal d'acquisition, le contenu est public et sans données sensibles.
const CRAWLERS_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "CCBot",
];

const PRIVE = ["/api/", "/commande/", "/admin/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVE },
      ...CRAWLERS_IA.map((ua) => ({ userAgent: ua, allow: "/", disallow: PRIVE })),
    ],
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
