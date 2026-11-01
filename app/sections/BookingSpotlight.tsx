import Link from "next/link";
import "./BookingSpotlight.css";

export default function BookingSpotlight() {
  return (
    <section className="booking-spotlight-section">
      <div className="container">
        <div className="booking-spotlight-card">
          <div className="booking-spotlight-content">
            <span className="booking-spotlight-badge">
              <span className="badge-pulse-dot" />
              Realtime Planner Live
            </span>
            <h2 className="booking-spotlight-title">
              Nooit meer onnodig wachten in de rij
            </h2>
            <p className="booking-spotlight-desc">
              Heeft u nieuwe banden, een lekke band of een seizoenswissel? Kies zelf realtime uw gewenste datum en tijdslot in onze werkplaats in Gent.
            </p>

            <div className="booking-steps-preview">
              <div className="preview-step-item">
                <span className="preview-step-num">1</span>
                <div>
                  <strong>Dienst kiezen</strong>
                  <span>Montage, reparatie of wissel</span>
                </div>
              </div>
              <div className="preview-step-item">
                <span className="preview-step-num">2</span>
                <div>
                  <strong>Tijdslot reserveren</strong>
                  <span>Live vrije uren bekijken</span>
                </div>
              </div>
              <div className="preview-step-item">
                <span className="preview-step-num">3</span>
                <div>
                  <strong>Wagen &amp; Nummerplaat</strong>
                  <span>Automatische herkenning</span>
                </div>
              </div>
              <div className="preview-step-item">
                <span className="preview-step-num">4</span>
                <div>
                  <strong>Direct bevestigd</strong>
                  <span>Gegarandeerd uw plek</span>
                </div>
              </div>
            </div>

            <div className="booking-spotlight-actions">
              <Link href="/afspraak" className="btn btn--primary btn--lg booking-btn-main">
                <span>📅 Direct Afspraak Inplannen</span>
                <span className="btn-arrow">→</span>
              </Link>
              <a href="tel:+32467871205" className="btn btn--outline btn--lg booking-btn-call">
                📞 Telefonisch reserveren: 0467 87 12 05
              </a>
            </div>

            <div className="booking-trust-line">
              <span>✓ Geen vooruitbetaling</span>
              <span>✓ Kosteloos verplaatsen</span>
              <span>✓ Gratis parking op eigen terrein</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
