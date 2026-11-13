import { fetchGoogleReviews } from "@/lib/google-reviews";
import type { GoogleReview } from "@/lib/google-reviews";
import "./TestimonialsSection.css";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Format Unix timestamp → Dutch month + year, e.g. "november 2026" */
function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString("nl-BE", {
    month: "long",
    year: "numeric",
  });
}

/** Clamp review text to ~280 chars for card legibility */
function clampText(text: string, max = 280): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/** Round to nearest 0.1 */
function fmtRating(r: number): string {
  return r.toFixed(1).replace(".", ",");
}

// ─── component ────────────────────────────────────────────────────────────────

export default async function TestimonialsSection() {
  const data = await fetchGoogleReviews();

  // Show all reviews with text; prefer 4+ stars, show up to 5 (API max)
  const reviews: GoogleReview[] = (data?.reviews ?? [])
    .filter((r) => r.text?.trim())
    .sort((a, b) => b.rating - a.rating || b.time - a.time)
    .slice(0, 5);

  const rating = data?.rating ?? 0;
  const totalReviews = data?.user_ratings_total ?? 0;
  const reviewUrl = data?.url ?? "https://maps.google.com";

  // Fallback: if Places API is unreachable, show nothing (no fake data)
  const hasData = reviews.length > 0;

  return (
    <section className="section testimonials-section" id="reviews">
      <div className="container">
        <div className="section-header">
          <span className="label">Klantenreviews</span>
          <h2 className="h2">Wat onze klanten zeggen</h2>
          <span className="divider divider--center" />

          {rating > 0 && (
            <div className="testimonials-aggregate">
              <div
                className="testimonials-stars"
                aria-label={`${fmtRating(rating)} van 5 sterren`}
              >
                <StarRating value={rating} />
              </div>
              <span className="testimonials-score">{fmtRating(rating)} / 5</span>
              {totalReviews > 0 && (
                <span className="testimonials-count">
                  op basis van {totalReviews}+ Google reviews
                </span>
              )}
            </div>
          )}
        </div>

        {hasData ? (
          <div className="testimonials-grid">
            {reviews.map((review, i) => (
              <article
                key={review.author_url + i}
                className="testimonial-card card"
                style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
              >
                {/* Stars */}
                <div
                  className="testimonial-card__stars"
                  aria-label={`${review.rating} sterren`}
                >
                  {Array.from({ length: 5 }).map((_, j) => (
                    <StarIcon key={j} filled={j < review.rating} />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="testimonial-card__quote">
                  <QuoteIcon />
                  <p>&ldquo;{clampText(review.text)}&rdquo;</p>
                </blockquote>

                {/* Author */}
                <footer className="testimonial-card__author">
                  {/* Avatar: use Google photo, fallback to initial */}
                  <div className="testimonial-card__avatar-wrap">
                    {review.profile_photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={review.profile_photo_url}
                        alt={review.author_name}
                        className="testimonial-card__avatar-img"
                        width={40}
                        height={40}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="testimonial-card__avatar">
                        {review.author_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="testimonial-card__meta">
                    <span className="testimonial-card__name">
                      {review.author_name}
                    </span>
                    <span className="testimonial-card__detail">
                      {formatDate(review.time)}
                    </span>
                  </div>
                  <div className="testimonial-card__google" aria-label="Google review">
                    <GoogleIcon />
                  </div>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          /* Soft fallback when API is unavailable */
          <p className="testimonials-unavailable">
            Reviews tijdelijk niet beschikbaar. Bekijk ze rechtstreeks op Google.
          </p>
        )}

        <div className="testimonials-cta">
          <a
            href={reviewUrl}
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

// ─── icons ────────────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => {
        const diff = value - i;
        const filled = diff >= 0.75;
        const half = !filled && diff >= 0.25;
        return <StarIcon key={i} filled={filled} half={half} />;
      })}
    </>
  );
}

function StarIcon({ filled, half = false }: { filled: boolean; half?: boolean }) {
  const fill = filled ? "#F59E0B" : half ? "url(#half)" : "none";
  const stroke = filled || half ? "#F59E0B" : "#D1D5DB";
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      {half && (
        <defs>
          <linearGradient id="half" x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M9 1.5l2.18 4.42 4.82.7-3.5 3.41.83 4.8L9 12.37l-4.33 2.28.83-4.8L2 6.62l4.82-.7L9 1.5z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M7 17H4a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 001-1V8a1 1 0 00-1-1H4a1 1 0 00-1 1v11a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 000 2h3a3 3 0 003-3v-5a3 3 0 00-3-3zm16 0h-3a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 001-1V8a1 1 0 00-1-1h-4a1 1 0 00-1 1v11a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 000 2h3a3 3 0 003-3v-5a3 3 0 00-3-3z"
        fill="currentColor"
        opacity="0.15"
      />
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
