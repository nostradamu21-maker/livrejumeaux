import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { estLocale, t } from "@/lib/i18n";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  robots: { index: true, follow: true },
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
  const d = t(locale).contact;
  const accueil = locale === "fr" ? "/" : `/${locale}`;
  return (
    <main className="legale contact-page">
      <Link href={accueil} className="legale-retour">{d.retour}</Link>
      <h1>{d.titre}</h1>
      <p className="legale-maj">{d.intro}</p>
      <ContactForm l={locale} />
    </main>
  );
}
