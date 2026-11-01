import "./TestimonialsSection.css";

const testimonials = [
  {
    name: "Ahmed B.",
    location: "Gent",
    rating: 5,
    date: "Oktober 2026",
    text: "Uitstekende service! Banden snel gemonteerd en uitgebalanceerd. Eerlijke prijs en vriendelijk personeel. Ik kom zeker terug.",
    car: "Volkswagen Golf",
  },
  {
    name: "Marie V.",
    location: "Merelbeke",
    rating: 5,
    date: "September 2026",
    text: "Tweedehands banden gekocht voor mijn tweede wagen — perfect keuring, goede staat. Gratis inspectie was een extra troef. Aanrader!",
    car: "Toyota Yaris",
  },
  {
    name: "Thomas D.",
    location: "Gent",
    rating: 5,
    date: "Augustus 2026",
    text: "TPMS-sensor snel en correct vervangen. Andere garage kon me 2 weken wachten laten — hier was ik dezelfde dag geholpen.",
    car: "BMW 5-serie",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="section testimonials-section" id="reviews">
      <div className="container">
        <div className="section-header">
          <span className="label">Klantenreviews</span>
          <h2 className="h2">Wat onze klanten zeggen</h2>
          <span className="divider divider--center" />
          <div className="testimonials-aggregate">
            <div className="testimonials-stars" aria-label="4.9 van 5 sterren">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} filled />
              ))}
            </div>
            <span className="testimonials-score">4.9 / 5</span>
            <span className="testimonials-count">op basis van 120+ Google reviews</span>
          </div>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <article
              key={t.name}
              className="testimonial-card card"
              style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
            >
              {/* Stars */}
              <div className="testimonial-card__stars" aria-label={`${t.rating} sterren`}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <StarIcon key={j} filled={j < t.rating} />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="testimonial-card__quote">
                <QuoteIcon />
                <p>&ldquo;{t.text}&rdquo;</p>
              </blockquote>

              {/* Author */}
              <footer className="testimonial-card__author">
                <div className="testimonial-card__avatar">
                  {t.name.charAt(0)}
                </div>
                <div className="testimonial-card__meta">
                  <span className="testimonial-card__name">{t.name}</span>
                  <span className="testimonial-card__detail">
                    {t.car} · {t.location} · {t.date}
                  </span>
                </div>
                <div className="testimonial-card__google">
                  <GoogleIcon />
                </div>
              </footer>
            </article>
          ))}
        </div>

        <div className="testimonials-cta">
          <a
            href="https://g.page/r/CfakeReview/review"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--outline testimonials-cta__btn"
          >
            <GoogleIcon />
            Schrijf een review
          </a>
        </div>
      </div>
    </section>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 1.5l2.18 4.42 4.82.7-3.5 3.41.83 4.8L9 12.37l-4.33 2.28.83-4.8L2 6.62l4.82-.7L9 1.5z"
        fill={filled ? "#F59E0B" : "none"}
        stroke={filled ? "#F59E0B" : "#D1D5DB"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 17H4a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 001-1V8a1 1 0 00-1-1H4a1 1 0 00-1 1v11a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 000 2h3a3 3 0 003-3v-5a3 3 0 00-3-3zm16 0h-3a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 001-1V8a1 1 0 00-1-1h-4a1 1 0 00-1 1v11a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 000 2h3a3 3 0 003-3v-5a3 3 0 00-3-3z" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
