import type { Metadata } from "next";
import { ReactNode } from "react";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Nieuw & Tweedehands Banden Kopen in Gent — Alle Maten",
  description:
    "Koop nieuw of tweedehands banden in Gent aan scherpe prijzen. Zomer-, winter- en all-season banden van alle A-merken. Maten zoals 205/55R16, 195/65R15, 225/45R17 en meer. Direct afhaalbaar in Sint-Amandsberg.",
  keywords: [
    "banden kopen Gent",
    "nieuw banden Gent",
    "tweedehands banden Gent",
    "tweedehands banden 205 55r16",
    "tweedehands banden 195 65r15",
    "tweedehands banden 225 45r17",
    "goedkope banden Gent",
    "zomerbanden Gent",
    "winterbanden Gent",
    "all-season banden Gent",
    "A-merk banden Sint-Amandsberg",
    "banden webshop Gent",
    "205/55R16 tweedehands",
    "195/65R15 tweedehands",
  ],
  alternates: {
    canonical: `${SITE_URL}/banden`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/banden`,
    siteName: "Gent Bandenservice BV",
    title: "Nieuw & Tweedehands Banden Gent — Alle Maten | Gent Bandenservice BV",
    description:
      "Koop nieuw of tweedehands banden in Gent. Alle maten en merken, direct afhaalbaar of leverbaar.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Tweedehands en nieuwe banden Gent — Gent Bandenservice BV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nieuw & Tweedehands Banden Gent — Alle Maten | Gent Bandenservice BV",
    description:
      "Koop nieuw of tweedehands banden in Gent. Alle maten, direct afhaalbaar.",
    images: [OG_IMAGE],
  },
};

export default function BandenLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
