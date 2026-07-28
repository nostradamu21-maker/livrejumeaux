"use client";

import { useRef, useState } from "react";
import { t, type Locale } from "@/lib/i18n";

// Spot vidéo de la home (musique → lecture au clic, jamais d'autoplay sonore).
// Le MP4 ne se télécharge qu'au clic (preload="none"), seul le poster pèse
// au chargement de la page.
export default function VideoPub({ l }: { l: Locale }) {
  const d = t(l);
  const ref = useRef<HTMLVideoElement>(null);
  const [lance, setLance] = useState(false);

  const lancer = () => {
    setLance(true);
    ref.current?.play();
  };

  return (
    <section className="video-pub" id="video">
      <div className="section-tete">
        <h2>{d.video.h2}</h2>
        <p className="section-sub">{d.video.sub}</p>
      </div>
      <div className="video-cadre">
        <video
          ref={ref}
          controls={lance}
          preload="none"
          poster="/video/pub-poster.jpg"
          playsInline
          onEnded={() => setLance(false)}
        >
          <source src="/video/pub.mp4" type="video/mp4" />
        </video>
        {!lance && (
          <button
            type="button"
            className="video-play"
            onClick={lancer}
            aria-label={d.video.cta}
          >
            <span aria-hidden>▶</span>
          </button>
        )}
      </div>
    </section>
  );
}
