"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { formatUserNotes } from "@/lib/sanitize-notes";
import {
  TyreIcon,
  WrenchIcon,
  SearchIcon,
  MessageSquareIcon,
  ClockIcon,
  CheckIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  XCircleIcon,
  XIcon,
  CalendarIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  CarIcon,
  MapPinIcon,
  CompassIcon,
  CopyIcon,
  AlertTriangleIcon,
  FolderEmptyIcon,
} from "./AppointmentIcons";
import "./ManageAppointments.css";

export interface ManagedAppointment {
  id: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  type: "FITTING" | "REPAIR" | "INSPECTION" | "OTHER" | string;
  dateTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | string;
  notes?: string | null;
  vehicleInfo?: string | null;
  createdAt?: string;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface SlotInfo {
  time: string;
  period: "morning" | "afternoon";
  available: boolean;
  booked: boolean;
  isPast: boolean;
  reason: string;
  remaining: number;
}

const SERVICE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  FITTING: { icon: <TyreIcon size={18} />, label: "Banden monteren & balanceren" },
  REPAIR: { icon: <WrenchIcon size={18} />, label: "Bandenreparatie" },
  INSPECTION: { icon: <SearchIcon size={18} />, label: "Inspectie & Seizoenswissel" },
  OTHER: { icon: <MessageSquareIcon size={18} />, label: "Andere service / Advies" },
};

const STATUS_META: Record<string, { label: string; icon: React.ReactNode }> = {
  PENDING: { label: "In afwachting", icon: <ClockIcon size={13} /> },
  CONFIRMED: { label: "Bevestigd", icon: <CheckCircleIcon size={13} /> },
  COMPLETED: { label: "Voltooid", icon: <CheckBadgeIcon size={13} /> },
  CANCELLED: { label: "Geannuleerd", icon: <XCircleIcon size={13} /> },
};

interface ManageAppointmentsProps {
  onBookNew?: () => void;
  initialEmail?: string;
}

