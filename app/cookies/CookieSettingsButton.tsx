"use client";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("open-cookie-banner"));
        }
      }}
      className="btn btn-primary"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginTop: 12,
        padding: "10px 20px",
        borderRadius: 999,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      🍪 Cookie-instellingen aanpassen
    </button>
  );
}
