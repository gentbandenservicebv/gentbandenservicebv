"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ReviewItem {
  id: string;
  tyreId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  active: boolean;
  createdAt: string;
  tyre?: {
    id: string;
    brand: string;
    model: string;
    size: string;
    slug?: string | null;
  };
}

export default function AdminReviewsView() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "hidden" | "verified">("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews?includeAll=1");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Fout bij ophalen reviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleToggleActive(id: string, currentActive: boolean) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, active: !currentActive } : r))
        );
      } else {
        alert("Fout bij wijzigen status");
      }
    } catch {
      alert("Netwerkfout bij bijwerken");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Weet u zeker dat u deze review definitief wilt verwijderen?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert("Fout bij verwijderen van review");
      }
    } catch {
      alert("Netwerkfout bij verwijderen");
    } finally {
      setActionLoading(null);
    }
  }

  const filteredReviews = reviews.filter((r) => {
    if (filter === "active" && !r.active) return false;
    if (filter === "hidden" && r.active) return false;
    if (filter === "verified" && !r.verifiedPurchase) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.userName.toLowerCase().includes(q);
      const matchEmail = (r.userEmail || "").toLowerCase().includes(q);
      const matchComment = r.comment.toLowerCase().includes(q);
      const matchTyre = `${r.tyre?.brand || ""} ${r.tyre?.model || ""} ${r.tyre?.size || ""}`.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchComment && !matchTyre) return false;
    }
    return true;
  });

  const totalReviews = reviews.length;
  const activeCount = reviews.filter((r) => r.active).length;
  const verifiedCount = reviews.filter((r) => r.verifiedPurchase).length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : "0";

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Top Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Totaal Reviews</div>
          <div style={statValueStyle}>{totalReviews}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Gemiddelde Score</div>
          <div style={{ ...statValueStyle, color: "#f59e0b" }}>
            ★ {avgRating} <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>/ 5</span>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Geverifieerde Aankopen</div>
          <div style={{ ...statValueStyle, color: "#10b981" }}>{verifiedCount}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Zichtbaar op Website</div>
          <div style={{ ...statValueStyle, color: "#016eb9" }}>
            {activeCount} <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>({totalReviews - activeCount} verborgen)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          background: "rgba(255,255,255,0.02)",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setFilter("all")}
            style={filterBtnStyle(filter === "all")}
          >
            Alle ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            style={filterBtnStyle(filter === "active")}
          >
            Actief ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("hidden")}
            style={filterBtnStyle(filter === "hidden")}
          >
            Verborgen ({totalReviews - activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("verified")}
            style={filterBtnStyle(filter === "verified")}
          >
            Geverifieerd ({verifiedCount})
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Zoek op klant, band of tekst..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "0.88rem",
              width: "240px",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ↻ Vernieuwen
          </button>
        </div>
      </div>

      {/* Reviews Table / List */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
          Reviews laden...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div
          style={{
            padding: "50px",
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "16px",
            border: "1px dashed rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Geen reviews gevonden {search ? `voor "${search}"` : ""}.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                background: rev.active ? "rgba(255,255,255,0.03)" : "rgba(239, 68, 68, 0.04)",
                border: rev.active ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "14px",
                padding: "18px 22px",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <div>
                {/* Header row: Tyre + Rating + Date */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span style={{ color: "#f59e0b", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "1px" }}>
                    {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                  </span>
                  <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                    {rev.rating}/5
                  </span>

                  {rev.tyre ? (
                    <Link
                      href={`/banden/${rev.tyre.slug || rev.tyre.id}`}
                      target="_blank"
                      style={{
                        background: "rgba(1,110,185,0.15)",
                        border: "1px solid rgba(1,110,185,0.3)",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        color: "#38bdf8",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {rev.tyre.brand} {rev.tyre.model} ({rev.tyre.size}) ↗
                    </Link>
                  ) : (
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
                      Band #{rev.tyreId.slice(0, 8)}
                    </span>
                  )}

                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>
                    {new Date(rev.createdAt).toLocaleDateString("nl-BE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Title */}
                {rev.title && (
                  <h4 style={{ margin: "0 0 6px", fontSize: "1rem", color: "#fff", fontWeight: 700 }}>
                    {rev.title}
                  </h4>
                )}

                {/* Comment */}
                <p style={{ margin: "0 0 10px", fontSize: "0.92rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>
                  {rev.comment}
                </p>

                {/* Author info & Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.82rem" }}>
                  <span style={{ fontWeight: 600, color: "#fff" }}>👤 {rev.userName}</span>
                  {rev.userEmail && (
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>&lt;{rev.userEmail}&gt;</span>
                  )}
                  {rev.verifiedPurchase && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        color: "#10b981",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    >
                      ✓ Geverifieerde aankoop
                    </span>
                  )}
                  {!rev.active && (
                    <span
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        color: "#f87171",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    >
                      Verborgen
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Right Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                <button
                  type="button"
                  disabled={actionLoading === rev.id}
                  onClick={() => handleToggleActive(rev.id, rev.active)}
                  style={{
                    background: rev.active ? "rgba(255,255,255,0.06)" : "rgba(16, 185, 129, 0.2)",
                    border: `1px solid ${rev.active ? "rgba(255,255,255,0.2)" : "rgba(16, 185, 129, 0.5)"}`,
                    color: rev.active ? "rgba(255,255,255,0.8)" : "#34d399",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {rev.active ? "Verberg review" : "✓ Activeer review"}
                </button>

                <button
                  type="button"
                  disabled={actionLoading === rev.id}
                  onClick={() => handleDelete(rev.id)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#f87171",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  🗑️ Verwijder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const statCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  padding: "16px 20px",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: "0.82rem",
  color: "rgba(255,255,255,0.55)",
  marginBottom: "6px",
  fontWeight: 500,
};

const statValueStyle: React.CSSProperties = {
  fontSize: "1.6rem",
  fontWeight: 800,
  color: "#fff",
  letterSpacing: "-0.02em",
};

function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#016eb9" : "rgba(255,255,255,0.05)",
    border: `1px solid ${active ? "#016eb9" : "rgba(255,255,255,0.1)"}`,
    color: active ? "#fff" : "rgba(255,255,255,0.7)",
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "0.84rem",
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    transition: "all 150ms ease",
  };
}
