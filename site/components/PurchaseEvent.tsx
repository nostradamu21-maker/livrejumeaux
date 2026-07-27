"use client";

import { useEffect } from "react";

// Événement Meta « Purchase » envoyé côté client sur la page de succès, une
// seule fois par commande (garde-fou sessionStorage contre le double comptage
// si le client recharge la page). window.fbq est typé dans FacebookPixel.tsx.
export default function PurchaseEvent({
  value,
  currency,
  id,
}: {
  value: number;
  currency: string;
  id: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined" || !window.fbq) return;
    const cle = `fb_purchase_${id}`;
    try {
      if (sessionStorage.getItem(cle)) return;
      sessionStorage.setItem(cle, "1");
    } catch {
      /* sessionStorage indisponible : on envoie quand même */
    }
    window.fbq("track", "Purchase", { value, currency });
  }, [value, currency, id]);

  return null;
}
