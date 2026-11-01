import Link from "next/link";
import "./ServicesSection.css";

const services = [
  {
    id: "montage",
    icon: <WrenchIcon />,
    title: "Montage & Balanceren",
    description:
      "Vakkundige montage van eigen meegebrachte of nieuwe banden op stalen en aluminium velgen tot 24\". Inclusief dynamische 3D-balancering en nieuwe ventielen.",
    features: ["Contactloze velgbescherming", "Dynamisch computergebalanceerd", "Nieuwe ventielen inbegrepen"],
    color: "#016EB9",
    time: "v.a. €20",
    serviceCode: "FITTING",
  },
  {
    id: "herstelling",
    icon: <RepairIcon />,
    title: "Bandenherstelling",
    description:
      "Veilige koud-vulkanisatie van binnenuit met gecertificeerde paddenstoel-plug. Bij acute pech kunt u direct zonder afspraak binnenrijden.",
    features: ["Interne karkasinspectie", "Gecertificeerde koud-vulkanisatie", "Direct binnenrijden bij pech"],
    color: "#2563EB",
    time: "v.a. €20",
    serviceCode: "REPAIR",
  },
  {
    id: "wielenwissel",
    icon: <WheelIcon />,
    title: "Wielen Wisselen (Zomer/Winter)",
    description:
      "Breng uw complete wielen mee naar de werkplaats. Wij wisselen de 4 wielen vlot om, stellen de juiste spanning af en controleren de staat.",
    features: ["Complete set (4 wielen)", "Spanningscontrole rondom", "Optioneel direct balanceren"],
    color: "#0284c7",
    time: "v.a. €30 / set",
    serviceCode: "OTHER",
  },
  {
    id: "tpms",
    icon: <TPMSIcon />,
    title: "TPMS Sensoren & Diagnose",
    description:
      "OBD-diagnose van batterijen en sensor-ID's. Vervanging met OEM-compatibele sensoren en inleren op uw boordcomputer voor de keuring.",
    features: ["Alle automerken", "OBD programmering & inleren", "Keuringsgarantie"],
    color: "#7C3AED",
    time: "v.a. €40",
    serviceCode: "OTHER",
  },
  {
    id: "inspectie",
    icon: <InspectIcon />,
    title: "Gratis Bandeninspectie",
    description:
      "Grondige visuele controle van profieldiepte, spanning, droogtescheuren en slijtagepatroon. Eerlijk en onafhankelijk advies zonder verplichting.",
    features: ["100% gratis & vrijblijvend", "Meting profieldiepte", "Direct advies"],
    color: "#059669",
    time: "GRATIS",
    serviceCode: "INSPECTION",
  },
];

export default function ServicesSection() {
  return (
    <section className="section services-section" id="diensten">
      <div className="container">
        <div className="section-header">
          <span className="label">Onze expertise</span>
          <h2 className="h2">Alles voor uw banden,<br />op één plek</h2>
          <span className="divider divider--center" />
          <p className="lead">
            Van computergestuurde montage tot snelle herstelling en TPMS — wij bieden een volledig pakket aan bandendiensten
            met eerlijke prijzen en snelle service in Gent.
          </p>
        </div>

        <div className="services-grid">
          {services.map((s, i) => (
            <article
              key={s.id}
              className="service-card card"
              style={{ "--card-color": s.color, animationDelay: `${i * 80}ms` } as React.CSSProperties}
            >
              <div className="service-card__top">
                <div className="service-card__icon-wrap">
                  {s.icon}
                </div>
                <span className="service-card__time">{s.time}</span>
              </div>
              <h3 className="service-card__title">{s.title}</h3>
              <p className="service-card__desc">{s.description}</p>
              <ul className="service-card__features">
                {s.features.map((f) => (
                  <li key={f} className="service-card__feature">
                    <CheckIcon /> {f}
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 16 }}>
                <Link href={`/diensten#${s.id}`} className="service-card__link">
                  Meer details <ArrowIcon />
                </Link>
                <Link href={`/afspraak?service=${s.serviceCode}`} style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--primary)", textDecoration: "underline" }}>
                  Plan in →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="services-cta">
          <Link href="/diensten" className="btn btn--dark btn--lg">
            Alle diensten &amp; tarieven bekijken
          </Link>
          <Link href="/afspraak" className="btn btn--primary btn--lg">
            📅 Direct afspraak inplannen
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Icons ─────────────────────────────────────────────────────
function WrenchIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="2" y1="12" x2="4" y2="12"/></svg>;
}
function RepairIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
}
function WheelIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m10 15 5-3-5-3v6Z"/></svg>;
}
function TPMSIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>;
}
function InspectIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M11.5 3.5L5.5 9.5 2.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ArrowIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
