import type { Metadata } from "next";
import Link from "next/link";
import CookieSettingsButton from "./CookieSettingsButton";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Cookiebeleid — Transparantie & Privacy",
  description:
    "Lees hoe Gent Bandenservice BV omgaat met cookies. Wij gebruiken uitsluitend functionele en noodzakelijke cookies, géén tracking- of advertentiecookies.",
  alternates: {
    canonical: `${SITE_URL}/cookies`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/cookies`,
    siteName: "Gent Bandenservice BV",
    title: "Cookiebeleid — Gent Bandenservice BV",
    description:
      "Informatie over het gebruik van functionele en noodzakelijke cookies bij Gent Bandenservice BV.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Cookiebeleid Gent Bandenservice BV" }],
  },
};

export default function CookiesPage() {
  return (
    <>
      <div className="page-hero bg-dark">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Cookiebeleid</span>
          </div>
          <h1 className="h1 text-white" style={{ marginTop: 16 }}>
            Cookiebeleid
          </h1>
          <p className="page-hero__sub">
            Transparantie over cookies en websitefunctionaliteit
          </p>
        </div>
      </div>

      <section className="section bg-white">
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, color: "var(--text)", lineHeight: 1.7 }}>
            <p>
              Onze website maakt uitsluitend gebruik van noodzakelijke en functionele cookies die ervoor zorgen dat de website correct functioneert en u moeiteloos online afspraken kunt inplannen.
            </p>

            <h2 className="h3 text-dark">1. Wat zijn cookies?</h2>
            <p>
              Cookies zijn kleine tekstbestandjes die op uw computer of smartphone worden opgeslagen bij een bezoek aan een website om instellingen en voorkeuren te onthouden.
            </p>

            <h2 className="h3 text-dark">2. Welke cookies gebruiken wij?</h2>
            <p>
              Wij plaatsen géén commerciële trackingcookies of advertentiepixels van derden (zoals Meta of Google Ads). Wij gebruiken uitsluitend first-party cookies die direct door onze eigen server worden beheerd om websiteprestaties en bezoekersnavigatie te analyseren:
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Cookie naam</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Type</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Bewaartermijn</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Doel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600 }}>gbs_vid</td>
                    <td style={{ padding: "10px 14px" }}>First-party analytisch</td>
                    <td style={{ padding: "10px 14px" }}>1 jaar</td>
                    <td style={{ padding: "10px 14px" }}>Herkenning van unieke bezoekerssessies op gentbandenservice.be.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600 }}>gbs_sid</td>
                    <td style={{ padding: "10px 14px" }}>First-party sessie</td>
                    <td style={{ padding: "10px 14px" }}>30 minuten</td>
                    <td style={{ padding: "10px 14px" }}>Groepeert bekeken pagina&apos;s en tijdsduur binnen één doorlopend bezoek.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600 }}>gent_banden_cookies_v2</td>
                    <td style={{ padding: "10px 14px" }}>Functioneel (LocalStorage)</td>
                    <td style={{ padding: "10px 14px" }}>1 jaar</td>
                    <td style={{ padding: "10px 14px" }}>Slaat uw toestemmingskeuze (geaccepteerd of geweigerd) op.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="h3 text-dark">3. Cookies beheren of uitschakelen</h2>
            <p>
              U kunt uw cookiekeuze op elk moment via de knop hieronder of via de link &quot;Cookie-instellingen&quot; in de footer van elke pagina opnieuw aanpassen of intrekken.
            </p>
            <div>
              <CookieSettingsButton />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
