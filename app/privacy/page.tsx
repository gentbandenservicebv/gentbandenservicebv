import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Privacybeleid — Bescherming van Persoonsgegevens",
  description:
    "Lees hoe Gent Bandenservice BV uw persoonsgegevens verzamelt, gebruikt en beschermt conform de geldende GDPR / AVG wetgeving.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/privacy`,
    siteName: "Gent Bandenservice BV",
    title: "Privacybeleid — Gent Bandenservice BV",
    description:
      "Lees hoe Gent Bandenservice BV uw privacy en persoonsgegevens waarborgt conform de AVG/GDPR normen.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Privacybeleid Gent Bandenservice BV" }],
  },
};

export default function PrivacyPage() {
  return (
    <>
      <div className="page-hero bg-dark">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Privacybeleid</span>
          </div>
          <h1 className="h1 text-white" style={{ marginTop: 16 }}>
            Privacybeleid
          </h1>
          <p className="page-hero__sub">
            Hoe wij zorgvuldig met uw persoonsgegevens omgaan
          </p>
        </div>
      </div>

      <section className="section bg-white">
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, color: "var(--text)", lineHeight: 1.7 }}>
            <p>
              Gent Bandenservice BV, gevestigd te Dendermondsesteenweg 428, 9040 Sint-Amandsberg (Gent) (KBO/BTW: BE 1041.093.575), hecht veel waarde aan de bescherming van uw privacy en persoonsgegevens. In deze verklaring leggen we uit welke gegevens we verzamelen en waarom.
            </p>

            <h2 className="h3 text-dark">1. Welke gegevens verzamelen wij?</h2>
            <p>
              Wanneer u een afspraak maakt of contact met ons opneemt via onze website, kunnen wij de volgende gegevens verwerken: naam, telefoonnummer, e-mailadres, nummerplaat/voertuigtype en bandenmaat.
            </p>

            <h2 className="h3 text-dark">2. Doeleinden van de verwerking</h2>
            <p>
              Wij gebruiken deze gegevens uitsluitend voor het inplannen van uw servicebeurt, het verstrekken van prijsopgaven en direct contact over uw bestelling of montage. Wij verkopen uw gegevens nooit aan derden.
            </p>

            <h2 className="h3 text-dark">3. Bewaartermijn en beveiliging</h2>
            <p>
              Uw gegevens worden beveiligd opgeslagen en niet langer bewaard dan wettelijk of administratief vereist is voor onze dienstverlening.
            </p>

            <h2 className="h3 text-dark">4. Uw rechten</h2>
            <p>
              U heeft te allen tijde het recht op inzage, correctie of verwijdering van uw gegevens. Neem hiervoor gerust contact op via{" "}
              <a href="mailto:info@gentbandenservice.be" style={{ color: "var(--primary)", fontWeight: 600 }}>
                info@gentbandenservice.be
              </a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
