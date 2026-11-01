import type { Metadata } from "next";
import Link from "next/link";
import "./over-ons.css";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Over Ons — Bandspecialist Gent met 20+ Jaar Ervaring",
  description:
    "Gent Bandenservice BV is uw betrouwbare bandspecialist in Gent en omstreken. Meer dan 20 jaar vakkennis, computergestuurde balanceerapparatuur en ruime voorraad nieuwe en tweedehands banden.",
  alternates: {
    canonical: `${SITE_URL}/over-ons`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/over-ons`,
    siteName: "Gent Bandenservice BV",
    title: "Over Ons — Bandspecialist Gent met 20+ Jaar Ervaring | Gent Bandenservice BV",
    description:
      "Leer het team en de werkplaats van Gent Bandenservice kennen. 20+ jaar vakkennis, computergestuurde montagelijn en veilige bandenservice in Gent.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Over Gent Bandenservice BV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Over Ons — Gent Bandenservice BV",
    description:
      "Uw betrouwbare specialist voor banden en bandenservice in Gent.",
    images: [OG_IMAGE],
  },
};

const values = [
  {
    icon: "🛡️",
    title: "Veiligheid op Nr. 1",
    desc: "Elke band die onze werkplaats verlaat wordt nauwkeurig gekeurd op profieldiepte, spanning en karkasveiligheid.",
  },
  {
    icon: "🤝",
    title: "Eerlijk & Transparant",
    desc: "Geen verborgen meerkosten. U weet vóór de montage precies wat de prijs is voor banden, ventielen en balanceren.",
  },
  {
    icon: "⚡",
    title: "Snel & Zonder Wachten",
    desc: "Dankzij onze ruime voorraad en dubbele montagelijnen rijdt u in de meeste gevallen binnen 45 minuten weer veilig weg.",
  },
  {
    icon: "♻️",
    title: "Duurzaam & Ecologisch",
    desc: "Oude banden worden 100% gerecycleerd conform de strengste milieunormen. Onze geteste tweedehands banden krijgen een veilig tweede leven.",
  },
];

const workshopFeatures = [
  {
    num: "01",
    title: "Computergestuurd Balanceren",
    text: "Wij kalibreren wielen met professionele apparatuur om trillingen in stuur en chassis vanaf de eerste kilometer te elimineren.",
  },
  {
    num: "02",
    title: "TPMS Sensor Diagnostiek",
    text: "Moderne OBD-2 scan- en inleertools voor alle Europese, Aziatische en Amerikaanse automerken garanderen een foutloze sensorwerking.",
  },
  {
    num: "03",
    title: "Gecertificeerde Koud-Vulkanisatie",
    text: "Lekke band? We herstellen uitsluitend via de officiële RMA-standaard met paddestoel-pluggen aan de binnenzijde van het loopvlak.",
  },
];

export default function OverOnsPage() {
  return (
    <>
      {/* Page Hero */}
      <div className="page-hero bg-dark">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Over ons</span>
          </div>
          <h1 className="h1 text-white" style={{ marginTop: 16 }}>
            Over Gent Bandenservice BV
          </h1>
          <p className="page-hero__sub">
            Vakmanschap, betrouwbaarheid en persoonlijke service in het hart van Gent
          </p>
        </div>
      </div>

      {/* Intro Story */}
      <section className="about-intro">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story__content">
              <span className="label">Ons Verhaal</span>
              <h2 className="h2 text-dark">
                Al meer dan twee decennia dé vertrouwde bandenspecialist
              </h2>
              <p className="about-story__lead">
                Bij Gent Bandenservice BV draait alles om veilige kilometers tegen een eerlijke en transparante prijs.
              </p>
              <p className="about-story__text">
                Wat begon als een gepassioneerde lokale bandencentrale is uitgegroeid tot een modern servicepunt waar particulieren, zakelijke rijders en leasewagens dagelijks op vertrouwen. Of u nu kiest voor topklasse nieuwe merkbanden of een betaalbare, streng gecontroleerde set tweedehands banden: onze toewijding aan kwaliteit blijft dezelfde.
              </p>
              <p className="about-story__text">
                Onze monteurs zijn permanent opgeleid in de nieuwste chassistechnologieën, run-flat constructies en digitale TPMS-sensoren. Zo bent u altijd zeker van een zorgeloze rit.
              </p>

              <div className="about-highlights">
                <div className="about-highlight-box">
                  <div className="about-highlight-box__title">Directe Beschikbaarheid</div>
                  <div className="about-highlight-box__desc">
                    Honderden courante bandenmaten permanent in eigen stock.
                  </div>
                </div>
                <div className="about-highlight-box">
                  <div className="about-highlight-box__title">Centrale Locatie</div>
                  <div className="about-highlight-box__desc">
                    Dendermondsesteenweg 428, 9040 Sint-Amandsberg — vlot bereikbaar met ruime parking op eigen terrein.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Card */}
            <div className="about-visual-card">
              <span className="about-visual-badge">
                ★ 4.9/5 Google Beoordeling
              </span>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 12 }}>
                Gent Bandenservice in cijfers
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5 }}>
                Bewezen kwaliteit waar Gent en omstreken al jaren op kan rekenen.
              </p>

              <div className="about-stats-list">
                <div className="about-stat-row">
                  <span className="about-stat-row__label">Actieve jaren ervaring</span>
                  <span className="about-stat-row__val">20+</span>
                </div>
                <div className="about-stat-row">
                  <span className="about-stat-row__label">Tevreden klanten</span>
                  <span className="about-stat-row__val">5.000+</span>
                </div>
                <div className="about-stat-row">
                  <span className="about-stat-row__label">Gemonteerde banden</span>
                  <span className="about-stat-row__val">25.000+</span>
                </div>
                <div className="about-stat-row">
                  <span className="about-stat-row__label">Gemiddelde montagetijd</span>
                  <span className="about-stat-row__val">&lt; 45 min</span>
                </div>
              </div>

              <Link href="/contact" className="btn btn--primary w-full" style={{ justifyContent: "center" }}>
                Kom vandaag nog langs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="about-values">
        <div className="container">
          <div className="about-values__header">
            <span className="label">Onze Belofte</span>
            <h2 className="h2 text-dark">Waarom kiezen voor ons?</h2>
            <p className="text-muted" style={{ marginTop: 12 }}>
              Vier fundamentele pijlers waarop onze klanten al sinds dag één blindelings bouwen.
            </p>
          </div>

          <div className="values-grid">
            {values.map((v, i) => (
              <div key={i} className="value-card">
                <div className="value-card__icon">{v.icon}</div>
                <h3 className="value-card__title">{v.title}</h3>
                <p className="value-card__desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop & Technology */}
      <section className="about-workshop">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 10px" }}>
            <span className="label">Werkplaats &amp; Materiaal</span>
            <h2 className="h2 text-dark">Professionele apparatuur</h2>
            <p className="text-muted" style={{ marginTop: 12 }}>
              We investeren continu in de modernste balanceer- en de-monteermachines om uw velgen krasvrij te behandelen.
            </p>
          </div>

          <div className="workshop-grid">
            {workshopFeatures.map((f, i) => (
              <div key={i} className="workshop-card">
                <span className="workshop-card__num">{f.num}</span>
                <h3 className="workshop-card__title">{f.title}</h3>
                <p className="workshop-card__text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
