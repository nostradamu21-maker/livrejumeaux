import Link from "next/link";
import { prefixe, t, type Locale } from "@/lib/i18n";

export default function Footer({ l }: { l: Locale }) {
  const d = t(l);
  return (
    <footer className="pied">
      <p className="pied-titre">Deux comme nous</p>
      <p>{d.footer.tagline}</p>
      <nav className="pied-nav">
        <a href={`${prefixe(l)}/livre`}>{d.nav.livre}</a>
        <a href={`${prefixe(l)}/affiche`}>{d.nav.cadre}</a>
        <a href={`${prefixe(l)}/#pourquoi`}>{d.nav.pourquoi}</a>
        <a href={`${prefixe(l)}/#faq`}>{d.nav.questions}</a>
      </nav>
      <p className="pied-seo">{d.footer.seo}</p>
      <p className="pied-fin">{d.footer.fin}</p>
      <nav className="pied-legal">
        {/* Contact localisé ; pages légales servies en français (langue du contrat). */}
        <Link href={l === "fr" ? "/contact" : `/${l}/contact`}>{d.contact.lien}</Link>
        <Link href="/mentions-legales">{d.footer.mentions}</Link>
        <Link href="/cgv">{d.footer.cgv}</Link>
        <Link href="/confidentialite">{d.footer.conf}</Link>
      </nav>
    </footer>
  );
}
