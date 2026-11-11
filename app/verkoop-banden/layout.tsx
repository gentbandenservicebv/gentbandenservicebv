import type { Metadata } from "next";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Tweedehands Banden Verkopen in Gent — Eerlijke Prijs & Snelle Inkoop | Gent Bandenservice BV",
  description:
    "Heeft u gebruikte banden te koop? Verkoop uw tweedehands zomer-, winter- of 4-seizoenenbanden direct aan Gent Bandenservice BV. Snelle online beoordeling, eerlijk bod en directe uitbetaling.",
  keywords: [
    "tweedehands banden verkopen gent",
    "gebruikte banden verkopen",
    "banden opkoper gent",
    "inkoop tweedehands banden",
    "oude autobanden verkopen gent",
    "winterbanden verkopen gent",
    "banden overname gent",
    "banden verkopen contant geld",
    "autobanden inleveren geld gent",
    "gent bandenservice verkoop banden",
  ],
  alternates: {
    canonical: `${SITE_URL}/verkoop-banden`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/verkoop-banden`,
    siteName: "Gent Bandenservice BV",
    title: "Tweedehands Banden Verkopen in Gent | Gent Bandenservice BV",
    description:
      "Verkoop uw tweedehands banden aan Gent Bandenservice. Vul het formulier in, ontvang een vrijblijvend bod en ontvang direct uw geld in Gent.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Tweedehands banden verkopen aan Gent Bandenservice BV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweedehands Banden Verkopen — Gent Bandenservice BV",
    description:
      "Ontvang een eerlijk bod op uw gebruikte banden. Snelle beoordeling en directe uitbetaling in Gent.",
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["AutoRepair", "AutomotiveBusiness"],
      "@id": "https://www.gentbandenservice.be/#autorepair",
      "name": "Gent Bandenservice BV",
      "url": "https://www.gentbandenservice.be",
      "logo": "https://www.gentbandenservice.be/logo-icon.png",
      "image": OG_IMAGE,
      "telephone": "+32467871205",
      "email": "info@gentbandenservice.be",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Dendermondsesteenweg 428",
        "addressLocality": "Sint-Amandsberg (Gent)",
        "postalCode": "9040",
        "addressRegion": "Oost-Vlaanderen",
        "addressCountry": "BE",
      },
    },
    {
      "@type": "Service",
      "@id": "https://www.gentbandenservice.be/verkoop-banden#service",
      "name": "Inkoop Tweedehands Banden Gent",
      "serviceType": "Inkoop en overname van gebruikte banden",
      "provider": {
        "@id": "https://www.gentbandenservice.be/#autorepair",
      },
      "description":
        "Inkoop van tweedehands zomer-, winter- en 4-seizoenenbanden in goede staat. Directe contante uitbetaling of bankoverschrijving in onze werkplaats te Gent.",
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "Gent en Oost-Vlaanderen",
      },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": SITE_URL,
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Tweedehands banden verkopen",
          "item": `${SITE_URL}/verkoop-banden`,
        },
      ],
    },
    {
      "@type": "HowTo",
      "name": "Hoe verkoopt u uw tweedehands banden aan Gent Bandenservice?",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Gegevens invullen",
          "text": "Vul merk, maat, profieldiepte en seizoenssoort in op ons online formulier en voeg optioneel foto's toe.",
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "Vrijblijvend bod ontvangen",
          "text": "Onze specialisten beoordelen uw banden en contacteren u binnen 24 uur met een eerlijk prijsvoorstel.",
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Banden inleveren & directe betaling",
          "text": "Breng de banden langs in onze werkplaats in Gent en ontvang direct uw geld in contanten of per overschrijving.",
        },
      ],
    },
  ],
};

export default function VerkoopBandenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
