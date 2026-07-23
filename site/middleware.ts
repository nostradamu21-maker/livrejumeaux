import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["fr", "en", "es", "de"];

// Le français vit à la racine (URLs historiques inchangées) :
//  -  /  →  réécrit en interne vers /fr  (l'URL visible reste /)
//  -  /fr/... demandé directement  →  redirigé vers /... (pas de doublon SEO)
//  -  /en, /es, /de  →  servis tels quels
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  // Tout sauf les API, les fichiers Next et les fichiers statiques (avec extension).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
