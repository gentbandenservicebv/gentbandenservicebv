import type { Metadata } from "next";
import Hero from "./sections/Hero";
import TrustBar from "./sections/TrustBar";
import ServicesSection from "./sections/ServicesSection";
import TiresSection from "./sections/TiresSection";
import BrandsSection from "./sections/BrandsSection";
import TestimonialsSection from "./sections/TestimonialsSection";

export const metadata: Metadata = {
  title: "Gent Bandenservice BV — Uw bandspecialist in Gent",
  description:
    "Nieuw & tweedehands banden, montage & balans, TPMS veranderen, bandenherstelling en bandeninspectie. Professionele bandservice in Sint-Amandsberg, Gent.",
  alternates: {
    canonical: "https://www.gentbandenservice.be",
  },
  openGraph: {
    title: "Gent Bandenservice BV — Uw bandspecialist in Gent",
    description:
      "Nieuw & tweedehands banden, montage & balans, TPMS veranderen, bandenherstelling en bandeninspectie.",
    url: "https://www.gentbandenservice.be",
    images: [
      {
        url: "https://www.gentbandenservice.be/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Gent Bandenservice BV — Uw bandspecialist in Gent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gent Bandenservice BV — Uw bandspecialist in Gent",
    description: "Nieuw & tweedehands banden, montage & balans, TPMS & bandeninspectie in Gent.",
    images: ["https://www.gentbandenservice.be/og-image.jpg"],
  },
};


export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ServicesSection />
      <TiresSection />
      <BrandsSection />
      <TestimonialsSection />
    </>
  );
}
