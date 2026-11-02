import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@uploadthing/react/styles.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import CookieConsent from "./components/CookieConsent";
import UserActivityTracker from "./components/UserActivityTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Gent Bandenservice BV",
    default: "Gent Bandenservice BV — Uw bandspecialist in Gent",
  },
  description:
    "Gent Bandenservice BV: nieuw & tweedehands banden, montage & balans, TPMS veranderen, bandenherstelling en bandeninspectie. Professionele service in Sint-Amandsberg, Gent.",
  keywords: [
    "banden Gent",
    "bandenmontage Gent",
    "tweedehands banden",
    "TPMS veranderen Gent",
    "bandeninspectie",
    "bandeninspectie Gent",
    "Gent Bandenservice",
    "bandspecialist Gent",
    "Sint-Amandsberg banden",
    "goedkope banden Gent",
    "A-merk banden",
    "winterbanden Gent",
    "zomerbanden Gent",
    "all-season banden",
  ],
  authors: [{ name: "Gent Bandenservice BV" }],
  creator: "Gent Bandenservice BV",
  publisher: "Gent Bandenservice BV",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: SITE_URL,
    siteName: "Gent Bandenservice BV",
    title: "Gent Bandenservice BV — Uw bandspecialist in Gent",
    description:
      "Nieuw & tweedehands banden, montage & balans, TPMS veranderen, bandenherstelling en bandeninspectie. Professionele bandservice in Gent.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Gent Bandenservice BV — Uw bandspecialist in Gent",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@GentBandenservice",
    creator: "@GentBandenservice",
    title: "Gent Bandenservice BV — Uw bandspecialist in Gent",
    description:
      "Nieuw & tweedehands banden, montage & balans, TPMS veranderen, bandenherstelling en bandeninspectie. Professionele bandservice in Gent.",
    images: [OG_IMAGE],
  },
  verification: {
    // google: "YOUR_GOOGLE_SITE_VERIFICATION_TOKEN", // add when you have it
  },
};

// JSON-LD: LocalBusiness structured data
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  "@id": `${SITE_URL}/#organization`,
  name: "Gent Bandenservice BV",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: OG_IMAGE,
  description:
    "Nieuw en tweedehands banden, bandenmontage, balanseren, TPMS veranderen, bandenherstelling en bandeninspectie in Gent.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Dendermondsesteenweg 428",
    addressLocality: "Sint-Amandsberg",
    addressRegion: "Gent",
    postalCode: "9040",
    addressCountry: "BE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 51.0652,
    longitude: 3.7588,
  },
  telephone: "+32467871205",
  email: "info@gentbandenservice.be",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  priceRange: "€€",
  currenciesAccepted: "EUR",
  paymentAccepted: "Cash, Credit Card, Bancontact",
  areaServed: {
    "@type": "City",
    name: "Gent",
  },
  sameAs: [
    "https://www.facebook.com/GentBandenservice",
    "https://www.instagram.com/gentbandenservice",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Bandenassortiment",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Nieuwe banden" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Tweedehands banden" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Bandenmontage & balans" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "TPMS veranderen" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Bandenherstelling" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Bandeninspectie" } },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={inter.variable}>
      <body>
        {/* JSON-LD LocalBusiness schema */}
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          strategy="afterInteractive"
        />

        <Suspense fallback={<div style={{ height: 72 }} />}>
          <Header />
        </Suspense>
        <main>{children}</main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        <CartDrawer />

        {/* Cookie-based activity tracking */}
        <UserActivityTracker />

        {/* Cookie consent banner */}
        <Suspense fallback={null}>
          <CookieConsent />
        </Suspense>
      </body>
    </html>
  );
}
