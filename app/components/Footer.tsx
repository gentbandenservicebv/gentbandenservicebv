"use client";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import "./Footer.css";

const services = [
  "Montage & Balans",
  "Bandenherstelling",
  "TPMS Veranderen",
  "Bandeninspectie",
];

const quickLinks = [
  { href: "/banden", label: "Banden" },
  { href: "/diensten", label: "Diensten" },
  { href: "/verkoop-banden", label: "Tweedehands banden verkopen" },
  { href: "/retourbeleid", label: "Retour & Herroeping" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
];

function FooterInner() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="footer">
      {/* CTA Strip */}
      <div className="footer-cta">
        <div className="container">
          <div className="footer-cta__inner">
            <div className="footer-cta__content">
              <span className="label">Klaar om te starten?</span>
              <h2 className="h2 text-white">
                Maak vandaag nog een afspraak
              </h2>
              <p className="footer-cta__text">
                Bel ons of stuur een bericht — we helpen u snel verder.
              </p>
            </div>
            <div className="footer-cta__actions">
              <a href="tel:+32467871205" className="btn btn--primary btn--lg">
                <PhoneIcon /> 0467 87 12 05
              </a>
              <Link href="/afspraak" className="btn btn--outline btn--lg">
                Online afspraak
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="footer__main">
        <div className="container">
          <div className="footer__grid">
            {/* Brand */}
            <div className="footer__brand">
              <div className="footer__logo">
                <Image
                  src="/logo-icon.png"
                  alt="Gent Bandenservice BV"
                  width={42}
                  height={42}
                  className="footer__logo-img"
                />
                <div>
                  <div className="footer__logo-brand">
                    <span style={{ color: "var(--primary-light)" }}>Gent</span> Bandenservice
                  </div>
                  <div className="footer__logo-sub">BV • Bandspecialist</div>
                </div>
              </div>
              <p className="footer__desc">
                Uw vertrouwde bandspecialist in Gent. Kwaliteit, eerlijkheid en
                snelle service — al meer dan 20 jaar.
              </p>
              <div className="footer__socials">
                <a href="https://facebook.com/gentbandenservice" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer__social">
                  <FacebookIcon />
                </a>
                <a href="https://instagram.com/gentbandenservice" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer__social">
                  <InstagramIcon />
                </a>
                <a href="https://tiktok.com/@gentbandenservice" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="footer__social">
                  <TikTokIcon />
                </a>
              </div>
            </div>

            {/* Services */}
            <div className="footer__col">
              <h3 className="footer__heading">Diensten</h3>
              <ul className="footer__list">
                {services.map((s) => (
                  <li key={s}>
                    <Link href="/diensten" className="footer__link">
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div className="footer__col">
              <h3 className="footer__heading">Navigatie</h3>
              <ul className="footer__list">
                {quickLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="footer__link">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="footer__col">
              <h3 className="footer__heading">Contact</h3>
              <ul className="footer__list footer__list--contact">
                <li>
                  <LocationIcon />
                  <span>Dendermondsesteenweg 428<br />9040 Sint-Amandsberg (Gent)</span>
                </li>
                <li>
                  <PhoneIcon />
                  <a href="tel:+32467871205" className="footer__link">0467 87 12 05</a>
                </li>
                <li>
                  <MailIcon />
                  <a href="mailto:info@gentbandenservice.be" className="footer__link">
                    info@gentbandenservice.be
                  </a>
                </li>
              </ul>
              <div className="footer__hours">
                <h4 className="footer__hours-title">Openingsuren</h4>
                <div className="footer__hours-grid">
                  <span>Ma – Za</span><span>09:00 – 18:00</span><span>Zondag</span><span>Gesloten</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <div className="container">
          <div className="footer__bottom-inner">
            <p className="footer__copy">
              © {new Date().getFullYear()} Gent Bandenservice BV • BTW/KBO: BE 1041.093.575 • Alle rechten voorbehouden.
            </p>
            <div className="footer__legal">
              <Link href="/retourbeleid" className="footer__legal-link">Retourbeleid</Link>
              <Link href="/privacy" className="footer__legal-link">Privacybeleid</Link>
              <Link href="/cookies" className="footer__legal-link">Cookiebeleid</Link>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("open-cookie-banner"));
                  }
                }}
                className="footer__legal-link"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                Cookie-instellingen
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── SVG Icons ───────────────────────────────────────────────────
function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.12 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.22 1.21h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.03z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" />
      <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (

    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.3 0 .6.05.9.14V9.38a6.3 6.3 0 0 0-.9-.06 6.35 6.35 0 1 0 6.35 6.35V8.68a8.2 8.2 0 0 0 4.8 1.54V6.77a4.85 4.85 0 0 1-1.03-.08z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <Suspense fallback={null}>
      <FooterInner />
    </Suspense>
  );
}