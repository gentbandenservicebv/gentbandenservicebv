import type { Metadata } from "next";
import { ReactNode } from "react";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Online Afspraak Inplannen — Bandenmontage & Service Gent",
  description:
    "Plan direct online uw werkplaatsafspraak in Gent voor bandenmontage, balanceren, seizoenswielwissel, TPMS kalibratie of bandenherstelling. Kies zelf uw gewenste datum en tijdslot.",
  alternates: {
    canonical: `${SITE_URL}/afspraak`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/afspraak`,
    siteName: "Gent Bandenservice BV",
    title: "Online Afspraak Inplannen — Bandenmontage & Service Gent | Gent Bandenservice BV",
    description:
      "Plan direct online uw werkplaatsafspraak in Gent voor bandenmontage, balanceren, seizoenswielwissel, TPMS kalibratie of bandenherstelling.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Afspraak Inplannen bij Gent Bandenservice BV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Afspraak Inplannen — Gent Bandenservice BV",
    description:
      "Plan direct online uw werkplaatsafspraak in Gent voor bandenmontage, balanceren, seizoenswielwissel, TPMS of bandenherstelling.",
    images: [OG_IMAGE],
  },
};

export default function AfspraakLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
