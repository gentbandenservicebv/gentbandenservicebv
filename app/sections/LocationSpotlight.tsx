import Link from "next/link";
import "./LocationSpotlight.css";

export default function LocationSpotlight() {
  return (
    <section className="section bg-white location-spotlight-section" id="locatie">
      <div className="container">
        <div className="location-grid">
          {/* Info Side */}
          <div className="location-info-card">
            <span className="label">Bezoek Onze Werkplaats</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Vlot bereikbaar in Gent
            </h2>
            <p className="text-muted" style={{ marginTop: 10, lineHeight: 1.6, fontSize: "0.95rem" }}>
              Gent Bandenservice BV ligt direct aan de Dendermondsesteenweg 428 in Sint-Amandsberg, op 5 minuten van station Gent-Dampoort met vlotte aansluiting op de R4 en R40.
            </p>

            <div className="location-details-list">
              <div className="loc-item">
                <span className="loc-icon">📍</span>
                <div>
                  <strong>Werkplaats Adres</strong>
                  <p>Dendermondsesteenweg 428, 9040 Sint-Amandsberg (Gent)</p>
                  <span className="loc-sub">Ruime gratis parking direct op eigen terrein</span>
                </div>
              </div>

              <div className="loc-item">
                <span className="loc-icon">🕒</span>
                <div>
                  <strong>Openingsuren</strong>
                  <p>Maandag t/m Zaterdag: <strong>09:00 – 18:00</strong></p>
                  <span className="loc-sub">Zondag gesloten (acute spoedgevallen op aanvraag)</span>
                </div>
              </div>

              <div className="loc-item">
                <span className="loc-icon">📞</span>
                <div>
                  <strong>Contact &amp; Spoed</strong>
                  <p><a href="tel:+32467871205" className="loc-phone-link">0467 87 12 05</a></p>
                  <span className="loc-sub">Voor direct advies of acute pechhulp</span>
                </div>
              </div>
            </div>

            <div className="location-actions">
              <a
                href="https://maps.google.com/?q=Gent+Bandenservice+Dendermondsesteenweg+428+9040+Sint-Amandsberg"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
              >
                🗺️ Route in Google Maps
              </a>
              <Link href="/contact" className="btn btn--outline">
                Stuur een bericht
              </Link>
            </div>
          </div>

          {/* Map Side */}
          <div className="location-map-wrap">
            <iframe
              title="Locatie Gent Bandenservice BV"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2507.971578335035!2d3.753381676887532!3d51.05364177171358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3713f044942cf%3A0xe1001eb708942b08!2sDendermondsesteenweg%20428%2C%209040%20Gent!5e0!3m2!1snl!2sbe!4v1716382901234!5m2!1snl!2sbe"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 380 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
