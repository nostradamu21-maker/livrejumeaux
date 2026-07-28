"use client";

import { useEffect, useState } from "react";
import SelecteurLangue from "@/components/SelecteurLangue";
import { prefixe, t, type Locale } from "@/lib/i18n";

export default function Nav({ l }: { l: Locale }) {
  const d = t(l);
  // Liens absolus (préfixés par la langue) : la nav sert la home ET les pages
  // produit /livre et /affiche.
  const p = prefixe(l);
  // Menu mobile : un burger qui ouvre un panneau plein écran, fermé au clic
  // sur n'importe quel lien. Sur desktop le panneau redevient une rangée.
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  return (
    <nav className={`nav${ouvert ? " nav-ouverte" : ""}`}>
      <a className="brand" href={p || "/"}>
        Deux&nbsp;comme&nbsp;nous
      </a>
      <button
        type="button"
        className="nav-burger"
        aria-label="Menu"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
      >
        <span aria-hidden>{ouvert ? "✕" : "☰"}</span>
      </button>
      <div
        className={`nav-links${ouvert ? " ouvert" : ""}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOuvert(false);
        }}
      >
        {/* Ordre : les deux produits, puis la découverte, puis l'aide. */}
        <a href={`${p}/livre`}>{d.nav.livre}</a>
        <a href={`${p}/affiche`}>{d.nav.cadre}</a>
        <a href={`${p}/#pourquoi`}>{d.nav.pourquoi}</a>
        <a href={`${p}/#cadeau`}>{d.nav.offrir}</a>
        <a href={`${p}/#faq`}>{d.nav.questions}</a>
        <SelecteurLangue l={l} />
        <a href={`${p}/livre`} className="nav-cta">
          {d.nav.cta}
        </a>
      </div>
    </nav>
  );
}
