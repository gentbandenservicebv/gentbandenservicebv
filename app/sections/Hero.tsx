import Link from "next/link";
import Image from "next/image";
import "./Hero.css";
import TireFinder from "./TireFinder";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      {/* Background */}
      <div className="hero__bg">
        <div className="hero__gradient" />
        <div className="hero__grid" aria-hidden="true" />
        {/* Animated tire graphic */}
        <div className="hero__tire-deco" aria-hidden="true">
          <BigTireGraphic />
        </div>
      </div>

      <div className="container hero__container">
        <div className="hero__content">
          {/* Label */}
          <div className="hero__badge">
            <span className="badge badge--primary" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px" }}>
              <Image
                src="/logo-icon.png"
                alt="Gent Bandenservice BV Logo"
                width={20}
                height={20}
                style={{ objectFit: "contain" }}
              />
              Dé Bandspecialist van Gent &amp; Omstreken
            </span>
          </div>

          {/* Headline */}
          <h1 className="display-1 text-white hero__headline">
            Banden van topkwaliteit —{" "}
            <span className="hero__headline-accent">nieuw & tweedehands</span>
          </h1>

          {/* Subline */}
          <p className="hero__sub">
            Professionele montage, TPMS service, bandenherstelling en inspectie.
            Vlakbij in Gent, zonder wachttijden.
          </p>

          {/* CTA Buttons */}
          <div className="hero__actions">
            <Link href="/banden" className="btn btn--primary btn--lg">
              Banden bekijken
              <ArrowRightIcon />
            </Link>
            <Link href="/afspraak" className="btn btn--outline btn--lg">
              Afspraak inplannen
            </Link>
          </div>

          <div className="hero__quick-appt">
            <Link href="/afspraak" className="hero__quick-appt-link">
              <span className="hero__quick-appt-badge">
                <CalendarIcon />
                <span>Heeft u al eigen banden?</span>
              </span>
              <span className="hero__quick-appt-action">
                <span>Kies direct uw tijdslot in onze planner</span>
                <ArrowMiniIcon />
              </span>
            </Link>
          </div>

          {/* Quick trust */}
          <div className="hero__trust">
            <div className="hero__trust-item">
              <CheckIcon />
              <span>Gratis bandeninspectie</span>
            </div>
            <div className="hero__trust-item">
              <CheckIcon />
              <span>Snelle montage</span>
            </div>
            <div className="hero__trust-item">
              <CheckIcon />
              <span>Eerlijke prijzen</span>
            </div>
          </div>
        </div>

        {/* Tire Size Finder Card */}
        <div className="hero__finder">
          <TireFinder />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll" aria-hidden="true">
        <div className="hero__scroll-dot" />
        <span>Scroll</span>
      </div>
    </section>
  );
}

// ─── Icons ─────────────────────────────────────────────────────
function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowMiniIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 4L6.5 10.5 3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TireSearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M21 21l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15 15l-2.5-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function BigTireGraphic() {
  return (
    <svg width="600" height="600" viewBox="0 0 600 600" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="heroTireGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#016EB9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#016EB9" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Central blue glow */}
      <circle cx="300" cy="300" r="220" fill="url(#heroTireGlow)" />
      {/* Outer ring */}
      <circle cx="300" cy="300" r="280" stroke="rgba(1, 110, 185, 0.15)" strokeWidth="36" />
      {/* Middle ring */}
      <circle cx="300" cy="300" r="200" stroke="rgba(1, 110, 185, 0.2)" strokeWidth="18" />
      {/* Inner ring */}
      <circle cx="300" cy="300" r="120" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
      {/* Hub */}
      <circle cx="300" cy="300" r="44" stroke="rgba(1, 110, 185, 0.5)" strokeWidth="5" />
      <circle cx="300" cy="300" r="16" fill="rgba(1, 110, 185, 0.4)" />
      {/* Spokes */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <line
          key={angle}
          x1={300 + 44 * Math.cos((angle * Math.PI) / 180)}
          y1={300 + 44 * Math.sin((angle * Math.PI) / 180)}
          x2={300 + 120 * Math.cos((angle * Math.PI) / 180)}
          y2={300 + 120 * Math.sin((angle * Math.PI) / 180)}
          stroke="rgba(1, 110, 185, 0.3)"
          strokeWidth="3.5"
        />
      ))}
      {/* Tread marks */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * 2 * Math.PI;
        const r1 = 262, r2 = 282;
        return (
          <line
            key={i}
            x1={300 + r1 * Math.cos(angle)}
            y1={300 + r1 * Math.sin(angle)}
            x2={300 + r2 * Math.cos(angle)}
            y2={300 + r2 * Math.sin(angle)}
            stroke="rgba(1, 110, 185, 0.25)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
