"use client";

import Script from "next/script";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { prefixe, t, type Locale } from "@/lib/i18n";

// Pixel Meta (Facebook). L'id est public par nature (code client). Surchargeable
// via NEXT_PUBLIC_FB_PIXEL_ID ; sinon l'id fourni par défaut.
const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "382552856295406";

// Consentement (CNIL / RGPD) : le pixel est un traceur publicitaire, il ne se
// charge QU'APRÈS un accord explicite. Le choix est mémorisé dans localStorage
// (« oui » / « non ») et peut être modifié à tout moment via le lien
// « Cookies » du pied de page (événement `dcn:cookies`).
export const CLE_CONSENTEMENT = "dcn-consent";
export const EVENEMENT_COOKIES = "dcn:cookies";
type Choix = "oui" | "non" | null;

const DUREE_CHOIX_MS = 6 * 30 * 24 * 3600 * 1000; // 6 mois (recommandation CNIL)

/** Choix mémorisé (« oui|horodatage »), ou null s'il est absent ou périmé. */
function lireChoix(): Choix {
  try {
    const [v, date] = (localStorage.getItem(CLE_CONSENTEMENT) ?? "").split("|");
    if (v !== "oui" && v !== "non") return null;
    if (Date.now() - Number(date || 0) > DUREE_CHOIX_MS) return null;
    return v;
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function FacebookPixel({ l = "fr" }: { l?: Locale }) {
  const d = t(l);
  const pathname = usePathname();
  const premier = useRef(true);
  // null tant qu'on n'a pas lu localStorage (rendu serveur = pas de bandeau,
  // évite un flash puis une divergence d'hydratation).
  const [choix, setChoix] = useState<Choix>(null);
  const [lu, setLu] = useState(false);

  useEffect(() => {
    setChoix(lireChoix());
    setLu(true);
    // Le pied de page rouvre le bandeau pour changer d'avis.
    const rouvrir = () => {
      try {
        localStorage.removeItem(CLE_CONSENTEMENT);
      } catch {}
      setChoix(null);
    };
    window.addEventListener(EVENEMENT_COOKIES, rouvrir);
    return () => window.removeEventListener(EVENEMENT_COOKIES, rouvrir);
  }, []);

  // Le script de base envoie déjà le 1er PageView au chargement ; on n'envoie
  // les suivants qu'aux navigations internes (App Router = pas de rechargement).
  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  const decider = (c: "oui" | "non") => {
    try {
      localStorage.setItem(CLE_CONSENTEMENT, `${c}|${Date.now()}`);
    } catch {}
    setChoix(c);
  };

  if (!PIXEL_ID) return null;

  return (
    <>
      {choix === "oui" && (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
      {lu && choix === null && (
        <div className="cookies" role="dialog" aria-live="polite" aria-label="Cookies">
          <p>
            {d.cookies.texte}{" "}
            <Link href={`${prefixe(l)}/confidentialite`}>{d.cookies.savoir}</Link>
          </p>
          {/* Deux boutons de même poids visuel : refuser doit être aussi
              simple qu'accepter (exigence CNIL). */}
          <div className="cookies-actions">
            <button type="button" className="btn btn-ghost" onClick={() => decider("non")}>
              {d.cookies.refuser}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => decider("oui")}>
              {d.cookies.accepter}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
