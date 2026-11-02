"use client";
import React from "react";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "@/lib/auth-client";
import ManageAppointments from "@/app/components/appointments/ManageAppointments";
import "./account.css";

// ─── Types ────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  role: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  tyre: {
    id: string;
    brand: string;
    model: string;
    size: string;
    images: { url: string; isPrimary: boolean }[];
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  serviceType: string | null;
  deliveryStreet: string | null;
  deliveryCity: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  returnRequests?: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
    reason: string;
    createdAt: string;
  }[];
}

type Tab = "profile" | "appointments" | "orders" | "security";

// ─── Status helpers ────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  PENDING: "In afwachting",
  CONFIRMED: "Bevestigd",
  READY: "Klaar voor afhaling",
  COMPLETED: "Voltooid",
  CANCELLED: "Geannuleerd",
};

const STATUS_DOT: Record<string, string> = {
  PENDING: "⏳",
  CONFIRMED: "✅",
  READY: "📦",
  COMPLETED: "🎉",
  CANCELLED: "❌",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// ─── Icons ────────────────────────────────────────────────────────
function UserIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PackageIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function TyreIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function CalendarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────
function ProfileTab({ profile, onUpdate }: { profile: UserProfile; onUpdate: (p: UserProfile) => void }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    phone: profile.phone || "",
    street: profile.street || "",
    postalCode: profile.postalCode || "",
    city: profile.city || "",
    country: profile.country || "België",
  });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function handleChange(field: string, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
    setAlert(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Opslaan mislukt");
      }

      const updated: UserProfile = await res.json();
      onUpdate(updated);
      setAlert({ type: "success", msg: "✓ Profiel succesvol opgeslagen!" });
    } catch (err: unknown) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Er is een fout opgetreden" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="account-card">
      <div className="account-card__header">
        <div className="account-card__title">
          <UserIcon />
          Persoonlijke gegevens
        </div>
      </div>

      <div className="account-card__body">
        {alert && (
          <div className={`account-alert account-alert--${alert.type}`}>
            {alert.msg}
          </div>
        )}

        <form onSubmit={handleSave} className="profile-form">
          {/* Personal info */}
          <div className="profile-section-label">Persoonlijk</div>

          <div className="profile-row">
            <div className="profile-field">
              <label className="profile-label">Volledige naam *</label>
              <input
                className="profile-input"
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Voornaam Achternaam"
                required
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Telefoonnummer</label>
              <input
                className="profile-input"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+32 470 00 00 00"
              />
            </div>
          </div>

          <div className="profile-field">
            <label className="profile-label">E-mailadres</label>
            <input
              className="profile-input readonly"
              type="email"
              value={profile.email}
              readOnly
              tabIndex={-1}
            />
            <span className="profile-hint">E-mailadres kan niet worden gewijzigd.</span>
          </div>

          {/* Address */}
          <div className="profile-section-label" style={{ marginTop: 24 }}>Standaard bezorgadres</div>

          <div className="profile-field">
            <label className="profile-label">Straat en huisnummer</label>
            <input
              className="profile-input"
              type="text"
              value={form.street}
              onChange={(e) => handleChange("street", e.target.value)}
              placeholder="bijv. Veldstraat 45"
            />
          </div>

          <div className="profile-row">
            <div className="profile-field">
              <label className="profile-label">Postcode</label>
              <input
                className="profile-input"
                type="text"
                value={form.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                placeholder="bijv. 9000"
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Gemeente / Stad</label>
              <input
                className="profile-input"
                type="text"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="bijv. Gent"
              />
            </div>
          </div>

          <div className="profile-field">
            <label className="profile-label">Land</label>
            <select
              className="profile-select"
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
            >
              <option value="België">België</option>
              <option value="Nederland">Nederland</option>
              <option value="Frankrijk">Frankrijk</option>
              <option value="Duitsland">Duitsland</option>
            </select>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="btn-profile-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
                  Opslaan…
                </>
              ) : (
                <>
                  <SaveIcon />
                  Wijzigingen opslaan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Orders Tab ────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Bestellingen ophalen mislukt");
        return res.json();
      })
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="account-card">
        <div className="account-card__header">
          <div className="account-card__title">
            <PackageIcon />
            Mijn bestellingen
          </div>
        </div>
        <div className="account-card__body">
          {[1, 2, 3].map((i) => (
            <div key={i} className="order-card" style={{ marginBottom: 16 }}>
              <div className="order-card__head">
                <div className="skeleton" style={{ width: 120, height: 16 }} />
                <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 99 }} />
              </div>
              <div className="order-card__body">
                <div className="skeleton" style={{ height: 52, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-card">
        <div className="account-card__header">
          <div className="account-card__title"><PackageIcon />Mijn bestellingen</div>
        </div>
        <div className="account-card__body">
          <div className="account-alert account-alert--error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-card">
      <div className="account-card__header">
        <div className="account-card__title">
          <PackageIcon />
          Mijn bestellingen
        </div>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
          {orders.length} {orders.length === 1 ? "bestelling" : "bestellingen"}
        </span>
      </div>

      <div className="account-card__body">
        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty__icon">
              <PackageIcon size={32} />
            </div>
            <h3>Nog geen bestellingen</h3>
            <p>Uw bestelling geschiedenis verschijnt hier zodra u banden heeft besteld.</p>
            <Link href="/banden" className="btn-profile-save" style={{ display: "inline-flex", textDecoration: "none" }}>
              Banden bekijken
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const primaryImg = (item: OrderItem) =>
                item.tyre.images.find((im) => im.isPrimary)?.url ||
                item.tyre.images[0]?.url;

              return (
                <div key={order.id} className="order-card">
                  <div className="order-card__head">
                    <div>
                      <div className="order-card__id">#{order.id.slice(-8).toUpperCase()}</div>
                      <div className="order-card__date">{formatDate(order.createdAt)}</div>
                    </div>
                    <span className={`order-status-badge order-status-badge--${order.status}`}>
                      {STATUS_DOT[order.status] || "●"} {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  <div className="order-card__body">
                    <div className="order-items-list">
                      {order.items.map((item) => {
                        const imgUrl = primaryImg(item);
                        return (
                          <div key={item.id} className="order-item">
                            {imgUrl ? (
                              <Image
                                src={imgUrl}
                                alt={`${item.tyre.brand} ${item.tyre.model}`}
                                width={52}
                                height={52}
                                className="order-item__img"
                              />
                            ) : (
                              <div className="order-item__img-placeholder">
                                <TyreIcon />
                              </div>
                            )}
                            <div className="order-item__info">
                              <div className="order-item__name">{item.tyre.brand} {item.tyre.model}</div>
                              <div className="order-item__size">{item.tyre.size}</div>
                              <div className="order-item__qty">Aantal: {item.quantity}</div>
                            </div>
                            <div className="order-item__price">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="order-card__footer">
                    <div className="order-card__service">
                      {order.serviceType === "MONTAGE" ? "🔧 Montage inbegrepen" : "🏠 Thuislevering"}
                      {order.serviceType !== "MONTAGE" && order.deliveryCity && (
                        <span style={{ marginLeft: 4, color: "var(--text-subtle)" }}>
                          — {order.deliveryCity}
                        </span>
                      )}
                    </div>
                    <div className="order-card__total">
                      Totaal: <span>{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="order-card__actions">
                    <div className="order-card__actions-left">
                      <Link
                        href={`/bestelling/factuur/${order.id}`}
                        className="order-btn-link order-btn-link--invoice"
                      >
                        📄 Factuur
                      </Link>

                      {order.returnRequests && order.returnRequests.length > 0 ? (
                        (() => {
                          const latestReturn = order.returnRequests[0];
                          const returnLabelMap: Record<string, string> = {
                            PENDING: "⏳ Retouraanvraag in behandeling",
                            APPROVED: "✅ Retouraanvraag goedgekeurd",
                            REFUNDED: "💳 Terugbetaling voltooid",
                            REJECTED: "❌ Retouraanvraag afgewezen",
                          };
                          return (
                            <span className={`order-return-status order-return-status--${latestReturn.status}`}>
                              {returnLabelMap[latestReturn.status] || latestReturn.status}
                            </span>
                          );
                        })()
                      ) : order.status !== "CANCELLED" ? (
                        <Link
                          href={`/retourbeleid?orderId=${order.id}`}
                          className="order-btn-link order-btn-link--return"
                        >
                          ↩ Retour aanvragen
                        </Link>
                      ) : null}
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                      14d bedenktijd conform WER
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────
function SecurityTab({ profile }: { profile: UserProfile }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setAlert({ type: "error", msg: "Nieuwe wachtwoorden komen niet overeen." });
      return;
    }
    if (newPw.length < 8) {
      setAlert({ type: "error", msg: "Nieuw wachtwoord moet minstens 8 tekens lang zijn." });
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Wachtwoord wijzigen mislukt");
      }

      setAlert({ type: "success", msg: "✓ Wachtwoord succesvol gewijzigd!" });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Er is een fout opgetreden" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="account-card">
      <div className="account-card__header">
        <div className="account-card__title">
          <ShieldIcon />
          Beveiliging
        </div>
      </div>

      <div className="account-card__body">
        {/* Account info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 18px",
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            marginBottom: 28,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--primary-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{profile.email}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Lid sinds {formatDate(profile.createdAt)}
            </div>
          </div>
        </div>

        {alert && (
          <div className={`account-alert account-alert--${alert.type}`}>
            {alert.msg}
          </div>
        )}

        <div className="profile-section-label">Wachtwoord wijzigen</div>

        <form onSubmit={handlePasswordChange} className="password-fields">
          <div className="profile-field">
            <label className="profile-label">Huidig wachtwoord</label>
            <input
              className="profile-input"
              type="password"
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setAlert(null); }}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="profile-row">
            <div className="profile-field">
              <label className="profile-label">Nieuw wachtwoord</label>
              <input
                className="profile-input"
                type="password"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setAlert(null); }}
                placeholder="Min. 8 tekens"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Herhaal nieuw wachtwoord</label>
              <input
                className="profile-input"
                type="password"
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setAlert(null); }}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="btn-profile-save"
              disabled={saving}
            >
              {saving ? "Opslaan…" : "Wachtwoord wijzigen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page Content ────────────────────────────────────────────
function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { data: session, isPending } = useSession();

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (tabParam && ["profile", "appointments", "orders", "security"].includes(tabParam)) {
      return tabParam as Tab;
    }
    return "profile";
  });

  useEffect(() => {
    if (tabParam && ["profile", "appointments", "orders", "security"].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, [tabParam]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/auth/signin?redirect=/account");
    }
  }, [isPending, session, router]);

  // Fetch profile on mount
  const fetchProfile = useCallback(async () => {
    if (!session?.user) return;
    setProfileLoading(true);
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // ignore
    } finally {
      setProfileLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  }

  // While loading auth
  if (isPending || !session?.user) {
    return (
      <div className="account-page">
        <div className="container">
          <div className="skeleton" style={{ height: 160, borderRadius: 24, marginBottom: 32 }} />
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
            <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    );
  }

  const user = session!.user;
  const initials = user.name
    ? user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const tabs: { id: Tab; label: string; icon: React.ReactElement }[] = [
    { id: "profile", label: "Mijn profiel", icon: <UserIcon /> },
    { id: "appointments", label: "Afspraken", icon: <CalendarIcon /> },
    { id: "orders", label: "Bestellingen", icon: <PackageIcon /> },
    { id: "security", label: "Beveiliging", icon: <ShieldIcon /> },
  ];

  return (
    <main className="account-page">
      <div className="container">
        {/* Hero */}
        <div className="account-hero">
          <div className="account-hero__avatar">{initials}</div>
          <div className="account-hero__info">
            <div className="account-hero__greeting">Welkom terug</div>
            <div className="account-hero__name">{user.name || "Klant"}</div>
            <div className="account-hero__email">
              {user.email}
              <span className="account-hero__badge">
                {(user as { role?: string }).role === "ADMIN" ? "🛡️ Beheerder" : "👤 Klant"}
              </span>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="account-layout">
          {/* Sidebar */}
          <nav className="account-sidebar" aria-label="Account navigatie">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`account-nav__item${activeTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            <div className="account-nav__divider" />

            {(user as { role?: string }).role === "ADMIN" && (
              <>
                <Link href="/admin" className="account-nav__item">
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                  Admin dashboard
                </Link>
                <div className="account-nav__divider" />
              </>
            )}

            <button
              type="button"
              className="account-nav__item account-nav__signout"
              onClick={handleSignOut}
            >
              <LogOutIcon />
              Uitloggen
            </button>
          </nav>

          {/* Content */}
          <div>
            {activeTab === "profile" && (
              profileLoading || !profile ? (
                <div className="account-card">
                  <div className="account-card__header">
                    <div className="account-card__title"><UserIcon />Persoonlijke gegevens</div>
                  </div>
                  <div className="account-card__body">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="skeleton" style={{ height: 40, marginBottom: 12, borderRadius: 8 }} />
                    ))}
                  </div>
                </div>
              ) : (
                <ProfileTab profile={profile} onUpdate={setProfile} />
              )
            )}

            {activeTab === "appointments" && (
              <div className="account-card" style={{ padding: 28 }}>
                <ManageAppointments />
              </div>
            )}

            {activeTab === "orders" && <OrdersTab />}

            {activeTab === "security" && profile && (
              <SecurityTab profile={profile} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="account-page">
          <div className="container">
            <div className="skeleton" style={{ height: 160, borderRadius: 24, marginBottom: 32 }} />
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
              <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
              <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
            </div>
          </div>
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