export default function ManageAppointments({ onBookNew, initialEmail }: ManageAppointmentsProps) {
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const user = sessionData?.user;

  // Active view tab: "upcoming" or "history"
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");

  // Appointments data
  const [appointments, setAppointments] = useState<ManagedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Guest lookup state
  const [lookupEmail, setLookupEmail] = useState(initialEmail || "");
  const [lookupRef, setLookupRef] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [hasSearchedGuest, setHasSearchedGuest] = useState(false);

  // Reschedule modal state
  const [reschedulingAppt, setReschedulingAppt] = useState<ManagedAppointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [morningSlots, setMorningSlots] = useState<SlotInfo[]>([]);
  const [afternoonSlots, setAfternoonSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isClosedDay, setIsClosedDay] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  // Cancel modal state
  const [cancellingAppt, setCancellingAppt] = useState<ManagedAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Clipboard copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper: show toast message
  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Fetch appointments for authenticated user
  const fetchUserAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments");
      if (!res.ok) {
        throw new Error("Kon afspraken niet laden");
      }
      const data: ManagedAppointment[] = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!sessionLoading) {
      if (user) {
        fetchUserAppointments();
      } else {
        setLoading(false);
      }
    }
  }, [user, sessionLoading, fetchUserAppointments]);

  // Guest lookup handler
  async function handleGuestLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!lookupEmail.trim()) {
      showToast("error", "Vul uw e-mailadres in");
      return;
    }
    setLookupLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: lookupEmail.trim(),
          referenceId: lookupRef.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Geen afspraken gevonden");
      }
      setAppointments(data.appointments || []);
      setHasSearchedGuest(true);
      showToast("success", `${data.appointments.length} afspraak/afspraken gevonden!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fout bij opzoeken");
      setAppointments([]);
    } finally {
      setLookupLoading(false);
    }
  }

  // Live slot fetching when rescheduling date changes
  useEffect(() => {
    if (!reschedulingAppt || !newDate) return;

    let active = true;
    setSlotsLoading(true);
    setRescheduleError("");
    setNewTime("");

    fetch(`/api/appointments/availability?date=${newDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.closed) {
          setIsClosedDay(true);
          setMorningSlots([]);
          setAfternoonSlots([]);
        } else {
          setIsClosedDay(false);
          setMorningSlots(data.morningSlots || []);
          setAfternoonSlots(data.afternoonSlots || []);
        }
      })
      .catch(() => {
        if (active) setRescheduleError("Kon beschikbare tijdsloten niet laden.");
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reschedulingAppt, newDate]);

  // Open reschedule modal
  function openReschedule(appt: ManagedAppointment) {
    if (new Date(appt.dateTime).getTime() <= Date.now()) {
      showToast("error", "Deze afspraak is verlopen en kan niet meer worden gewijzigd.");
      return;
    }
    setReschedulingAppt(appt);
    setRescheduleError("");
    setNewTime("");

    // Set tomorrow as default or existing date
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // skip Sunday
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setNewDate(`${yyyy}-${mm}-${dd}`);
  }

  // Quick date helper
  function setQuickRescheduleDate(daysAhead: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setNewDate(`${yyyy}-${mm}-${dd}`);
  }

  // Submit reschedule with thorough appointment time validation
  async function submitReschedule() {
    if (!reschedulingAppt) return;

    if (new Date(reschedulingAppt.dateTime).getTime() <= Date.now()) {
      setRescheduleError("Deze afspraak is al verlopen en kan niet meer worden gewijzigd.");
      return;
    }

    if (!newDate || !newTime) {
      setRescheduleError("Kies zowel een datum als een tijdstip.");
      return;
    }

    const combinedDate = new Date(`${newDate}T${newTime}:00`);
    if (isNaN(combinedDate.getTime())) {
      setRescheduleError("Ongeldige datum of tijdstip geselecteerd.");
      return;
    }

    const currentNow = Date.now();
    // 1. Must be strictly in the future
    if (combinedDate.getTime() <= currentNow) {
      setRescheduleError("Het gekozen tijdstip ligt in het verleden. Kies een toekomstig tijdstip.");
      return;
    }

    // 2. Must be at least 1 hour in advance
    if (combinedDate.getTime() < currentNow + 60 * 60 * 1000) {
      setRescheduleError("Kies een tijdstip minstens 1 uur vooruit zodat onze monteurs uw komst kunnen inplannen.");
      return;
    }

    // 3. Must not be Sunday
    if (combinedDate.getDay() === 0) {
      setRescheduleError("Wij zijn op zondag gesloten. Kies een afspraak tussen maandag en zaterdag.");
      return;
    }

    // 4. Must be within garage opening hours (09:00 - 18:00)
    const hour = combinedDate.getHours();
    const minutes = combinedDate.getMinutes();
    if (hour < 9 || (hour >= 18 && minutes > 0)) {
      setRescheduleError("Onze openingstijden zijn maandag t/m zaterdag van 09:00 tot 18:00.");
      return;
    }

    // 5. Must not be identical to current appointment time
    if (new Date(reschedulingAppt.dateTime).getTime() === combinedDate.getTime()) {
      setRescheduleError("U heeft hetzelfde tijdstip gekozen als uw huidige afspraak. Kies een ander tijdslot.");
      return;
    }

    // 6. Check slot availability
    const allSlots = [...morningSlots, ...afternoonSlots];
    const chosenSlot = allSlots.find((s) => s.time === newTime);
    if (chosenSlot && !chosenSlot.available) {
      setRescheduleError("Dit tijdslot is helaas al bezet of niet meer beschikbaar. Kies een ander vrij tijdslot.");
      return;
    }

    setRescheduleSubmitting(true);
    setRescheduleError("");

    const newCombinedDateTime = `${newDate}T${newTime}:00`;

    try {
      const res = await fetch(`/api/appointments/${reschedulingAppt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          dateTime: newCombinedDateTime,
          guestEmail: reschedulingAppt.guestEmail || lookupEmail || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kon afspraak niet verzetten.");
      }

      // Optimistic update
      setAppointments((prev) =>
        prev.map((a) => (a.id === reschedulingAppt.id ? { ...a, ...data } : a))
      );

      setReschedulingAppt(null);
      showToast("success", "Uw afspraak is succesvol verzet naar het nieuwe tijdstip!");
    } catch (err: unknown) {
      setRescheduleError(err instanceof Error ? err.message : "Fout bij verzetten.");
    } finally {
      setRescheduleSubmitting(false);
    }
  }

  // Submit cancellation
  async function submitCancellation() {
    if (!cancellingAppt) return;

    if (new Date(cancellingAppt.dateTime).getTime() <= Date.now()) {
      showToast("error", "Een verlopen afspraak kan niet meer worden geannuleerd.");
      setCancellingAppt(null);
      return;
    }

    setCancelSubmitting(true);

    try {
      const res = await fetch(`/api/appointments/${cancellingAppt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: cancelReason.trim() || undefined,
          guestEmail: cancellingAppt.guestEmail || lookupEmail || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kon afspraak niet annuleren.");
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === cancellingAppt.id ? { ...a, status: "CANCELLED" } : a))
      );

      setCancellingAppt(null);
      setCancelReason("");
      showToast("success", "Uw afspraak is geannuleerd. We hebben u een bevestigingsmail gestuurd.");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Fout bij annuleren.");
    } finally {
      setCancelSubmitting(false);
    }
  }

  // Copy reference ID
  function copyRef(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Separate upcoming vs history (expired appointments immediately move to history)
  const now = new Date();
  const nowTime = now.getTime();

  const upcomingAppointments = appointments.filter((a) => {
    const isPast = new Date(a.dateTime).getTime() <= nowTime;
    return !isPast && a.status !== "CANCELLED" && a.status !== "COMPLETED";
  });

  const historyAppointments = appointments.filter((a) => {
    const isPast = new Date(a.dateTime).getTime() <= nowTime;
    return isPast || a.status === "CANCELLED" || a.status === "COMPLETED";
  });

  const displayedAppointments = activeTab === "upcoming" ? upcomingAppointments : historyAppointments;

  // Render relative badge text (e.g. "Vandaag", "Morgen", "Over 3 dagen", "Verlopen")
  function getRelativeBadge(dateTimeStr: string) {
    const target = new Date(dateTimeStr);
    const diffMs = target.getTime() - nowTime;

    if (diffMs <= 0) return { text: "Verlopen", soon: false };

    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: "Vandaag!", soon: true };
    if (diffDays === 1) return { text: "Morgen", soon: true };
    if (diffDays === 2) return { text: "Over 2 dagen", soon: false };
    if (diffDays > 2 && diffDays <= 7) return { text: `Over ${diffDays} dagen`, soon: false };
    if (diffDays > 7) return { text: `Over ${Math.round(diffDays / 7)} weken`, soon: false };
    return { text: "Binnenkort", soon: false };
  }

  // Google Calendar URL generator
  function getGoogleCalUrl(appt: ManagedAppointment) {
    const serviceLabel = SERVICE_META[appt.type]?.label || "Banden service";
    const startIso = new Date(appt.dateTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = new Date(new Date(appt.dateTime).getTime() + 45 * 60000)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Afspraak Gent Bandenservice (${serviceLabel})`
    )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(
      `Afspraak bij Gent Bandenservice BV\nDienst: ${serviceLabel}\nVoertuig: ${appt.vehicleInfo || "-"}\nReferentie: ${appt.id}`
    )}&location=${encodeURIComponent("Gent Bandenservice BV, Dendermondsesteenweg 428, 9040 Gent")}`;
  }

  return (
    <div className="appt-manage">
      {/* Toast alert */}
      {toast && (
        <div className={`appt-toast appt-toast--${toast.type}`} role="alert">
          <span>{toast.type === "success" ? <CheckCircleIcon size={18} /> : <AlertTriangleIcon size={18} />}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header bar with Tab switcher */}
      <div className="appt-manage-header">
        <div className="appt-manage-title-box">
          <div className="appt-manage-title-icon">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 className="appt-manage-title">Mijn Afspraken</h2>
            <p className="appt-manage-sub">
              {user
                ? `Beheer uw geplande werkplaatsbezoeken voor ${user.name || user.email}`
                : "Bekijk en beheer uw geplande montage of reparatie"}
            </p>
          </div>
        </div>

        <div className="appt-manage-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upcoming"}
            className={`appt-manage-tab ${activeTab === "upcoming" ? "appt-manage-tab--active" : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            <span>Aankomend</span>
            <span className="appt-manage-tab-badge">{upcomingAppointments.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            className={`appt-manage-tab ${activeTab === "history" ? "appt-manage-tab--active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span>Geschiedenis</span>
            <span className="appt-manage-tab-badge">{historyAppointments.length}</span>
          </button>
        </div>
      </div>

      {/* Non-authenticated user: Guest Lookup Card */}
      {!user && !hasSearchedGuest && appointments.length === 0 && (
        <div className="appt-lookup-card">
          <div className="appt-lookup-header">
            <div className="appt-lookup-icon">
              <SearchIcon size={20} />
            </div>
            <h3 className="appt-lookup-title">Afspraak opzoeken als gast</h3>
            <p className="appt-lookup-desc">
              Heeft u zonder account een afspraak geboekt? Vul hieronder uw e-mailadres in om uw afspraak direct te bekijken, te verzetten of te annuleren.
            </p>
          </div>

          <form onSubmit={handleGuestLookup} className="appt-lookup-form">
            <div className="appt-lookup-field">
              <label className="appt-lookup-label">E-mailadres waarmee u heeft geboekt *</label>
              <input
                type="email"
                required
                className="appt-lookup-input"
                placeholder="naam@voorbeeld.be"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
              />
            </div>

            <div className="appt-lookup-field">
              <label className="appt-lookup-label">Referentienummer (optioneel)</label>
              <input
                type="text"
                className="appt-lookup-input"
                placeholder="Bijv. clu8... of laat leeg voor al uw afspraken"
                value={lookupRef}
                onChange={(e) => setLookupRef(e.target.value)}
              />
            </div>

            {error && <div className="appt-toast appt-toast--error">{error}</div>}

            <button type="submit" className="appt-lookup-btn" disabled={lookupLoading}>
              {lookupLoading ? (
                "Bezig met zoeken..."
              ) : (
                <>
                  <SearchIcon size={16} />
                  <span>Afspraak Opzoeken</span>
                </>
              )}
            </button>

            <div className="appt-lookup-login-callout">
              <span>Heeft u al een geregistreerd account?</span>
              <Link href="/auth/signin?callbackUrl=/afspraak?view=manage" className="appt-lookup-login-link">
                Inloggen →
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(1, 110, 185, 0.1)",
              color: "var(--primary)",
              marginBottom: 10,
            }}
          >
            <ClockIcon size={24} />
          </div>
          <p>Afspraken ophalen...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="appt-toast appt-toast--error" style={{ marginBottom: 20 }}>
          <span>
            <AlertTriangleIcon size={18} />
          </span>
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchUserAppointments}
            style={{ marginLeft: "auto", background: "none", border: "underline", color: "inherit", cursor: "pointer" }}
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Appointments List */}
      {!loading && (
        <div className="appt-list">
          {displayedAppointments.length === 0 ? (
            <div className="appt-empty-state">
              <div className="appt-empty-icon">
                {activeTab === "upcoming" ? <CalendarIcon size={40} /> : <FolderEmptyIcon size={40} />}
              </div>
              <h3 className="appt-empty-title">
                {activeTab === "upcoming" ? "Geen aankomende afspraken" : "Geen eerdere afspraken gevonden"}
              </h3>
              <p className="appt-empty-desc">
                {activeTab === "upcoming"
                  ? "U heeft momenteel geen geplande afspraken in onze werkplaats. Wilt u een bandenwissel, montage of reparatie inplannen?"
                  : "U heeft nog geen voltooide of geannuleerde afspraken in uw overzicht staan."}
              </p>

              {activeTab === "upcoming" && (
                <div>
                  {onBookNew ? (
                    <button type="button" onClick={onBookNew} className="appt-empty-btn">
                      <CalendarPlusIcon size={16} />
                      <span>Direct online afspraak inplannen</span>
                    </button>
                  ) : (
                    <Link href="/afspraak" className="appt-empty-btn">
                      <CalendarPlusIcon size={16} />
                      <span>Direct online afspraak inplannen</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            displayedAppointments.map((appt) => {
              const dt = new Date(appt.dateTime);
              const weekday = dt.toLocaleDateString("nl-BE", { weekday: "short" });
              const day = dt.getDate();
              const month = dt.toLocaleDateString("nl-BE", { month: "short" });
              const time = dt.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
              const relative = getRelativeBadge(appt.dateTime);
              const service = SERVICE_META[appt.type] || { icon: <WrenchIcon size={18} />, label: appt.type };
              const status = STATUS_META[appt.status] || { icon: <ClockIcon size={13} />, label: appt.status };
              const isCancelled = appt.status === "CANCELLED";
              const isCompleted = appt.status === "COMPLETED";
              const isExpired = new Date(appt.dateTime).getTime() <= nowTime;
              const canModify = !isCancelled && !isCompleted && !isExpired;
              const cleanNotes = formatUserNotes(appt.notes);

              return (
                <article
                  key={appt.id}
                  className={`appt-card ${isCancelled ? "appt-card--cancelled" : ""} ${isExpired && !isCancelled && !isCompleted ? "appt-card--expired" : ""}`}
                >
                  {/* Top Bar: Service title & Status */}
                  <div className="appt-card__top">
                    <div className="appt-card__service-badge">
                      <span className="appt-card__service-icon">{service.icon}</span>
                      <span>{service.label}</span>
                    </div>

                    <div className="appt-card__status-wrap">
                      {isExpired && !isCancelled && !isCompleted ? (
                        <span className="appt-status-badge appt-status-badge--EXPIRED">
                          <ClockIcon size={13} />
                          <span>Verlopen</span>
                        </span>
                      ) : (
                        <span className={`appt-status-badge appt-status-badge--${appt.status}`}>
                          <span>{status.icon}</span>
                          <span>{status.label}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Layout: Date Block + Info details */}
                  <div className="appt-card__body">
                    {/* Left: Date Display */}
                    <div className="appt-date-block">
                      <span className="appt-date-block__weekday">{weekday}</span>
                      <span className="appt-date-block__day">{day}</span>
                      <span className="appt-date-block__month">{month}</span>
                      <span className="appt-date-block__time">
                        <ClockIcon size={13} />
                        <span>{time}</span>
                      </span>
                      {canModify && (
                        <span className={`appt-relative-badge ${relative.soon ? "appt-relative-badge--soon" : ""}`}>
                          {relative.text}
                        </span>
                      )}
                      {isExpired && !isCancelled && !isCompleted && (
                        <span className="appt-relative-badge" style={{ background: "#64748b" }}>
                          Verlopen
                        </span>
                      )}
                    </div>

                    {/* Right: Details */}
                    <div className="appt-details-block">
                      {/* Vehicle info */}
                      {appt.vehicleInfo && (
                        <div className="appt-detail-row">
                          <span className="appt-detail-icon">
                            <CarIcon size={16} />
                          </span>
                          <div className="appt-detail-content">
                            <div className="appt-detail-label">Voertuig & Specificaties</div>
                            <div className="appt-detail-val">{appt.vehicleInfo}</div>
                          </div>
                        </div>
                      )}

                      {/* Workshop Location */}
                      <div className="appt-detail-row">
                        <span className="appt-detail-icon">
                          <MapPinIcon size={16} />
                        </span>
                        <div className="appt-detail-content">
                          <div className="appt-detail-label">Locatie</div>
                          <div className="appt-detail-val">
                            Gent Bandenservice BV · Dendermondsesteenweg 428, 9040 Gent
                          </div>
                        </div>
                      </div>

                      {/* Notes / Tyres - Sanitized so internal Stripe IDs never leak */}
                      {cleanNotes && (
                        <div className="appt-detail-notes">
                          <strong>Notities:</strong> {cleanNotes}
                        </div>
                      )}

                      {/* Reference ID */}
                      <div className="appt-ref-row">
                        <span>Referentie:</span>
                        <code className="appt-ref-badge">{appt.id}</code>
                        <button
                          type="button"
                          className="appt-copy-btn"
                          onClick={() => copyRef(appt.id)}
                          title="Kopieer referentienummer"
                        >
                          {copiedId === appt.id ? (
                            <>
                              <CheckIcon size={13} />
                              <span>Gekopieerd</span>
                            </>
                          ) : (
                            <>
                              <CopyIcon size={13} />
                              <span>Kopieer</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expired banner */}
                      {isExpired && !isCancelled && !isCompleted && (
                        <div className="appt-expired-banner">
                          <AlertTriangleIcon size={16} />
                          <span>
                            Deze afspraak is verlopen (datum verstreken). Alle actieknoppen zijn gedeactiveerd. Neem contact op met de garage indien u een nieuwe afspraak wenst.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="appt-card__actions">
                    {isExpired ? (
                      <>
                        <button
                          type="button"
                          className="appt-action-btn appt-action-btn--primary appt-action-btn--disabled"
                          disabled
                          title="Afspraak is verlopen. U kunt deze afspraak niet meer verzetten."
                        >
                          <CalendarClockIcon size={15} />
                          <span>Afspraak verzetten</span>
                        </button>

                        <button
                          type="button"
                          className="appt-action-btn appt-action-btn--danger appt-action-btn--disabled"
                          disabled
                          title="Afspraak is verlopen. U kunt deze afspraak niet meer annuleren."
                        >
                          <XCircleIcon size={15} />
                          <span>Annuleren</span>
                        </button>

                        <button
                          type="button"
                          className="appt-action-btn appt-action-btn--disabled"
                          disabled
                          title="Afspraak is verlopen."
                        >
                          <CalendarPlusIcon size={15} />
                          <span>Google Agenda</span>
                        </button>

                        <button
                          type="button"
                          className="appt-action-btn appt-action-btn--directions appt-action-btn--disabled"
                          disabled
                          title="Afspraak is verlopen."
                        >
                          <CompassIcon size={15} />
                          <span>Routebeschrijving</span>
                        </button>
                      </>
                    ) : canModify ? (
                      <>
                        <button
                          type="button"
                          className="appt-action-btn appt-action-btn--primary"
                          onClick={() => openReschedule(appt)}
                        >
                          <CalendarClockIcon size={15} />
                          <span>Afspraak verzetten</span>
                        </button>

                        <button
                          type="button"
                          className="appt-action-btn appt-action-btn--danger"
                          onClick={() => setCancellingAppt(appt)}
                        >
                          <XCircleIcon size={15} />
                          <span>Annuleren</span>
                        </button>

                        <a
                          href={getGoogleCalUrl(appt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="appt-action-btn"
                        >
                          <CalendarPlusIcon size={15} />
                          <span>Google Agenda</span>
                        </a>

                        <a
                          href="https://maps.google.com/?q=Gent+Bandenservice+Dendermondsesteenweg+428+9040+Gent"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="appt-action-btn appt-action-btn--directions"
                        >
                          <CompassIcon size={15} />
                          <span>Routebeschrijving</span>
                        </a>
                      </>
                    ) : (
                      <a
                        href="https://maps.google.com/?q=Gent+Bandenservice+Dendermondsesteenweg+428+9040+Gent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="appt-action-btn appt-action-btn--directions"
                      >
                        <CompassIcon size={15} />
                        <span>Routebeschrijving</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* ─── RESCHEDULE MODAL ──────────────────────────────────────────────── */}
      {reschedulingAppt && (
        <div className="appt-modal-overlay" onClick={() => setReschedulingAppt(null)}>
          <div className="appt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="appt-modal__header">
              <h3 className="appt-modal__title">
                <CalendarClockIcon size={20} />
                <span>Afspraak Verzetten</span>
              </h3>
              <button
                type="button"
                className="appt-modal__close"
                onClick={() => setReschedulingAppt(null)}
                aria-label="Sluiten"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="appt-modal__body">
              <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", marginTop: 0 }}>
                Huidige afspraak: <strong>{new Date(reschedulingAppt.dateTime).toLocaleString("nl-BE")}</strong> (
                {SERVICE_META[reschedulingAppt.type]?.label || reschedulingAppt.type})
              </p>

              <label className="appt-lookup-label" style={{ display: "block", marginBottom: 6 }}>
                Kies een nieuwe datum *
              </label>

              {/* Quick selectors */}
              <div className="appt-reschedule-quick-dates">
                <button
                  type="button"
                  className="appt-reschedule-quick-btn"
                  onClick={() => setQuickRescheduleDate(1)}
                >
                  Morgen
                </button>
                <button
                  type="button"
                  className="appt-reschedule-quick-btn"
                  onClick={() => setQuickRescheduleDate(2)}
                >
                  +2 dagen
                </button>
                <button
                  type="button"
                  className="appt-reschedule-quick-btn"
                  onClick={() => setQuickRescheduleDate(3)}
                >
                  +3 dagen
                </button>
                <button
                  type="button"
                  className="appt-reschedule-quick-btn"
                  onClick={() => setQuickRescheduleDate(7)}
                >
                  Volgende week
                </button>
              </div>

              <input
                type="date"
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                value={newDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewDate(val);
                  setNewTime("");
                  if (val) {
                    const chosen = new Date(val + "T00:00:00");
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (chosen < today) {
                      setRescheduleError("Datum kan niet in het verleden liggen. Kies een datum vanaf morgen.");
                    } else if (chosen.getDay() === 0) {
                      setRescheduleError("Wij zijn op zondag gesloten. Kies een andere dag (maandag t/m zaterdag).");
                    } else {
                      setRescheduleError("");
                    }
                  }
                }}
                className="appt-lookup-input"
                style={{ marginBottom: 16 }}
              />

              {/* Slots display */}
              <label className="appt-lookup-label" style={{ display: "block", marginBottom: 6 }}>
                Beschikbare tijdsloten voor {newDate || "deze datum"}:
              </label>

              {slotsLoading ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  Beschikbaarheid controleren...
                </div>
              ) : isClosedDay ? (
                <div className="appt-toast appt-toast--error">
                  Op deze dag zijn wij gesloten (zondag). Kies een weekdag of zaterdag.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", margin: "10px 0 4px" }}>
                    VOORMIDDAG
                  </div>
                  <div className="appt-reschedule-slots">
                    {morningSlots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => {
                          setNewTime(s.time);
                          if (newDate && s.time) {
                            const combined = new Date(`${newDate}T${s.time}:00`);
                            const currentNow = Date.now();
                            if (combined.getTime() <= currentNow) {
                              setRescheduleError("Het gekozen tijdstip ligt in het verleden. Kies een toekomstig tijdstip.");
                            } else if (combined.getTime() < currentNow + 60 * 60 * 1000) {
                              setRescheduleError("Kies een tijdstip minstens 1 uur vooruit.");
                            } else if (reschedulingAppt && new Date(reschedulingAppt.dateTime).getTime() === combined.getTime()) {
                              setRescheduleError("U heeft hetzelfde tijdstip gekozen als uw huidige afspraak. Kies een ander tijdslot.");
                            } else {
                              setRescheduleError("");
                            }
                          }
                        }}
                        className={`appt-reschedule-slot-btn ${newTime === s.time ? "appt-reschedule-slot-btn--selected" : ""}`}
                        title={s.available ? "Beschikbaar" : "Bezet"}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", margin: "14px 0 4px" }}>
                    NAMIDDAG
                  </div>
                  <div className="appt-reschedule-slots">
                    {afternoonSlots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => {
                          setNewTime(s.time);
                          if (newDate && s.time) {
                            const combined = new Date(`${newDate}T${s.time}:00`);
                            const currentNow = Date.now();
                            if (combined.getTime() <= currentNow) {
                              setRescheduleError("Het gekozen tijdstip ligt in het verleden. Kies een toekomstig tijdstip.");
                            } else if (combined.getTime() < currentNow + 60 * 60 * 1000) {
                              setRescheduleError("Kies een tijdstip minstens 1 uur vooruit.");
                            } else if (reschedulingAppt && new Date(reschedulingAppt.dateTime).getTime() === combined.getTime()) {
                              setRescheduleError("U heeft hetzelfde tijdstip gekozen als uw huidige afspraak. Kies een ander tijdslot.");
                            } else {
                              setRescheduleError("");
                            }
                          }
                        }}
                        className={`appt-reschedule-slot-btn ${newTime === s.time ? "appt-reschedule-slot-btn--selected" : ""}`}
                        title={s.available ? "Beschikbaar" : "Bezet"}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {rescheduleError && (
                <div className="appt-toast appt-toast--error" style={{ marginTop: 16 }}>
                  {rescheduleError}
                </div>
              )}
            </div>

            <div className="appt-modal__footer">
              <button
                type="button"
                className="appt-action-btn"
                onClick={() => setReschedulingAppt(null)}
                disabled={rescheduleSubmitting}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="appt-action-btn appt-action-btn--primary"
                onClick={submitReschedule}
                disabled={!newDate || !newTime || rescheduleSubmitting}
              >
                {rescheduleSubmitting ? (
                  "Opslaan..."
                ) : (
                  <>
                    <CheckIcon size={15} />
                    <span>Nieuwe datum bevestigen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL CONFIRMATION MODAL ─────────────────────────────────────── */}
      {cancellingAppt && (
        <div className="appt-modal-overlay" onClick={() => setCancellingAppt(null)}>
          <div className="appt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="appt-modal__header">
              <h3 className="appt-modal__title appt-modal__title--danger">
                <AlertTriangleIcon size={20} />
                <span>Afspraak Annuleren</span>
              </h3>
              <button
                type="button"
                className="appt-modal__close"
                onClick={() => setCancellingAppt(null)}
                aria-label="Sluiten"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="appt-modal__body">
              <p style={{ marginTop: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>
                Weet u zeker dat u uw afspraak op{" "}
                <strong>{new Date(cancellingAppt.dateTime).toLocaleString("nl-BE")}</strong> voor{" "}
                <strong>{SERVICE_META[cancellingAppt.type]?.label || cancellingAppt.type}</strong> wilt annuleren?
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Uw gereserveerde tijdslot wordt direct vrijgegeven voor andere klanten. U ontvangt per e-mail een bevestiging van de annulering.
              </p>

              <div style={{ marginTop: 16 }}>
                <label className="appt-lookup-label" style={{ display: "block", marginBottom: 6 }}>
                  Reden van annulering (optioneel)
                </label>
                <select
                  className="appt-lookup-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">Selecteer een reden...</option>
                  <option value="Verhinderd / Geen tijd">Verhinderd / Geen tijd</option>
                  <option value="Auto verkocht of in herstelling">Auto verkocht of in herstelling</option>
                  <option value="Elders geholpen">Elders geholpen</option>
                  <option value="Verkeerde datum gekozen">Verkeerde datum gekozen</option>
                  <option value="Anders">Andere reden</option>
                </select>
              </div>
            </div>

            <div className="appt-modal__footer">
              <button
                type="button"
                className="appt-action-btn"
                onClick={() => setCancellingAppt(null)}
                disabled={cancelSubmitting}
              >
                Nee, behoud afspraak
              </button>
              <button
                type="button"
                className="appt-action-btn appt-action-btn--danger"
                onClick={submitCancellation}
                disabled={cancelSubmitting}
              >
                {cancelSubmitting ? (
                  "Bezig met annuleren..."
                ) : (
                  <>
                    <XCircleIcon size={15} />
                    <span>Ja, afspraak annuleren</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
