"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./CookieConsent.css";

const STORAGE_KEY = "gent_banden_cookies_v2";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }

    const handleOpen = () => setVisible(true);
    window.addEventListener("open-cookie-banner", handleOpen);

    // Provide debugging/re-open helpers on window
    (window as unknown as { openCookieBanner?: () => void }).openCookieBanner = handleOpen;
    (window as unknown as { resetCookieConsent?: () => void }).resetCookieConsent = () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("cookie-consent");
      } catch {}
      setVisible(true);
    };

    return () => {
      window.removeEventListener("open-cookie-banner", handleOpen);
    };
  }, []);

  function handleAccept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
      window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: "accepted" }));
    } catch {}
    setVisible(false);
  }

  function handleDecline() {
    try {
      localStorage.setItem(STORAGE_KEY, "declined");
      window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: "declined" }));
    } catch {}
    setVisible(false);
  }

  if (!mounted || !visible) return null;

  return (
    <aside
      className="cookie-bar"
      role="dialog"
      aria-label="Cookie-instellingen"
      aria-modal="false"
    >
      <div className="cookie-bar__inner">
        <div className="cookie-bar__icon" aria-hidden="true">
          🍪
        </div>
        <div className="cookie-bar__content">
          <p className="cookie-bar__title">Wij waarderen uw privacy</p>
          <p className="cookie-bar__text">
            Gent Bandenservice gebruikt noodzakelijke en functionele cookies om de website betrouwbaar en snel te laten werken. Wij gebruiken <strong>geen advertentietrackers</strong>.{" "}
            <Link href="/cookies" className="cookie-bar__link">
              Lees ons cookiebeleid
            </Link>
          </p>
        </div>
        <div className="cookie-bar__actions">
          <button
            type="button"
            className="cookie-bar__btn cookie-bar__btn--decline"
            onClick={handleDecline}
          >
            Alleen noodzakelijk
          </button>
          <button
            type="button"
            className="cookie-bar__btn cookie-bar__btn--accept"
            onClick={handleAccept}
          >
            Alles accepteren
          </button>
        </div>
        <button
          type="button"
          className="cookie-bar__close"
          onClick={handleDecline}
          aria-label="Sluit melding"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
