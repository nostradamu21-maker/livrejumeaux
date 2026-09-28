import { NextRequest, NextResponse } from "next/server";
import { MAINTENANCE, pageOuverte, pageMaintenance, langueDuChemin } from "./lib/maintenance";

const LOCALES = ["fr", "en", "es", "de"];

// Le français vit à la racine (URLs historiques inchangées) :
//  -  /  →  réécrit en interne vers /fr  (l'URL visible reste /)
//  -  /fr/... demandé directement  →  redirigé vers /... (pas de doublon SEO)
//  -  /en, /es, /de  →  servis tels quels
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Boutique en pause (voir lib/maintenance.ts) : 503 temporaire partout,
  // sauf les pages dont ont besoin les clients ayant déjà commandé.
  if (MAINTENANCE && !pageOuverte(pathname)) {
    return new NextResponse(pageMaintenance(langueDuChemin(pathname)), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "86400",
        "Cache-Control": "no-store",
      },
    });
  }

  if (pathname === "/fr" || pathname.startsWith("/fr/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/fr/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  const aLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (!aLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/fr${pathname}`;
    return NextResponse.rewrite(url);
  }
}

export const config = {
  // Tout sauf les API, l'admin (tri), les fichiers Next et les fichiers
  // statiques (avec extension).
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
