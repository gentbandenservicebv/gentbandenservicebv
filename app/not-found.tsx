import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagina niet gevonden | Gent Bandenservice BV",
  description: "De pagina die u zoekt bestaat niet of is verplaatst.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="nf-root">
      {/* Animated background */}
      <div className="nf-bg" aria-hidden="true">
        <div className="nf-bg-circle nf-bg-circle--1" />
        <div className="nf-bg-circle nf-bg-circle--2" />
        <div className="nf-bg-circle nf-bg-circle--3" />
      </div>

      <div className="nf-container">
        {/* Tire illustration */}
        <div className="nf-tire-wrap" aria-hidden="true">
          <svg
            className="nf-tire"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="100" r="96" stroke="#016EB9" strokeWidth="8" />
            {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((i) => {
              const angle = (i * 360) / 16;
              const rad = (angle * Math.PI) / 180;
              const x1 = 100 + 88 * Math.cos(rad);
              const y1 = 100 + 88 * Math.sin(rad);
              const x2 = 100 + 96 * Math.cos(rad);
              const y2 = 100 + 96 * Math.sin(rad);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#016EB9" strokeWidth="6" strokeLinecap="round" />
              );
            })}
            <circle cx="100" cy="100" r="72" stroke="#016EB9" strokeWidth="3" strokeDasharray="6 4" />
            <circle cx="100" cy="100" r="52" fill="#0F1117" stroke="#016EB9" strokeWidth="4" />
            <circle cx="100" cy="100" r="28" fill="#1A1D27" stroke="#016EB9" strokeWidth="3" />
            {[0,1,2,3,4].map((i) => {
              const angle = (i * 72 * Math.PI) / 180;
              return (
                <line key={i}
                  x1={100 + 28 * Math.cos(angle)} y1={100 + 28 * Math.sin(angle)}
                  x2={100 + 50 * Math.cos(angle)} y2={100 + 50 * Math.sin(angle)}
                  stroke="#016EB9" strokeWidth="4" strokeLinecap="round"
                />
              );
            })}
            <circle cx="100" cy="100" r="10" fill="#016EB9" />
          </svg>
          <div className="nf-tire-shadow" />
        </div>

        <h1 className="nf-code">404</h1>
        <p className="nf-title">Oops, deze pagina is weggerold!</p>
        <p className="nf-desc">
          De pagina die u zoekt bestaat niet, is verplaatst of is tijdelijk niet
          beschikbaar. Geen nood — we helpen u terug op de weg.
        </p>

        <div className="nf-actions">
          <Link href="/" className="nf-btn nf-btn--primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Terug naar home
          </Link>
          <Link href="/banden" className="nf-btn nf-btn--secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Ons assortiment
          </Link>
        </div>

        <div className="nf-links">
          <span className="nf-links-label">Snelle links:</span>
          <Link href="/diensten" className="nf-link">Diensten</Link>
          <span className="nf-links-sep">·</span>
          <Link href="/afspraak" className="nf-link">Afspraak maken</Link>
          <span className="nf-links-sep">·</span>
          <Link href="/contact" className="nf-link">Contact</Link>
        </div>
      </div>

      <style>{`
        .nf-root {
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
        .nf-bg { position: absolute; inset: 0; pointer-events: none; }
        .nf-bg-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: nf-pulse 8s ease-in-out infinite;
        }
        .nf-bg-circle--1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #016EB9, transparent 70%);
          top: -200px; left: -150px;
          animation-delay: 0s;
        }
        .nf-bg-circle--2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #1A8CE8, transparent 70%);
          bottom: -100px; right: -100px;
          animation-delay: 3s;
        }
        .nf-bg-circle--3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #005691, transparent 70%);
          top: 40%; left: 60%;
          animation-delay: 5s;
        }
        @keyframes nf-pulse {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.15); opacity: 0.28; }
        }
        .nf-container {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 560px;
          width: 100%;
        }
        .nf-tire-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 2rem;
        }
        .nf-tire {
          width: 140px;
          height: 140px;
          animation: nf-roll 4s linear infinite;
          filter: drop-shadow(0 0 24px rgba(1, 110, 185, 0.5));
        }
        @keyframes nf-roll {
          0%   { transform: rotate(0deg) translateX(0); }
          25%  { transform: rotate(90deg) translateX(6px); }
          50%  { transform: rotate(180deg) translateX(0); }
          75%  { transform: rotate(270deg) translateX(-6px); }
          100% { transform: rotate(360deg) translateX(0); }
        }
        .nf-tire-shadow {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 16px;
          background: radial-gradient(ellipse, rgba(1,110,185,0.35) 0%, transparent 70%);
          border-radius: 50%;
          animation: nf-shadow 4s ease-in-out infinite;
        }
        @keyframes nf-shadow {
          0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scaleX(0.8); opacity: 0.3; }
        }
        .nf-code {
          font-size: clamp(5rem, 16vw, 9rem);
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(135deg, #016EB9 0%, #1A8CE8 50%, #016EB9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -4px;
          margin-bottom: 0.75rem;
          animation: nf-shimmer 3s linear infinite;
          background-size: 200% auto;
        }
        @keyframes nf-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .nf-title {
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 1rem;
        }
        .nf-desc {
          font-size: 1rem;
          color: #9CA3AF;
          line-height: 1.7;
          margin-bottom: 2.5rem;
        }
        .nf-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.875rem;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .nf-btn {
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
        }
        .nf-btn--primary {
          background: linear-gradient(135deg, #016EB9, #1A8CE8);
          color: #fff;
          box-shadow: 0 4px 20px rgba(1, 110, 185, 0.4);
        }
        .nf-btn--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(1, 110, 185, 0.55);
        }
        .nf-btn--secondary {
          background: rgba(255, 255, 255, 0.06);
          color: #D1D5DB;
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
        }
        .nf-btn--secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          transform: translateY(-2px);
        }
        .nf-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }
        .nf-links-label { color: #6B7280; }
        .nf-links-sep { color: #374151; }
        .nf-link {
          color: #60A5FA;
          text-decoration: none;
          transition: color 0.15s;
        }
        .nf-link:hover { color: #93C5FD; text-decoration: underline; }
        @media (max-width: 480px) {
          .nf-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
