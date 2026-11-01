import "./TrustBar.css";

const stats = [
  { icon: <CalendarIcon />, value: "20+", label: "Jaar ervaring" },
  { icon: <StarIcon />,     value: "4.9★", label: "Google rating" },
  { icon: <UsersIcon />,    value: "5000+", label: "Tevreden klanten" },
  { icon: <SpeedIcon />,    value: "<1 uur", label: "Gemiddelde wachttijd" },
];

export default function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="container">
        <div className="trust-bar__grid">
          {stats.map((s, i) => (
            <div key={i} className="trust-bar__item">
              <span className="trust-bar__icon">{s.icon}</span>
              <div className="trust-bar__text">
                <span className="trust-bar__value">{s.value}</span>
                <span className="trust-bar__label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
function StarIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
}
function UsersIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function SpeedIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}
