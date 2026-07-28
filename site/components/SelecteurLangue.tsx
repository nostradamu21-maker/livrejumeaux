"use client";

import { usePathname } from "next/navigation";
import { LOCALES, estLocale, prefixe, type Locale } from "@/lib/i18n";

// Sélecteur de langue qui CONSERVE la page courante : depuis /affiche, cliquer
// EN mène à /en/affiche (et non à la home anglaise).
export default function SelecteurLangue({ l }: { l: Locale }) {
  const chemin = usePathname() ?? "/";
  // Retire le préfixe de langue éventuel pour retrouver la page « nue ».
  const segments = chemin.split("/").filter(Boolean);
  const reste = estLocale(segments[0] ?? "") ? segments.slice(1) : segments;
  const page = reste.length ? `/${reste.join("/")}` : "";

  return (
    <div className="nav-langues">
      {LOCALES.map((loc) => (
        <a
          key={loc}
          href={`${prefixe(loc)}${page}` || "/"}
          className={loc === l ? "actif" : ""}
          aria-current={loc === l ? "page" : undefined}
          hrefLang={loc}
        >
          {loc.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
