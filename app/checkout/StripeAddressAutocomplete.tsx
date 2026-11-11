"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, AddressElement, useElements } from "@stripe/react-stripe-js";

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

// Inner component that uses the useElements hook (must be inside <Elements>)
function AddressElementInner({
  value,
  onChange,
}: {
  value: AddressData;
  onChange: (address: AddressData) => void;
}) {
  const elements = useElements();

  // On mount, pre-fill the element if we already have a value
  useEffect(() => {
    if (!elements) return;
    const addressEl = elements.getElement("address");
    if (!addressEl) return;
    // setValue is available on the AddressElement instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (addressEl as any).setValue?.({
      address: {
        country: value.country === "Nederland" ? "NL"
          : value.country === "Frankrijk" ? "FR"
            : value.country === "Duitsland" ? "DE"
              : "BE",
        line1: value.street || "",
        postal_code: value.postalCode || "",
        city: value.city || "",
      },
    });
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  const handleChange = useCallback(
    (event: { complete: boolean; value: { address: { line1: string; line2?: string | null; postal_code: string; city: string; country: string } } }) => {
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
    },
    [onChange]
  );

  return (
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
            country: value.country === "Nederland" ? "NL"
              : value.country === "Frankrijk" ? "FR"
                : value.country === "Duitsland" ? "DE"
                  : "BE",
            line1: value.street || undefined,
            postal_code: value.postalCode || undefined,
            city: value.city || undefined,
          },
        },
      }}
      onChange={handleChange}
    />
  );
}

// Manual address input fallback
function ManualAddressForm({
  value,
  onChange,
  required,
}: {
  value: AddressData;
  onChange: (address: AddressData) => void;
  required?: boolean;
}) {
  return (
    <div>
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
  );
}

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

  // If publishable key is not found in env, fetch from /api/stripe/config
  useEffect(() => {
    if (!publishableKey) {
      fetch("/api/stripe/config")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.publishableKey) {
            setPublishableKey(data.publishableKey);
          } else {
            setStripeError("Stripe autocomplete niet beschikbaar.");
          }
        })
        .catch(() => setStripeError("Stripe autocomplete niet beschikbaar."));
    }
  }, [publishableKey]);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  // Elements must receive mode + amount + currency when no clientSecret is used.
  // This enables the AddressElement without requiring a PaymentIntent upfront.
  const elementsOptions = useMemo<StripeElementsOptions>(
    () => ({
      mode: "payment" as const,
      amount: 100, // 1 EUR placeholder — not used for address collection
      currency: "eur",
      appearance,
    }),
    []
  );

  const hasCompleteAddress = Boolean(
    value.street?.trim() && value.postalCode?.trim() && value.city?.trim()
  );

  const showStripe = stripePromise && !manualMode && !stripeError;

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
      {showStripe ? (
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
            {/* Elements MUST have mode + amount + currency when no clientSecret is provided */}
            <Elements stripe={stripePromise} options={elementsOptions}>
              <AddressElementInner value={value} onChange={onChange} />
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
          <ManualAddressForm value={value} onChange={onChange} required={required} />
        </div>
      )}
    </div>
  );
}
