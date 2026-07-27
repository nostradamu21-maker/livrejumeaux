"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

export default function ContactForm({ l }: { l: Locale }) {
  const d = t(l).contact;
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [statut, setStatut] = useState<{ txt: string; cls: string }>({ txt: "", cls: "" });

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || message.trim().length < 2) {
      setStatut({ txt: d.requis, cls: "erreur" });
      return;
    }
    setEnvoi(true);
    setStatut({ txt: "", cls: "" });
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim(),
          message: message.trim(),
          langue: l,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.ok) {
        setStatut({ txt: d.ok, cls: "ok" });
        setNom("");
        setEmail("");
        setMessage("");
      } else {
        setStatut({ txt: d.erreur, cls: "erreur" });
      }
    } catch {
      setStatut({ txt: d.erreur, cls: "erreur" });
    }
    setEnvoi(false);
  }

  return (
    <form className="contact-form" onSubmit={soumettre}>
      <input
        type="text"
        className="champ-email"
        placeholder={d.phNom}
        maxLength={120}
        autoComplete="name"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
      />
      <input
        type="email"
        className="champ-email"
        placeholder={d.phEmail}
        maxLength={200}
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <textarea
        className="champ-message"
        placeholder={d.phMessage}
        maxLength={5000}
        rows={6}
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button type="submit" className="btn btn-primary" disabled={envoi}>
        {envoi ? d.envoi : d.envoyer}
      </button>
      <p className={`statut ${statut.cls}`} role="status">{statut.txt}</p>
    </form>
  );
}
