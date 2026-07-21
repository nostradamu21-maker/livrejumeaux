import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Flipbook from "@/components/Flipbook";
import Configurateur from "@/components/Configurateur";
import Etapes from "@/components/Etapes";
import Footer from "@/components/Footer";
import { cataloguePublic } from "@/lib/catalogue";

export default function Page() {
  const archetypes = cataloguePublic();
  return (
    <>
      <Nav />
      <Hero />
      <Flipbook />
      <Configurateur archetypes={archetypes} />
      <Etapes />
      <Footer />
    </>
  );
}
