import Link from "next/link";
import { stripe, stripeActif } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function Succes({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let ok = true;
  let titre = "Merci ! Commande confirmée";
  let message =
    "Votre commande est bien enregistrée. Nous préparons votre livre et vous tenons informé par e-mail.";

  if (stripeActif && stripe && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== "paid") {
        ok = false;
        titre = "Paiement non finalisé";
        message = "Le paiement n'a pas été confirmé. Aucun montant n'a été débité.";
      } else {
        const m = session.metadata ?? {};
        if (m.prenom1 && m.prenom2) {
          message = `Le livre de ${m.prenom1} & ${m.prenom2} est en préparation. Nous validons les illustrations puis il est imprimé et expédié chez vous.`;
        }
      }
    } catch {
      ok = false;
      titre = "Paiement introuvable";
      message = "Nous n'avons pas pu retrouver votre paiement.";
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
        <Link href="/" className="btn btn-primary" style={{ marginTop: "1.6rem" }}>
          Revenir à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
