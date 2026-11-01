"use client";

import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="err-root">
      {/* Animated background */}
      <div className="err-bg" aria-hidden="true">
        <div className="err-bg-circle err-bg-circle--1" />
        <div className="err-bg-circle err-bg-circle--2" />
      </div>

      <div className="err-container">
        {/* Warning icon */}
        <div className="err-icon-wrap" aria-hidden="true">
          <div className="err-icon-ring" />
          <svg className="err-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="#016EB9" strokeWidth="4" />
            <path d="M40 22v22" stroke="#016EB9" strokeWidth="5" strokeLinecap="round"/>
            <circle cx="40" cy="55" r="3.5" fill="#016EB9"/>
          </svg>
        </div>

        <h1 className="err-code">500</h1>
        <p className="err-title">Er is iets misgegaan</p>
        <p className="err-desc">
          Er is een onverwachte fout opgetreden. Ons team is op de hoogte
          gesteld. Probeer het opnieuw of ga terug naar de startpagina.
        </p>

        {error.digest && (
          <p className="err-digest">Foutcode: {error.digest}</p>
        )}

        <div className="err-actions">
          <button onClick={reset} className="err-btn err-btn--primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Opnieuw proberen
          </button>
          <Link href="/" className="err-btn err-btn--secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Terug naar home
          </Link>
        </div>

        <div className="err-links">
          <span className="err-links-label">Hulp nodig?</span>
          <Link href="/contact" className="err-link">Contacteer ons</Link>
          <span className="err-links-sep">·</span>
          <Link href="/afspraak" className="err-link">Afspraak maken</Link>
        </div>
      </div>

      <style>{`
        .err-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0F1117;
          position: relative;
          overflow: hidden;
          padding: 6rem 1.5rem 4rem;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }
        .err-bg { position: absolute; inset: 0; pointer-events: none; }
        .err-bg-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.15;
          animation: err-pulse 10s ease-in-out infinite;
        }
        .err-bg-circle--1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, #B91C1C, transparent 70%);
          top: -250px; right: -200px;
          animation-delay: 0s;
        }
        .err-bg-circle--2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #016EB9, transparent 70%);
          bottom: -150px; left: -100px;
          animation-delay: 4s;
        }
        @keyframes err-pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.22; }
        }
        .err-container {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 540px;
          width: 100%;
        }
        .err-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .err-icon-ring {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          border: 2px solid rgba(1, 110, 185, 0.25);
          animation: err-ring 3s ease-in-out infinite;
        }
        @keyframes err-ring {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .err-icon {
          width: 80px;
          height: 80px;
          filter: drop-shadow(0 0 20px rgba(1, 110, 185, 0.4));
          animation: err-shake 5s ease-in-out infinite;
        }
        @keyframes err-shake {
          0%, 90%, 100% { transform: rotate(0deg); }
          92% { transform: rotate(-4deg); }
          94% { transform: rotate(4deg); }
          96% { transform: rotate(-2deg); }
          98% { transform: rotate(2deg); }
        }
        .err-code {
          font-size: clamp(5rem, 16vw, 9rem);
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 40%, #016EB9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -4px;
          margin-bottom: 0.75rem;
        }
        .err-title {
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 1rem;
        }
        .err-desc {
          font-size: 1rem;
          color: #9CA3AF;
          line-height: 1.7;
          margin-bottom: 1.25rem;
        }
        .err-digest {
          font-size: 0.75rem;
          color: #4B5563;
          font-family: 'Courier New', monospace;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 0.375rem 0.75rem;
          display: inline-block;
          margin-bottom: 2rem;
        }
        .err-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.875rem;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .err-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-size: 0.9375rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
          cursor: pointer;
          border: none;
        }
        .err-btn--primary {
          background: linear-gradient(135deg, #016EB9, #1A8CE8);
          color: #fff;
          box-shadow: 0 4px 20px rgba(1, 110, 185, 0.4);
        }
        .err-btn--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(1, 110, 185, 0.55);
        }
        .err-btn--secondary {
          background: rgba(255, 255, 255, 0.06);
          color: #D1D5DB;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          backdrop-filter: blur(8px);
        }
        .err-btn--secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          transform: translateY(-2px);
        }
        .err-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }
        .err-links-label { color: #6B7280; }
        .err-links-sep { color: #374151; }
        .err-link {
          color: #60A5FA;
          text-decoration: none;
          transition: color 0.15s;
        }
        .err-link:hover { color: #93C5FD; text-decoration: underline; }
        @media (max-width: 480px) {
          .err-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
