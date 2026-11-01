import type { Metadata } from "next";
import { ReactNode } from "react";
import Script from "next/script";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Contact & Werkplaats Gent — Dendermondsesteenweg 428",
  description:
    "Neem contact op met Gent Bandenservice BV. Bezoek onze werkplaats aan de Dendermondsesteenweg 428, 9040 Sint-Amandsberg (Gent). Bel direct +32 467 87 12 05 of stuur een bericht.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/contact`,
    siteName: "Gent Bandenservice BV",
    title: "Contact & Werkplaats Gent | Gent Bandenservice BV",
    description:
      "Vind Gent Bandenservice aan de Dendermondsesteenweg 428 te Gent (Sint-Amandsberg). Open ma-za 09:00 - 18:00. Bel +32 467 87 12 05.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Contacteer Gent Bandenservice BV in Gent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact & Locatie Werkplaats — Gent Bandenservice BV",
    description:
      "Bezoek ons aan de Dendermondsesteenweg 428 in Gent (Sint-Amandsberg) of bel direct +32 467 87 12 05.",
    images: [OG_IMAGE],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Hoe snel reageren jullie op een contactaanvraag?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tijdens onze openingsuren (maandag t/m zaterdag tussen 09:00 en 18:00) reageren wij gemiddeld binnen 1 tot 2 uur per e-mail of telefoon. Buiten de openingsuren ontvangt u de eerstvolgende ochtend antwoord.",
      },
    },
    {
      "@type": "Question",
      name: "Kan ik direct een werkplaatsafspraak maken via het contactformulier?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Het contactformulier is bedoeld voor algemene vragen en offertes. Direct een datum en tijdslot reserveren voor montage of herstelling kan via onze online afsprakenplanner op gentbandenservice.be/afspraak.",
      },
    },
    {
      "@type": "Question",
      name: "Kan ik bij spoed (lekke band) direct langskomen zonder afspraak?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, absoluut! Bij een acute lekke band of dringende pech kunt u direct zonder voorafgaand bericht naar onze werkplaats aan de Dendermondsesteenweg 428 rijden.",
      },
    },
    {
      "@type": "Question",
      name: "Welke betaalmogelijkheden zijn er in de werkplaats?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "U kunt bij ons betalen met Bancontact, Maestro, Visa, Mastercard, Payconiq en contant. Bedrijven kunnen na goedkeuring op factuur betalen.",
      },
    },
    {
      "@type": "Question",
      name: "Zijn er parkeerplaatsen bij de werkplaats?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jazeker, wij beschikken over een ruime, gratis parking direct voor de werkplaats op eigen terrein.",
      },
    },
  ],
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
