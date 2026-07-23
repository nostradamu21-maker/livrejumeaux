import Link from "next/link";
import { stripe, stripeActif } from "@/lib/stripe";
import { estLocale, t, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Succes({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const l: Locale = estLocale(locale) ? locale : "fr";
  const d = t(l);
  const { session_id } = await searchParams;

  let ok = true;
  let titre = d.succes.merciTitre;
  let message = d.succes.merciMsg;
  let lienVariantes = "";

  if (stripeActif && stripe && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== "paid") {
        ok = false;
        titre = d.succes.nonFinal;
        message = d.succes.nonFinalMsg;
      } else {
        const m = session.metadata ?? {};
        if (m.combo_id === "sur-mesure") {
          titre = d.succes.smTitre;
          message = d.succes.smMsg(m.prenom1 ?? "", m.prenom2 ?? "");
          lienVariantes = `/commande/variantes?session_id=${encodeURIComponent(session_id)}`;
        } else if (m.prenom1 && m.prenom2) {
          message = d.succes.livreMsg(m.prenom1, m.prenom2);
        }
      }
    } catch {
      ok = false;
      titre = d.succes.introuvable;
      message = d.succes.introuvableMsg;
    }
  }

  const couleur = ok ? "#5f8a70" : "#b96c44";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 22,
          padding: "2.6rem 2.4rem",
          maxWidth: 520,
          textAlign: "center",
          boxShadow: "0 24px 60px rgba(74,58,48,.14)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 1.2rem",
            fontSize: "2rem",
            color: "#fff",
            background: couleur,
          }}
        >
          {ok ? "✓" : "⚠"}
        </div>
        <h1 style={{ fontSize: "1.7rem", marginBottom: ".8rem" }}>{titre}</h1>
        <p style={{ color: "var(--encre-doux)", lineHeight: 1.65 }}>{message}</p>
        {lienVariantes ? (
          <Link
            href={lienVariantes}
            className="btn btn-primary"
            style={{ marginTop: "1.6rem" }}
          >
            {d.succes.choisir}
          </Link>
        ) : (
          <Link href="/" className="btn btn-primary" style={{ marginTop: "1.6rem" }}>
            {d.succes.retour}
          </Link>
        )}
      </div>
    </main>
  );
}
