import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, estLocale, prefixe, t, type Locale } from "@/lib/i18n";
import ContactForm from "@/components/ContactForm";

// Canonical + hreflang PROPRES à la page. Sans `alternates` ici, Next fait
// hériter ceux du layout, qui pointent sur l'accueil : la page se déclarait
// alors doublon de « / » tout en étant listée au sitemap.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = estLocale(locale) ? locale : "fr";
  const languages: Record<string, string> = { "x-default": "/contact" };
  for (const loc of LOCALES) languages[loc] = `${prefixe(loc)}/contact`;
  return {
    title: "Contact",
    robots: { index: true, follow: true },
    alternates: { canonical: `${prefixe(l)}/contact`, languages },
  };
}

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
