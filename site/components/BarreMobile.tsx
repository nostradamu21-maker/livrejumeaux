import { t, type Locale } from "@/lib/i18n";

export default function BarreMobile({ l }: { l: Locale }) {
  const d = t(l);
  return (
    <a href="#creer" className="barre-mobile">
      <span className="bm-prix">
        44,90&nbsp;€ <small>{d.barre.note}</small>
      </span>
      <span className="bm-btn">{d.barre.cta}</span>
    </a>
  );
}
