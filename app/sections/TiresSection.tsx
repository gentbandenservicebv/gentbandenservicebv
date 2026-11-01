import Link from "next/link";
import Image from "next/image";
import "./TiresSection.css";

const newTireFeatures = [
  "Alle topmerken: Michelin, Continental, Bridgestone, Pirelli…",
  "Ruime voorraad direct beschikbaar voor montage",
  "Professioneel advies op maat van uw wagen & rijstijl",
  "Beste prijs-kwaliteitsverhouding van regio Gent",
  "Inclusief officiële fabrieks- & montagewaarborg",
];

const usedTireFeatures = [
  "Streng handmatig gekeurd op profieldiepte & karkas",
  "Gegarandeerd 4mm tot 7mm kwalitatief restprofiel",
  "A-merken aan een fractie van de nieuwprijs",
  "100% getest op zijwangen, koordlagen & luchtdruk",
  "Direct ter plaatse vakkundig gemonteerd en gebalanceerd",
];

export default function TiresSection() {
  return (
    <section className="section tires-section" id="banden">
      <div className="container">
        <div className="section-header">
          <span className="label">Ons aanbod</span>
          <h2 className="h2">
            Nieuw én tweedehands —<br />
            voor elk budget
          </h2>
          <span className="divider divider--center" />
          <p className="lead">
            Of u nu kiest voor een gloednieuwe premium merkband of een zorgvuldig gekeurde tweedehands band —
            bij Gent Bandenservice bent u altijd zeker van gecertificeerde veiligheid en eerlijke prijzen.
          </p>
        </div>

        <div className="tires-split">
          {/* ── Nieuwe Banden Card ── */}
          <article className="tires-card tires-card--new">
            <div className="tires-card__media">
              <Image
                src="/images/new-tires.jpg"
                alt="Nieuwe Michelin Pilot Sport en premium merkbanden in Gent"
                width={800}
                height={520}
                className="tires-card__img"
                priority
              />
              <div className="tires-card__badge tires-card__badge--new">
                <SparkleIcon /> 100% Nieuw &amp; Fabrieksvers
              </div>
            </div>

            <div className="tires-card__body">
              <div className="tires-card__top">
                <div className="tires-card__title-group">
                  <span className="tires-card__tag tires-card__tag--new">Premium klasse</span>
                  <h3 className="tires-card__title">Nieuwe banden</h3>
                </div>
                <div className="tires-card__price tires-card__price--new">
                  <span className="tires-card__price-label">Vanaf</span>
                  <span className="tires-card__price-val">€65</span>
                  <span className="tires-card__price-unit">/stuk</span>
                </div>
              </div>

              <p className="tires-card__desc">
                Maximale grip, optimale waterafvoer en kortste remafstand onder alle weersomstandigheden.
                Ruime keuze uit recente productiejaren van topmerken zoals Michelin, Continental en Bridgestone.
              </p>

              <div className="tires-card__features-wrap">
                <span className="tires-card__features-title">Voordelen van onze nieuwe banden:</span>
                <ul className="tires-card__features">
                  {newTireFeatures.map((f) => (
                    <li key={f}>
                      <span className="check-icon-circle check-icon-circle--blue">
                        <CheckIcon />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tires-card__actions">
                <Link href="/banden?type=nieuw" className="btn btn-primary-custom">
                  Nieuwe banden ontdekken →
                </Link>
                <a href="tel:+32467871205" className="btn btn-phone-custom">
                  <PhoneIcon /> Bel: 0467 87 12 05
                </a>
              </div>
            </div>
          </article>

          {/* ── Tweedehands Banden Card ── */}
          <article className="tires-card tires-card--used">
            <div className="tires-card__media">
              <Image
                src="/images/used-tires.jpg"
                alt="Tweedehands banden grondig gekeurd met profieldieptemeter in Gent Bandenservice werkplaats"
                width={800}
                height={520}
                className="tires-card__img"
              />
              <div className="tires-card__badge tires-card__badge--used">
                <ShieldCheckIcon /> Veiligheid Gekeurd (4-7mm)
              </div>
            </div>

            <div className="tires-card__body">
              <div className="tires-card__top">
                <div className="tires-card__title-group">
                  <span className="tires-card__tag tires-card__tag--used">Budgetvriendelijk &amp; Duurzaam</span>
                  <h3 className="tires-card__title">Tweedehands banden</h3>
                </div>
                <div className="tires-card__price tires-card__price--used">
                  <span className="tires-card__price-label">Vanaf</span>
                  <span className="tires-card__price-val">€35</span>
                  <span className="tires-card__price-unit">/stuk</span>
                </div>
              </div>

              <p className="tires-card__desc">
                Bespaar slim zonder in te boeten op veiligheid. Elk set tweedehands banden wordt
                in onze werkplaats grondig geïnspecteerd met professionele profieldieptemeters en druktesten.
              </p>

              <div className="tires-card__features-wrap">
                <span className="tires-card__features-title">Gegarandeerde kwaliteitseisen:</span>
                <ul className="tires-card__features">
                  {usedTireFeatures.map((f) => (
                    <li key={f}>
                      <span className="check-icon-circle check-icon-circle--green">
                        <CheckIcon />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tires-card__actions">
                <Link href="/banden?type=tweedehands" className="btn btn-dark-custom">
                  Tweedehands bekijken →
                </Link>
                <a
                  href="https://wa.me/32467871205?text=Hallo%20Gent%20Bandenservice,%20ik%20zoek%20tweedehands%20banden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp-custom"
                >
                  <WhatsAppIcon /> WhatsApp voorraad
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

// ─── Icons ───────────────────────────────────────────────────
function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7.5L5.5 10L11 4.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm0 18.15c-1.52 0-3-.41-4.3-1.18l-.31-.18-3.19.84.85-3.11-.2-.32a8.214 8.214 0 01-1.26-4.29c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c.01 4.54-3.69 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z" />
    </svg>
  );
}
