import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Flipbook from "@/components/Flipbook";
import Pourquoi from "@/components/Pourquoi";
import Etapes from "@/components/Etapes";
import Configurateur from "@/components/Configurateur";
import SurMesure from "@/components/SurMesure";
import Cadeau from "@/components/Cadeau";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import BarreMobile from "@/components/BarreMobile";
import { cataloguePublic } from "@/lib/catalogue";
import { donneesStructurees } from "@/lib/seo";

export default function Page() {
  const archetypes = cataloguePublic();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees()) }}
      />
      <Nav />
      <Hero />
      <Flipbook />
      <Pourquoi />
      <Etapes />
      <Configurateur archetypes={archetypes} />
      <SurMesure />
      <Cadeau />
      <Faq />
      <Footer />
      <BarreMobile />
    </>
  );
}
