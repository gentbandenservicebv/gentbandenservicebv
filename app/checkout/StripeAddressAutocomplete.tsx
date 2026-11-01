"use client";

import { useState, useMemo, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, AddressElement } from "@stripe/react-stripe-js";

export interface AddressData {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

interface StripeAddressAutocompleteProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  required?: boolean;
}

const appearance: StripeElementsOptions["appearance"] = {
  theme: "stripe",
  variables: {
    colorPrimary: "#016eb9",
    colorBackground: "#ffffff",
    colorText: "#0b192c",
    colorDanger: "#ef4444",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    spacingUnit: "4px",
    borderRadius: "10px",
  },
  rules: {
    ".Input": {
      border: "1.5px solid #cbd5e1",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      padding: "11px 14px",
      fontSize: "0.95rem",
    },
    ".Input:focus": {
      borderColor: "#016eb9",
      boxShadow: "0 0 0 3px rgba(1, 110, 185, 0.15)",
    },
    ".Label": {
      fontSize: "0.85rem",
      fontWeight: "700",
      color: "#0b192c",
      marginBottom: "6px",
    },
  },
};

export default function StripeAddressAutocomplete({
  value,
  onChange,
  required = false,
}: StripeAddressAutocompleteProps) {
  const [publishableKey, setPublishableKey] = useState<string>(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  );
  const [manualMode, setManualMode] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // If publishable key is not found in env, check /api/stripe/config
  useEffect(() => {
    if (!publishableKey) {
      fetch("/api/stripe/config")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.publishableKey) {
            setPublishableKey(data.publishableKey);
          }
        })
        .catch(() => {});
    }
  }, [publishableKey]);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  const hasCompleteAddress = Boolean(
    value.street?.trim() && value.postalCode?.trim() && value.city?.trim()
  );

  return (
    <div className="checkout-address-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div className="checkout-address-badge" style={{ margin: 0 }}>
          <span>📍</span> Bezorgadres &amp; Autocomplete
        </div>

        {stripePromise && (
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            style={{
              fontSize: "0.825rem",
              fontWeight: 600,
              color: "#016eb9",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "5px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {manualMode ? "⚡ Gebruik Stripe autocomplete" : "🖊️ Handmatig invoeren"}
          </button>
        )}
      </div>

      {/* Stripe Address Element Mode */}
      {stripePromise && !manualMode && !stripeError ? (
        <div>
          <p style={{ margin: "0 0 14px", fontSize: "0.875rem", color: "#64748b" }}>
            Begin met het typen van uw straatnaam of postcode. Stripe vult uw adres automatisch aan via officiële adresgegevens.
          </p>

          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 14,
              padding: "18px 20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <Elements
              stripe={stripePromise}
              options={{
                appearance,
              }}
            >
              <AddressElement
                options={{
                  mode: "shipping",
                  allowedCountries: ["BE", "NL", "FR", "DE"],
                  autocomplete: {
                    mode: "automatic",
                  },
                  fields: {
                    phone: "never",
                  },
                  defaultValues: {
                    address: {
                      country: value.country === "Nederland" ? "NL" : "BE",
                      line1: value.street || undefined,
                      postal_code: value.postalCode || undefined,
                      city: value.city || undefined,
                    },
                  },
                }}
                onChange={(event) => {
                  if (event.complete) {
                    const addr = event.value.address;
                    onChange({
                      street: [addr.line1, addr.line2].filter(Boolean).join(" "),
                      postalCode: addr.postal_code || "",
                      city: addr.city || "",
                      country:
                        addr.country === "BE"
                          ? "België"
                          : addr.country === "NL"
                          ? "Nederland"
                          : addr.country === "FR"
                          ? "Frankrijk"
                          : addr.country === "DE"
                          ? "Duitsland"
                          : addr.country || "België",
                    });
                  }
                }}
              />
            </Elements>
          </div>

          {/* Confirmed Address Summary Badge */}
          {hasCompleteAddress && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                fontSize: "0.875rem",
                color: "#166534",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>✓</span>
              <span>
                <strong>Geselecteerd adres:</strong> {value.street}, {value.postalCode} {value.city} ({value.country})
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Manual Input Fallback / Mode */
        <div>
          {!stripePromise && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: "0.825rem",
                color: "#64748b",
              }}
            >
              Vul hieronder uw bezorggegevens in voor levering aan huis:
            </div>
          )}

          <div className="checkout-field">
            <label className="checkout-label">Straat en huisnummer *</label>
            <input
              className="checkout-input"
              type="text"
              required={required}
              placeholder="bijv. Veldstraat 45 bus 2"
              value={value.street}
              onChange={(e) => onChange({ ...value, street: e.target.value })}
            />
          </div>

          <div className="checkout-form-row">
            <div className="checkout-field">
              <label className="checkout-label">Postcode *</label>
              <input
                className="checkout-input"
                type="text"
                required={required}
                placeholder="bijv. 9000"
                value={value.postalCode}
                onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
              />
            </div>
            <div className="checkout-field">
              <label className="checkout-label">Gemeente / Stad *</label>
              <input
                className="checkout-input"
                type="text"
                required={required}
                placeholder="bijv. Gent"
                value={value.city}
                onChange={(e) => onChange({ ...value, city: e.target.value })}
              />
            </div>
          </div>

          <div className="checkout-field">
            <label className="checkout-label">Land</label>
            <select
              className="checkout-select"
              value={value.country}
              onChange={(e) => onChange({ ...value, country: e.target.value })}
            >
              <option value="België">België</option>
              <option value="Nederland">Nederland</option>
              <option value="Frankrijk">Frankrijk</option>
              <option value="Duitsland">Duitsland</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
