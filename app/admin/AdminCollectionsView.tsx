"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { UploadDropzone } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compression";

interface TyreImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Tyre {
  id: string;
  brand: string;
  model: string;
  size: string;
  season: string;
  price: number;
  stock: number;
  width?: number | null;
  aspectRatio?: number | null;
  diameter?: number | null;
  images?: TyreImage[];
}

interface CollectionItem {
  id?: string;
  tyreId: string;
  axle: "FRONT" | "REAR" | "ALL";
  quantity: number;
  sortOrder?: number;
  tyre?: Tyre;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: string | null;
  season: "SUMMER" | "WINTER" | "ALL_SEASON";
  featured: boolean;
  active: boolean;
  imageUrl: string | null;
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

const COMMON_PRESETS = [
  {
    name: "BMW X5 (G05 / F15) 20 inch Zomerset",
    brand: "BMW",
    model: "X5",
    year: "2018-2024",
    season: "SUMMER",
    frontSize: "275/45 R20",
    rearSize: "305/40 R20",
  },
  {
    name: "BMW X5 (F15) 20 inch Breedset",
    brand: "BMW",
    model: "X5",
    year: "2013-2018",
    season: "SUMMER",
    frontSize: "275/40 R20",
    rearSize: "315/35 R20",
  },
  {
    name: "BMW 3-Serie / 4-Serie (G20) 19 inch Breedset",
    brand: "BMW",
    model: "3-Serie / 4-Serie",
    year: "2019-2024",
    season: "SUMMER",
    frontSize: "225/40 R19",
    rearSize: "255/35 R19",
  },
  {
    name: "Mercedes-Benz C-Klasse / E-Klasse AMG 19 inch",
    brand: "Mercedes-Benz",
    model: "C-Klasse AMG",
    year: "2018-2024",
    season: "SUMMER",
    frontSize: "225/40 R19",
    rearSize: "255/35 R19",
  },
  {
    name: "Porsche Macan 20 inch Staggered",
    brand: "Porsche",
    model: "Macan",
    year: "2014-2024",
    season: "ALL_SEASON",
    frontSize: "265/45 R20",
    rearSize: "295/40 R20",
  },
];

export default function AdminCollectionsView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [tyresList, setTyresList] = useState<Tyre[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formYear, setFormYear] = useState("");
  const [formSeason, setFormSeason] = useState<"SUMMER" | "WINTER" | "ALL_SEASON">("SUMMER");
  const [formDesc, setFormDesc] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formActive, setFormActive] = useState(true);

  // Items in collection
  const [frontTyreId, setFrontTyreId] = useState("");
  const [frontQty, setFrontQty] = useState(2);
  const [rearTyreId, setRearTyreId] = useState("");
  const [rearQty, setRearQty] = useState(2);

  // Tyre Search filters in modal
  const [frontSearch, setFrontSearch] = useState("");
  const [rearSearch, setRearSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [colsRes, tyresRes] = await Promise.all([
        fetch("/api/collections?all=1"),
        fetch("/api/tyres"),
      ]);
      if (colsRes.ok) {
        const data = await colsRes.json();
        setCollections(Array.isArray(data) ? data : []);
      }
      if (tyresRes.ok) {
        const data = await tyresRes.json();
        setTyresList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load collections data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingCollection(null);
    setFormName("");
    setFormSlug("");
    setFormBrand("");
    setFormModel("");
    setFormYear("");
    setFormSeason("SUMMER");
    setFormDesc("");
    setFormImageUrl("");
    setFormFeatured(false);
    setFormActive(true);
    setFrontTyreId("");
    setFrontQty(2);
    setRearTyreId("");
    setRearQty(2);
    setFrontSearch("");
    setRearSearch("");
    setIsModalOpen(true);
  };

  const openEditModal = (col: Collection) => {
    setEditingCollection(col);
    setFormName(col.name);
    setFormSlug(col.slug);
    setFormBrand(col.vehicleBrand || "");
    setFormModel(col.vehicleModel || "");
    setFormYear(col.vehicleYear || "");
    setFormSeason(col.season);
    setFormDesc(col.description || "");
    setFormImageUrl(col.imageUrl || "");
    setFormFeatured(col.featured);
    setFormActive(col.active);

    const frontItem = col.items.find((i) => i.axle === "FRONT");
    const rearItem = col.items.find((i) => i.axle === "REAR");

    setFrontTyreId(frontItem?.tyreId || "");
    setFrontQty(frontItem?.quantity || 2);
    setRearTyreId(rearItem?.tyreId || "");
    setRearQty(rearItem?.quantity || 2);

    setFrontSearch("");
    setRearSearch("");
    setIsModalOpen(true);
  };

  const applyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setFormName(preset.name);
    setFormBrand(preset.brand);
    setFormModel(preset.model);
    setFormYear(preset.year);
    setFormSeason(preset.season as any);
    setFormDesc(`Complete breedset / staggered fitment voor ${preset.brand} ${preset.model} (${preset.year}). Bevat 2x vooras (${preset.frontSize}) en 2x achteras (${preset.rearSize}).`);
    setFrontSearch(preset.frontSize);
    setRearSearch(preset.rearSize);
  };

  // Filtered tyres for selection dropdowns
  const filteredFrontTyres = useMemo(() => {
    if (!frontSearch.trim()) return tyresList.slice(0, 50);
    const q = frontSearch.toLowerCase();
    return tyresList.filter(
      (t) =>
        t.size.toLowerCase().includes(q) ||
        t.brand.toLowerCase().includes(q) ||
        t.model.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [tyresList, frontSearch]);

  const filteredRearTyres = useMemo(() => {
    if (!rearSearch.trim()) return tyresList.slice(0, 50);
    const q = rearSearch.toLowerCase();
    return tyresList.filter(
      (t) =>
        t.size.toLowerCase().includes(q) ||
        t.brand.toLowerCase().includes(q) ||
        t.model.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [tyresList, rearSearch]);

  // Selected tyre objects
  const selectedFrontTyre = tyresList.find((t) => t.id === frontTyreId);
  const selectedRearTyre = tyresList.find((t) => t.id === rearTyreId);

  const calculateTotalPrice = () => {
    let total = 0;
    if (selectedFrontTyre) total += selectedFrontTyre.price * frontQty;
    if (selectedRearTyre) total += selectedRearTyre.price * rearQty;
    return total;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setStatusMessage({ type: "error", text: "Vul een naam in voor de collectie." });
      return;
    }
    if (!frontTyreId && !rearTyreId) {
      setStatusMessage({ type: "error", text: "Selecteer ten minste één band voor voor- of achteras." });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const itemsPayload = [];
    if (frontTyreId) {
      itemsPayload.push({
        tyreId: frontTyreId,
        axle: "FRONT",
        quantity: frontQty,
      });
    }
    if (rearTyreId) {
      itemsPayload.push({
        tyreId: rearTyreId,
        axle: "REAR",
        quantity: rearQty,
      });
    }

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      vehicleBrand: formBrand.trim() || null,
      vehicleModel: formModel.trim() || null,
      vehicleYear: formYear.trim() || null,
      season: formSeason,
      description: formDesc.trim() || null,
      imageUrl: formImageUrl.trim() || null,
      featured: formFeatured,
      active: formActive,
      items: itemsPayload,
    };

    try {
      const url = editingCollection
        ? `/api/collections/${editingCollection.id}`
        : "/api/collections";
      const method = editingCollection ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: editingCollection ? "Collectie succesvol bijgewerkt!" : "Nieuwe collectie succesvol aangemaakt!",
        });
        setIsModalOpen(false);
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: "error", text: err.error || "Fout bij opslaan collectie." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Netwerkfout bij opslaan." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Weet u zeker dat u de collectie "${name}" wilt verwijderen?`)) return;

    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "Collectie verwijderd." });
        setCollections((prev) => prev.filter((c) => c.id !== id));
      } else {
        setStatusMessage({ type: "error", text: "Fout bij verwijderen." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Netwerkfout bij verwijderen." });
    }
  };

  const handleToggleActive = async (col: Collection) => {
    try {
      const res = await fetch(`/api/collections/${col.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !col.active }),
      });
      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) => (c.id === col.id ? { ...c, active: !c.active } : c))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
            Collecties &amp; Breedsets
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 4, fontSize: "0.95rem" }}>
            Beheer voertuigspecifieke sets met verschillende voor- en achterbandmaten (bijv. BMW X5 breedsets) inclusief eigen foto&apos;s.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={openNewModal}
            className="btn btn--primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              fontWeight: 600,
              borderRadius: 8,
              boxShadow: "0 4px 14px rgba(1, 110, 185, 0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nieuwe Collectie / Breedset
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: statusMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${statusMessage.type === "success" ? "#10b981" : "#ef4444"}`,
            color: statusMessage.type === "success" ? "#10b981" : "#f87171",
          }}
        >
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Preset Quick Actions */}
      <div
        style={{
          background: "#1a1d27",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Snel toevoegen via populaire presets:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COMMON_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                openNewModal();
                applyPreset(p);
              }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#e2e8f0",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#016eb9";
                e.currentTarget.style.background = "rgba(1, 110, 185, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            >
              + {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Collections List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.5)" }}>
          Collecties laden...
        </div>
      ) : collections.length === 0 ? (
        <div
          style={{
            background: "#1a1d27",
            border: "1px dashed rgba(255,255,255,0.15)",
            borderRadius: 12,
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ width: 48, height: 48, margin: "0 auto 16px", color: "rgba(255,255,255,0.3)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h3 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: 6 }}>Nog geen collecties aangemaakt</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", maxWidth: 450, margin: "0 auto 20px" }}>
            Maak een nieuwe collectie aan om breedsets (bijv. BMW X5 met 275 voor en 315 achter) overzichtelijk met eigen foto&apos;s als één set aan te bieden.
          </p>
          <button onClick={openNewModal} className="btn btn--primary" style={{ padding: "8px 18px", borderRadius: 8 }}>
            Eerste collectie aanmaken
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {collections.map((col) => {
            const front = col.items.find((i) => i.axle === "FRONT");
            const rear = col.items.find((i) => i.axle === "REAR");
            const totalPrice =
              (front?.tyre?.price ? front.tyre.price * front.quantity : 0) +
              (rear?.tyre?.price ? rear.tyre.price * rear.quantity : 0);

            const displayImage = col.imageUrl || front?.tyre?.images?.[0]?.url || rear?.tyre?.images?.[0]?.url;

            return (
              <div
                key={col.id}
                style={{
                  background: "#1a1d27",
                  border: `1px solid ${col.active ? "rgba(255,255,255,0.08)" : "rgba(239, 68, 68, 0.2)"}`,
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  transition: "border-color 0.2s ease",
                  opacity: col.active ? 1 : 0.65,
                }}
              >
                {/* Top row: Title + badges + actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Thumbnail */}
                    <div
                      style={{
                        position: "relative",
                        width: 56,
                        height: 56,
                        background: "#13151f",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={col.name}
                          fill
                          unoptimized
                          style={{ objectFit: "contain", padding: 4 }}
                        />
                      ) : (
                        <span style={{ fontSize: "1.3rem" }}>🛞</span>
                      )}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, color: "#fff", fontSize: "1.15rem", fontWeight: 700 }}>
                          {col.name}
                        </h3>
                        {col.featured && (
                          <span
                            style={{
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#f59e0b",
                              border: "1px solid rgba(245, 158, 11, 0.4)",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            ★ Uitgelicht
                          </span>
                        )}
                        <span
                          style={{
                            background:
                              col.season === "SUMMER"
                                ? "rgba(245, 158, 11, 0.15)"
                                : col.season === "WINTER"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "rgba(16, 185, 129, 0.15)",
                            color:
                              col.season === "SUMMER"
                                ? "#fbbf24"
                                : col.season === "WINTER"
                                ? "#60a5fa"
                                : "#34d399",
                            border: "1px solid rgba(255,255,255,0.1)",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {col.season === "SUMMER" ? "Zomer" : col.season === "WINTER" ? "Winter" : "4-Seizoenen"}
                        </span>
                        {!col.active && (
                          <span
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#f87171",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            Inactief
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginTop: 4, display: "flex", gap: 14 }}>
                        {col.vehicleBrand && (
                          <span>
                            Voertuig: <strong style={{ color: "#fff" }}>{col.vehicleBrand} {col.vehicleModel}</strong> ({col.vehicleYear || "Alle jaren"})
                          </span>
                        )}
                        <span>Slug: <code style={{ color: "#38bdf8" }}>/collecties/{col.slug}</code></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Link
                      href={`/collecties/${col.slug}`}
                      target="_blank"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "#94a3b8",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>Bekijk op site</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleToggleActive(col)}
                      style={{
                        background: col.active ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: col.active ? "#10b981" : "#f87171",
                        border: `1px solid ${col.active ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {col.active ? "Zet Inactief" : "Zet Actief"}
                    </button>
                    <button
                      onClick={() => openEditModal(col)}
                      style={{
                        background: "#016eb9",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(col.id, col.name)}
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#f87171",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>

                {/* Staggered Axle Layout Graphic / Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 14,
                    background: "#13151f",
                    borderRadius: 10,
                    padding: 14,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Front Axle */}
                  <div
                    style={{
                      borderLeft: "3px solid #38bdf8",
                      paddingLeft: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>
                        Vooras ({front?.quantity || 2}x)
                      </div>
                      {front?.tyre ? (
                        <div>
                          <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>
                            {front.tyre.brand} {front.tyre.model}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                            Maat: <strong style={{ color: "#e2e8f0" }}>{front.tyre.size}</strong> • Voorraad: {front.tyre.stock} st.
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                          Geen band gekoppeld
                        </div>
                      )}
                    </div>
                    {front?.tyre && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                          €{(front.tyre.price * front.quantity).toFixed(2)}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                          €{front.tyre.price.toFixed(2)} / st.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rear Axle */}
                  <div
                    style={{
                      borderLeft: "3px solid #f59e0b",
                      paddingLeft: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>
                        Achteras ({rear?.quantity || 2}x - Breder)
                      </div>
                      {rear?.tyre ? (
                        <div>
                          <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>
                            {rear.tyre.brand} {rear.tyre.model}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                            Maat: <strong style={{ color: "#e2e8f0" }}>{rear.tyre.size}</strong> • Voorraad: {rear.tyre.stock} st.
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                          Geen band gekoppeld
                        </div>
                      )}
                    </div>
                    {rear?.tyre && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                          €{(rear.tyre.price * rear.quantity).toFixed(2)}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                          €{rear.tyre.price.toFixed(2)} / st.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Set Price Pill */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "flex-end",
                      borderLeft: "1px dashed rgba(255,255,255,0.1)",
                      paddingLeft: 14,
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                      Totaal Complete Set (4 banden)
                    </div>
                    <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#10b981" }}>
                      €{totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create / Edit Collection */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#1a1d27",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 880,
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: "#fff", fontSize: "1.35rem", fontWeight: 700 }}>
                {editingCollection ? "Collectie Bewerken" : "Nieuwe Collectie / Breedset"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* General Information */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: 6 }}>
                    Collectie Naam * (bijv. BMW X5 Zomer Breedset 20&quot;)
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="bijv. BMW X5 M-Sport Zomerset 20 inch"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#13151f",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: 6 }}>
                    URL Slug (automatisch gegenereerd indien leeg)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="bmw-x5-zomer-breedset-20-inch"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#13151f",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              </div>

              {/* Vehicle & Season details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: 6 }}>
                    Automerk
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="bijv. BMW"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#13151f",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: 6 }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="bijv. X5"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#13151f",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: 6 }}>
                    Bouwjaar / Generatie
                  </label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="bijv. 2018-2024 (G05)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#13151f",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: 6 }}>
                    Seizoen
                  </label>
                  <select
                    value={formSeason}
                    onChange={(e) => setFormSeason(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#13151f",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="SUMMER">Zomerbanden</option>
                    <option value="WINTER">Winterbanden</option>
                    <option value="ALL_SEASON">4-Seizoenen</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: 6 }}>
                  Beschrijving / Informatie voor klant
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Korte beschrijving van de set, specifieke eigenschappen of pasvorm..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#13151f",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.9rem",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* IMAGE UPLOAD / IMAGE URL SECTION */}
              <div
                style={{
                  background: "#13151f",
                  borderRadius: 12,
                  padding: 18,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <label style={{ display: "block", color: "#fff", fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>
                  Afbeelding voor de collectie / breedset (optioneel)
                </label>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: 0, marginBottom: 14 }}>
                  Upload een foto van de wagen, velgenset of geef een afbeeldings-URL op. U kunt ook met 1 klik de foto van de geselecteerde banden overnemen.
                </p>

                {formImageUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, background: "rgba(255,255,255,0.04)", padding: 12, borderRadius: 8 }}>
                    <div style={{ position: "relative", width: 90, height: 90, background: "#1a1d27", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <Image
                        src={formImageUrl}
                        alt="Collectie afbeelding preview"
                        fill
                        unoptimized
                        style={{ objectFit: "contain", padding: 4 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 600 }}>✓ Afbeelding geselecteerd</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", wordBreak: "break-all", marginTop: 2 }}>{formImageUrl}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImageUrl("")}
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#f87171",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        padding: "6px 14px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      Foto verwijderen
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Quick reuse buttons if tyres have photos */}
                    {(selectedFrontTyre?.images?.[0]?.url || selectedRearTyre?.images?.[0]?.url) && (
                      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                        {selectedFrontTyre?.images?.[0]?.url && (
                          <button
                            type="button"
                            onClick={() => setFormImageUrl(selectedFrontTyre.images![0].url)}
                            style={{
                              background: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            📷 Gebruik foto van voorasband
                          </button>
                        )}
                        {selectedRearTyre?.images?.[0]?.url && (
                          <button
                            type="button"
                            onClick={() => setFormImageUrl(selectedRearTyre.images![0].url)}
                            style={{
                              background: "rgba(245, 158, 11, 0.12)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              color: "#f59e0b",
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            📷 Gebruik foto van achterasband
                          </button>
                        )}
                      </div>
                    )}

                    {/* Direct URL input */}
                    <div style={{ marginBottom: 12 }}>
                      <input
                        type="url"
                        placeholder="https://voorbeeld.com/afbeelding.jpg (of upload hieronder)"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "#1a1d27",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    {/* UploadDropzone */}
                    <UploadDropzone
                      endpoint="tyreImages"
                      onBeforeUploadBegin={async (files) => {
                        try {
                          const { files: compressed } = await compressImages(files);
                          return compressed;
                        } catch {
                          return files;
                        }
                      }}
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) {
                          setFormImageUrl(res[0].url);
                        }
                      }}
                      onUploadError={(err) => {
                        alert(`Upload mislukt: ${err.message}`);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", gap: 24, padding: "4px 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: "0.9rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "#016eb9" }}
                  />
                  <span>Uitgelicht tonen op homepage / bovenaan</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: "0.9rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "#016eb9" }}
                  />
                  <span>Direct actief en zichtbaar voor klanten</span>
                </label>
              </div>

              {/* STAGGERED AXLE SELECTION */}
              <div
                style={{
                  background: "#13151f",
                  borderRadius: 12,
                  padding: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h4 style={{ margin: "0 0 16px 0", color: "#fff", fontSize: "1rem", fontWeight: 700 }}>
                  Bandenspecificatie per as (Vooras &amp; Achteras)
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* VOORAS */}
                  <div
                    style={{
                      background: "#1a1d27",
                      borderRadius: 10,
                      padding: 16,
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, color: "#38bdf8", fontSize: "0.9rem", textTransform: "uppercase" }}>
                        Vooras Band
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Aantal:</span>
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={frontQty}
                          onChange={(e) => setFrontQty(Number(e.target.value) || 2)}
                          style={{
                            width: 50,
                            padding: "4px 8px",
                            background: "#13151f",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 6,
                            color: "#fff",
                            textAlign: "center",
                          }}
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Zoek maat/merk (bijv. 275/40 R20)..."
                      value={frontSearch}
                      onChange={(e) => setFrontSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#13151f",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: "0.85rem",
                        marginBottom: 10,
                      }}
                    />

                    <select
                      value={frontTyreId}
                      onChange={(e) => setFrontTyreId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "#13151f",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: "0.85rem",
                      }}
                    >
                      <option value="">-- Kies een band voor de vooras --</option>
                      {filteredFrontTyres.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.brand} {t.model} ({t.size}) - €{t.price} (voorraad: {t.stock})
                        </option>
                      ))}
                    </select>

                    {selectedFrontTyre && (
                      <div style={{ marginTop: 12, padding: 10, background: "rgba(56, 189, 248, 0.08)", borderRadius: 6 }}>
                        <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.85rem" }}>
                          {selectedFrontTyre.brand} {selectedFrontTyre.model}
                        </div>
                        <div style={{ color: "#38bdf8", fontSize: "0.8rem" }}>
                          {frontQty}x €{selectedFrontTyre.price.toFixed(2)} = €{(selectedFrontTyre.price * frontQty).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACHTERAS */}
                  <div
                    style={{
                      background: "#1a1d27",
                      borderRadius: 10,
                      padding: 16,
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.9rem", textTransform: "uppercase" }}>
                        Achteras Band (Breder)
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Aantal:</span>
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={rearQty}
                          onChange={(e) => setRearQty(Number(e.target.value) || 2)}
                          style={{
                            width: 50,
                            padding: "4px 8px",
                            background: "#13151f",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 6,
                            color: "#fff",
                            textAlign: "center",
                          }}
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Zoek maat/merk (bijv. 315/35 R20)..."
                      value={rearSearch}
                      onChange={(e) => setRearSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#13151f",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: "0.85rem",
                        marginBottom: 10,
                      }}
                    />

                    <select
                      value={rearTyreId}
                      onChange={(e) => setRearTyreId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "#13151f",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: "0.85rem",
                      }}
                    >
                      <option value="">-- Kies een band voor de achteras --</option>
                      {filteredRearTyres.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.brand} {t.model} ({t.size}) - €{t.price} (voorraad: {t.stock})
                        </option>
                      ))}
                    </select>

                    {selectedRearTyre && (
                      <div style={{ marginTop: 12, padding: 10, background: "rgba(245, 158, 11, 0.08)", borderRadius: 6 }}>
                        <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.85rem" }}>
                          {selectedRearTyre.brand} {selectedRearTyre.model}
                        </div>
                        <div style={{ color: "#f59e0b", fontSize: "0.8rem" }}>
                          {rearQty}x €{selectedRearTyre.price.toFixed(2)} = €{(selectedRearTyre.price * rearQty).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Preview */}
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
                    Berekende totaalprijs complete set ({frontQty + rearQty} banden):
                  </span>
                  <span style={{ color: "#10b981", fontSize: "1.35rem", fontWeight: 800 }}>
                    €{calculateTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#e2e8f0",
                    padding: "10px 18px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn--primary"
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    fontWeight: 600,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Opslaan..." : editingCollection ? "Wijzigingen Opslaan" : "Collectie Aanmaken"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
