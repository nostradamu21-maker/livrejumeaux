import { prefixe, t, type Locale } from "@/lib/i18n";

export default function BarreMobile({ l, href }: { l: Locale; href?: string }) {
  const d = t(l);
  return (
    <a href={href ?? `${prefixe(l)}/livre`} className="barre-mobile">
      <span className="bm-prix">
        {d.config.prixLivre} <small>{d.barre.note}</small>
      </span>
      <span className="bm-btn">{d.barre.cta}</span>
    </a>
  );
}
