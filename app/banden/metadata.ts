import type { Metadata } from "next";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Bandenwinkel — Nieuw & Tweedehands Banden",
  description:
    "Ontdek ons uitgebreid aanbod nieuw en tweedehands banden in Gent. Alle A-merken, maten en seizoenen — zomerbanden, winterbanden, all-season. Direct afhaalbaar in Sint-Amandsberg.",
  keywords: [
    "banden kopen Gent",
    "nieuw banden Gent",
    "tweedehands banden Gent",
    "goedkope banden Gent",
    "zomerbanden Gent",
    "winterbanden Gent",
    "all-season banden Gent",
    "A-merk banden",
    "bandenmaten",
    "banden online",
  ],
  alternates: {
    canonical: `${SITE_URL}/banden`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/banden`,
    siteName: "Gent Bandenservice BV",
    title: "Bandenwinkel — Nieuw & Tweedehands Banden | Gent Bandenservice BV",
    description:
      "Ontdek ons uitgebreid aanbod nieuw en tweedehands banden in Gent. Alle A-merken, maten en seizoenen. Direct afhaalbaar.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Bandenwinkel Gent — Nieuw & Tweedehands Banden",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bandenwinkel — Nieuw & Tweedehands Banden | Gent Bandenservice BV",
    description:
      "Ontdek ons uitgebreid aanbod nieuw en tweedehands banden in Gent. Alle A-merken, maten en seizoenen.",
    images: [OG_IMAGE],
  },
};
