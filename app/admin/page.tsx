"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import * as XLSX from "xlsx";
import { useSession, signOut } from "@/lib/auth-client";
import { UploadDropzone, useUploadThing } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compression";
import AdminAnalyticsView from "./AdminAnalyticsView";
import "./admin.css";

interface TyreImage {
  id: string;
  url: string;
  fileKey: string;
  isPrimary: boolean;
  order: number;
}

interface Tyre {
  id: string;
  brand: string;
  model: string;
  size: string;
  width?: number | null;
  aspectRatio?: number | null;
  diameter?: number | null;
  speedIndex?: string | null;
  loadIndex?: string | null;
  season: string;
  condition: string;
  price: number;
  stock: number;
  treadDepth: number | null;
  dotYear?: string | null;
  runflat: boolean;
  reinforced: boolean;
  threepmsfRated?: boolean;
  msMarking?: boolean;
  selfSealing?: boolean;
  acoustic?: boolean;
  electric?: boolean;
  rimProtection?: boolean;
  iceGrip?: boolean;
  highLoad?: boolean;
  demo?: boolean;
  oeMarking?: string | null;
  tyreClass?: string | null;
  plyRating?: string | null;
  loadRange?: string | null;
  structureType?: string | null;
  tubeless?: boolean;
  fuelEfficiency?: string | null;
  wetGrip?: string | null;
  noiseLevel?: number | null;
  description: string | null;
  featured: boolean;
  active: boolean;
  images: TyreImage[];
}

interface InvoiceEntry {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerStreet: string | null;
  customerCity: string | null;
  customerPostal: string | null;
  customerCountry: string | null;
  companyName: string | null;
  vatNumber: string | null;
  status: "PENDING" | "PAID" | "CANCELLED";
  issueDate: string;
  dueDate: string;
  paymentMethod: string | null;
  items: string; // JSON
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notes: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface AppointmentEntry {
  id: string;
  dateTime: string;
  type: string;
  status: string;
  vehicleInfo: string | null;
  notes: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user: { name: string; email: string } | null;
  createdAt: string;
}

export interface SecondhandEntry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  brand: string;
  model: string | null;
  size: string;
  season: string | null;
  quantity: number;
  treadDepth: number | null;
  dotYear: string | null;
  condition: string | null;
  extraNotes: string | null;
  photos: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  offerPrice: number | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderEntry {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "READY" | "COMPLETED" | "CANCELLED";
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  serviceType?: string | null;
  deliveryStreet?: string | null;
  deliveryPostalCode?: string | null;
  deliveryCity?: string | null;
  deliveryCountry?: string | null;
  deliveryAddress?: string | null;
  notes: string | null;
  user: {
    name: string;
    email: string;
    phone?: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    tyre: {
      id: string;
      brand: string;
      model: string;
      size: string;
      condition: string;
      season: string;
      images?: Array<{ url: string; isPrimary: boolean }>;
    };
  }>;
  returnRequests?: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    reason: string;
    reasonDetails: string | null;
    itemsInfo: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
    adminNotes: string | null;
    createdAt: string;
  }>;
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Wachtend", cls: "admin-badge--new" },
  CONFIRMED: { label: "Bevestigd", cls: "admin-badge--processing" },
  READY: { label: "Klaar voor klant", cls: "admin-badge--new" },
  COMPLETED: { label: "Voltooid", cls: "admin-badge--completed" },
  CANCELLED: { label: "Geannuleerd", cls: "admin-badge--cancelled" },
};

const APPT_TYPE_LABELS: Record<string, string> = {
  FITTING: "Banden monteren & balanceren",
  REPAIR: "Bandenreparatie",
  INSPECTION: "Inspectie & Seizoenswissel",
  OTHER: "Andere service / Advies",
};

const APPT_TYPE_CONFIG: Record<string, { label: string; duration: string; icon: string; badgeCls: string }> = {
  FITTING: { label: "Banden monteren & balanceren", duration: "ca. 45 min", icon: "🛞", badgeCls: "admin-badge--processing" },
  REPAIR: { label: "Bandenreparatie", duration: "ca. 30 min", icon: "🔧", badgeCls: "admin-badge--used" },
  INSPECTION: { label: "Inspectie & Seizoenswissel", duration: "ca. 30 min", icon: "🔍", badgeCls: "admin-badge--new" },
  OTHER: { label: "Andere service / Advies", duration: "ca. 30 min", icon: "💬", badgeCls: "admin-badge--new" },
};

const APPT_STATUS_CONFIG: Record<string, { label: string; cls: string; color: string; bg: string }> = {
  PENDING: { label: "Te bevestigen", cls: "admin-badge--new", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  CONFIRMED: { label: "Bevestigd", cls: "admin-badge--processing", color: "#016eb9", bg: "rgba(1, 110, 185, 0.12)" },
  COMPLETED: { label: "Voltooid", cls: "admin-badge--completed", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
  CANCELLED: { label: "Geannuleerd", cls: "admin-badge--cancelled", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)" },
};

const SEASONS = ["SUMMER", "WINTER", "ALL_SEASON"] as const;
const SEASON_LABELS: Record<string, string> = {
  SUMMER: "Zomer",
  WINTER: "Winter",
  ALL_SEASON: "All-season",
};
// Brands grouped by tier
const BRAND_GROUPS = [
  {
    label: "Premium",
    brands: [
      "Michelin", "Continental", "Bridgestone", "Goodyear", "Pirelli",
      "Dunlop", "Nokian", "Vredestein", "Hankook", "Yokohama",
    ],
  },
  {
    label: "Mid-range",
    brands: [
      "Falken", "Toyo", "Kumho", "Maxxis", "BFGoodrich", "General Tire",
      "Kleber", "Semperit", "Fulda", "Barum", "Sava", "Firestone",
      "Cooper", "Nexen", "Nankang", "Metzeler",
    ],
  },
  {
    label: "Budget",
    brands: [
      "Linglong", "Sailun", "Landsail", "Rotalla", "Westlake", "Hifly",
      "Riken", "Taurus", "Debica", "Star Performer", "Minerva",
      "Imperial", "Roadhog", "Mentor", "Infinity", "Sonar",
      "Accelera", "Arivo", "Blacklion", "Comforser",
    ],
  },
  {
    label: "4x4 / SUV / Off-road",
    brands: [
      "Nitto", "Dick Cepek", "Mickey Thompson",
      "Interco", "Mastercraft", "Radar", "Atturo",
    ],
  },
  {
    label: "Bestelwagen / Lichte vracht",
    brands: [
      "Michelin Agilis", "Continental VanContact", "Bridgestone Duravis",
      "Goodyear Cargo", "Pirelli Chrono", "Hankook Radial",
    ],
  },
];
const BRANDS = BRAND_GROUPS.flatMap((g) => g.brands);

import { OE_MARKINGS, TYRE_CLASSES, PLY_RATINGS, LOAD_RANGES, STRUCTURE_TYPES, getSpecTooltip } from "@/lib/tyre-specs";

export interface TyreFormData {
  brand: string;
  model: string;
  size: string;
  season: string;
  condition: string;
  price: string;
  stock: string;
  treadDepth: string;
  speedIndex: string;
  loadIndex: string;
  dotYear: string;
  runflat: boolean;
  reinforced: boolean;
  threepmsfRated: boolean;
  msMarking: boolean;
  selfSealing: boolean;
  acoustic: boolean;
  electric: boolean;
  rimProtection: boolean;
  iceGrip: boolean;
  highLoad: boolean;
  demo: boolean;
  oeMarking: string;
  tyreClass: string;
  plyRating: string;
  loadRange: string;
  structureType: string;
  tubeless: boolean;
  fuelEfficiency: string;
  wetGrip: string;
  noiseLevel: string;
  description: string;
  featured: boolean;
}

const emptyForm: TyreFormData = {
  brand: "",
  model: "",
  size: "",
  season: "SUMMER",
  condition: "NEW",
  price: "",
  stock: "0",
  treadDepth: "",
  speedIndex: "",
  loadIndex: "",
  dotYear: "",
  runflat: false,
  reinforced: false,
  threepmsfRated: false,
  msMarking: false,
  selfSealing: false,
  acoustic: false,
  electric: false,
  rimProtection: false,
  iceGrip: false,
  highLoad: false,
  demo: false,
  oeMarking: "",
  tyreClass: "",
  plyRating: "",
  loadRange: "",
  structureType: "",
  tubeless: true,
  fuelEfficiency: "",
  wetGrip: "",
  noiseLevel: "",
  description: "",
  featured: false,
};

type FormData = TyreFormData;

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const router = useRouter();
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [existingImages, setExistingImages] = useState<TyreImage[]>([]);
  const [pendingImages, setPendingImages] = useState<{ url: string; fileKey?: string }[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageActionLoading, setImageActionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "tyres" | "orders" | "appointments" | "secondhand" | "invoices" | "analytics">("dashboard");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Invoices state
  const [invoices, setInvoices] = useState<InvoiceEntry[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<"ALL" | "PENDING" | "PAID" | "CANCELLED">("ALL");
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [newInvoiceForm, setNewInvoiceForm] = useState<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerStreet: string;
    customerPostal: string;
    customerCity: string;
    customerCountry: string;
    companyName: string;
    vatNumber: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    paymentMethod: string;
    status: "PENDING" | "PAID";
    items: Array<{ description: string; quantity: number; price: number; vatRate: number }>;
    notes: string;
    sendDirectly: boolean;
  }>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerStreet: "",
    customerPostal: "",
    customerCity: "",
    customerCountry: "België",
    companyName: "",
    vatNumber: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    paymentMethod: "Overschrijving",
    status: "PENDING",
    items: [{ description: "Montage & balanceren banden", quantity: 4, price: 19.99, vatRate: 21 }],
    notes: "Gelieve het openstaande bedrag over te maken binnen 14 dagen met vermelding van het factuurnummer.",
    sendDirectly: true,
  });

  const [editingInvoice, setEditingInvoice] = useState<InvoiceEntry | null>(null);
  const [editInvoiceForm, setEditInvoiceForm] = useState<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerStreet: string;
    customerPostal: string;
    customerCity: string;
    customerCountry: string;
    companyName: string;
    vatNumber: string;
    issueDate: string;
    dueDate: string;
    paymentMethod: string;
    status: "PENDING" | "PAID" | "CANCELLED";
    items: Array<{ description: string; quantity: number; price: number; vatRate: number }>;
    notes: string;
  }>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerStreet: "",
    customerPostal: "",
    customerCity: "",
    customerCountry: "België",
    companyName: "",
    vatNumber: "",
    issueDate: "",
    dueDate: "",
    paymentMethod: "Overschrijving",
    status: "PENDING",
    items: [],
    notes: "",
  });

  const [secondhandSubmissions, setSecondhandSubmissions] = useState<SecondhandEntry[]>([]);
  const [secondhandStatusFilter, setSecondhandStatusFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");
  const [secondhandSearch, setSecondhandSearch] = useState("");
  const [expandedSecondhand, setExpandedSecondhand] = useState<string | null>(null);
  const [secondhandActionLoading, setSecondhandActionLoading] = useState<string | null>(null);
  const [secondhandOfferInput, setSecondhandOfferInput] = useState<Record<string, string>>({});
  const [secondhandAdminNotes, setSecondhandAdminNotes] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [apptStatusFilter, setApptStatusFilter] = useState<string>("ALL");
  const [apptDateFilter, setApptDateFilter] = useState<"ALL" | "TODAY" | "TOMORROW" | "THIS_WEEK" | "UPCOMING" | "PAST">("ALL");
  const [apptSearch, setApptSearch] = useState<string>("");
  const [apptViewMode, setApptViewMode] = useState<"agenda" | "table">("agenda");
  const [apptActionLoading, setApptActionLoading] = useState<string | null>(null);
  const [expandedAppt, setExpandedAppt] = useState<string | null>(null);

  // Edit / Reschedule Modal state
  const [editingAppt, setEditingAppt] = useState<AppointmentEntry | null>(null);
  const [editApptError, setEditApptError] = useState("");
  const [editApptForm, setEditApptForm] = useState<{
    date: string;
    time: string;
    dateTime: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    type: string;
    status: string;
    vehiclePlate: string;
    vehicleBrandModel: string;
    tyreSize: string;
    vehicleInfo: string;
    notes: string;
  }>({
    date: "",
    time: "10:00",
    dateTime: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    type: "FITTING",
    status: "CONFIRMED",
    vehiclePlate: "",
    vehicleBrandModel: "",
    tyreSize: "",
    vehicleInfo: "",
    notes: "",
  });
  const [savingApptEdit, setSavingApptEdit] = useState(false);

  // New Appointment Modal state (Comprehensive Workbench)
  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [newApptForm, setNewApptForm] = useState<{
    dateTime: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    type: "FITTING" | "REPAIR" | "INSPECTION" | "OTHER";
    vehiclePlate: string;
    vehicleBrandModel: string;
    tyreSize: string;
    tyreSource: "own" | "shop";
    tyreQuantity: number;
    selectedTyreId: string;
    bay: string;
    status: "CONFIRMED" | "PENDING";
    notes: string;
  }>({
    dateTime: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    type: "FITTING",
    vehiclePlate: "",
    vehicleBrandModel: "",
    tyreSize: "",
    tyreSource: "own",
    tyreQuantity: 2,
    selectedTyreId: "",
    bay: "Geen voorkeur",
    status: "CONFIRMED",
    notes: "",
  });
  const [savingNewAppt, setSavingNewAppt] = useState(false);


  // Tyre search & filter state
  const [tyreSearch, setTyreSearch] = useState("");
  const [tyreSeasonFilter, setTyreSeasonFilter] = useState("ALL");
  const [tyreConditionFilter, setTyreConditionFilter] = useState("ALL");
  const [tyreStockFilter, setTyreStockFilter] = useState("ALL");
  const [tyrePage, setTyrePage] = useState(1);
  const TYRES_PER_PAGE = 25;

  // CSV & Excel bulk import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [isPasteDragOver, setIsPasteDragOver] = useState(false);
  const uploadZoneRef = useRef<HTMLDivElement>(null);

  // Lightbox modal state for viewing full-size images (e.g. secondhand tyres)
  const [adminLightbox, setAdminLightbox] = useState<{
    list: string[];
    index: number;
    title?: string;
  } | null>(null);

  useEffect(() => {
    if (!adminLightbox) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAdminLightbox(null);
      if (e.key === "ArrowLeft") {
        setAdminLightbox((prev) =>
          prev ? { ...prev, index: prev.index > 0 ? prev.index - 1 : prev.list.length - 1 } : null
        );
      }
      if (e.key === "ArrowRight") {
        setAdminLightbox((prev) =>
          prev ? { ...prev, index: prev.index < prev.list.length - 1 ? prev.index + 1 : 0 } : null
        );
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [adminLightbox]);

  const onUploadDone = useCallback(
    (res: { key: string; url?: string; ufsUrl?: string; serverData?: { url?: string } }[]) => {
      const imgs = res.map((f) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: (f as any).ufsUrl ?? f.url ?? (f as any).serverData?.url ?? "",
        fileKey: f.key,
      }));
      setPendingImages((prev) => [...prev, ...imgs]);
      setMessage({ type: "success", text: `${res.length} foto${res.length !== 1 ? "'s" : ""} succesvol geüpload!` });
      setIsPasting(false);
    },
    []
  );

  const { startUpload } = useUploadThing("tyreImages", {
    onClientUploadComplete: onUploadDone,
    onUploadError: (err: Error) => {
      console.error("[Upload] paste error:", err);
      setMessage({ type: "error", text: `Upload fout: ${err.message}` });
      setIsPasting(false);
    },
    onUploadBegin: () => setMessage(null),
  });

  // Paste handler: Ctrl+V with image in clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only active when the tyre form is open
      if (!showForm) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        setIsPasting(true);
        setMessage({ type: "success", text: `Afbeelding geplakt — comprimeren...` });
        compressImages(imageFiles).then(({ files: compressed, summary }) => {
          if (summary) setMessage({ type: "success", text: `⚡ ${summary} — uploaden...` });
          startUpload(compressed);
        }).catch(() => {
          startUpload(imageFiles);
        });
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [showForm, startUpload]);

  const fetchTyres = useCallback(async () => {
    try {
      const res = await fetch("/api/tyres");
      if (res.ok) {
        const data = await res.json();
        setTyres(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.replace("/auth/signin?redirect=/admin");
        return;
      }
      if (!isAdmin) {
        router.replace("/account");
        return;
      }
    }
    if (session && isAdmin) {
      let isMounted = true;
      fetch("/api/tyres")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (isMounted) {
            setTyres(data);
            setLoading(false);
          }
        })
        .catch(console.error);
      return () => {
        isMounted = false;
      };
    }
  }, [session, isPending, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    // Always pre-fetch orders and appointments for the dashboard
    if (activeTab === "dashboard" || activeTab === "orders") {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d) => setOrders(Array.isArray(d) ? d : []))
        .catch(console.error);
    }
    if (activeTab === "dashboard" || activeTab === "appointments") {
      fetch("/api/appointments")
        .then((r) => r.json())
        .then((data) => setAppointments(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
    if (activeTab === "invoices" || activeTab === "dashboard") {
      fetch("/api/invoices")
        .then((r) => r.json())
        .then((data) => setInvoices(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
    if (activeTab === "secondhand") {
      fetch("/api/secondhand")
        .then((r) => r.json())
        .then((data) => setSecondhandSubmissions(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [activeTab, isAdmin]);

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (Array.isArray(data)) setInvoices(data);
    } catch (e) {
      console.error("fetchInvoices error:", e);
    }
  }

  async function handleSendInvoiceEmail(invId: string) {
    setSendingInvoiceId(invId);
    try {
      const res = await fetch(`/api/invoices/${invId}/send`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((i) => (i.id === invId ? { ...i, sentAt: data.sentAt || new Date().toISOString() } : i))
        );
        setMessage({ type: "success", text: "Factuur succesvol per e-mail verzonden naar de klant!" });
      } else {
        setMessage({ type: "error", text: data.error || "Fout bij verzenden van factuur." });
      }
    } catch {
      setMessage({ type: "error", text: "Fout bij verzenden van factuur." });
    } finally {
      setSendingInvoiceId(null);
    }
  }

  async function handleToggleInvoiceStatus(invId: string, currentStatus: string) {
    const nextStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
    try {
      const res = await fetch(`/api/invoices/${invId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setInvoices((prev) => prev.map((i) => (i.id === invId ? { ...i, status: nextStatus } : i)));
        setMessage({
          type: "success",
          text: nextStatus === "PAID" ? "Factuur gemarkeerd als BETAALD!" : "Factuur gemarkeerd als OPENSTAAND.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Fout bij wijzigen status." });
    }
  }

  async function handleDeleteInvoice(invId: string, num: string) {
    if (!confirm(`Weet u zeker dat u factuur #${num} wilt verwijderen?`)) return;
    setDeletingInvoiceId(invId);
    try {
      const res = await fetch(`/api/invoices/${invId}`, { method: "DELETE" });
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i.id !== invId));
        setMessage({ type: "success", text: `Factuur #${num} succesvol verwijderd.` });
      }
    } catch {
      setMessage({ type: "error", text: "Fout bij verwijderen factuur." });
    } finally {
      setDeletingInvoiceId(null);
    }
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!newInvoiceForm.customerName.trim() || !newInvoiceForm.customerEmail.trim()) {
      alert("Vul a.u.b. een klantnaam en e-mailadres in.");
      return;
    }
    setSavingInvoice(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoiceForm),
      });
      const data = await res.json();
      if (res.ok) {
        setInvoices((prev) => [data, ...prev]);
        setShowNewInvoiceModal(false);
        setMessage({
          type: "success",
          text: newInvoiceForm.sendDirectly
            ? `Factuur #${data.invoiceNumber} succesvol aangemaakt en verzonden naar ${data.customerEmail}!`
            : `Factuur #${data.invoiceNumber} succesvol opgeslagen!`,
        });
        setNewInvoiceForm({
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          customerStreet: "",
          customerPostal: "",
          customerCity: "",
          customerCountry: "België",
          companyName: "",
          vatNumber: "",
          invoiceNumber: "",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          paymentMethod: "Overschrijving",
          status: "PENDING",
          items: [{ description: "Montage & balanceren banden", quantity: 4, price: 19.99, vatRate: 21 }],
          notes: "Gelieve het openstaande bedrag over te maken binnen 14 dagen met vermelding van het factuurnummer.",
          sendDirectly: true,
        });
      } else {
        alert(data.error || "Fout bij aanmaken factuur.");
      }
    } catch {
      alert("Fout bij aanmaken factuur.");
    } finally {
      setSavingInvoice(false);
    }
  }

  function openEditInvoiceModal(inv: InvoiceEntry) {
    let parsedItems: Array<{ description: string; quantity: number; price: number; vatRate: number }> = [];
    try {
      parsedItems = JSON.parse(inv.items);
    } catch {
      parsedItems = [{ description: "Diensten / Banden", quantity: 1, price: inv.totalAmount, vatRate: 21 }];
    }

    setEditingInvoice(inv);
    setEditInvoiceForm({
      customerName: inv.customerName || "",
      customerEmail: inv.customerEmail || "",
      customerPhone: inv.customerPhone || "",
      customerStreet: inv.customerStreet || "",
      customerPostal: inv.customerPostal || "",
      customerCity: inv.customerCity || "",
      customerCountry: inv.customerCountry || "België",
      companyName: inv.companyName || "",
      vatNumber: inv.vatNumber || "",
      issueDate: new Date(inv.issueDate).toISOString().split("T")[0],
      dueDate: new Date(inv.dueDate).toISOString().split("T")[0],
      paymentMethod: inv.paymentMethod || "Overschrijving",
      status: inv.status as any,
      items: parsedItems.length > 0 ? parsedItems : [{ description: "Dienst / Band", quantity: 1, price: 0, vatRate: 21 }],
      notes: inv.notes || "",
    });
  }

  async function handleUpdateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!editingInvoice) return;
    if (!editInvoiceForm.customerName.trim() || !editInvoiceForm.customerEmail.trim()) {
      alert("Vul a.u.b. een klantnaam en e-mailadres in.");
      return;
    }
    setSavingInvoice(true);
    try {
      const res = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editInvoiceForm),
      });
      const updated = await res.json();
      if (res.ok) {
        setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
        setEditingInvoice(null);
        setMessage({
          type: "success",
          text: `Factuur #${updated.invoiceNumber} succesvol bijgewerkt!`,
        });
      } else {
        setMessage({ type: "error", text: updated.error || "Fout bij bijwerken factuur." });
      }
    } catch {
      setMessage({ type: "error", text: "Fout bij bijwerken factuur." });
    } finally {
      setSavingInvoice(false);
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    setOrderActionLoading(id + status);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated: OrderEntry = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)));
        setMessage({ type: "success", text: `Bestelling status aangepast naar ${ORDER_STATUS_CONFIG[status]?.label || status}.` });
      } else {
        setMessage({ type: "error", text: "Fout bij aanpassen van de bestelstatus." });
      }
    } catch {
      setMessage({ type: "error", text: "Verbindingsfout bij bijwerken van de bestelling." });
    } finally {
      setOrderActionLoading(null);
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm("Weet u zeker dat u deze bestelling wilt verwijderen?")) return;
    setOrderActionLoading(id + "delete");
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        setMessage({ type: "success", text: "Bestelling succesvol verwijderd." });
      } else {
        setMessage({ type: "error", text: "Fout bij het verwijderen van de bestelling." });
      }
    } catch {
      setMessage({ type: "error", text: "Verbindingsfout bij het verwijderen van de bestelling." });
    } finally {
      setOrderActionLoading(null);
    }
  }

  async function updateReturnStatus(orderId: string, returnId: string, newStatus: string) {
    setOrderActionLoading(returnId + newStatus);
    try {
      const res = await fetch(`/api/returns/${returnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;
            return {
              ...o,
              returnRequests: o.returnRequests?.map((r) =>
                r.id === returnId ? { ...r, status: updated.status } : r
              ),
            };
          })
        );
        setMessage({ type: "success", text: `Retouraanvraag status aangepast naar ${newStatus}.` });
      } else {
        setMessage({ type: "error", text: "Fout bij bijwerken van retouraanvraag." });
      }
    } catch {
      setMessage({ type: "error", text: "Verbindingsfout bij bijwerken van retouraanvraag." });
    } finally {
      setOrderActionLoading(null);
    }
  }

  async function updateAppointmentStatus(id: string, status: string) {
    setApptActionLoading(id + status);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated: AppointmentEntry = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        const label = APPT_STATUS_CONFIG[status]?.label || status;
        setMessage({ type: "success", text: `Afspraak status succesvol bijgewerkt naar "${label}".` });
      } else {
        const err = await res.json().catch(() => null);
        setMessage({ type: "error", text: err?.error || "Fout bij wijzigen status" });
      }
    } catch {
      setMessage({ type: "error", text: "Netwerkfout bij bijwerken afspraak." });
    } finally {
      setApptActionLoading(null);
    }
  }

  async function deleteAppointment(id: string) {
    if (!confirm("Weet u zeker dat u deze afspraak definitief wilt verwijderen?")) return;
    setApptActionLoading(id + "delete");
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
        setMessage({ type: "success", text: "Afspraak succesvol verwijderd." });
      } else {
        setMessage({ type: "error", text: "Fout bij verwijderen van afspraak." });
      }
    } catch {
      setMessage({ type: "error", text: "Netwerkfout bij verwijderen van afspraak." });
    } finally {
      setApptActionLoading(null);
    }
  }

  function parseVehicleInfo(raw: string | null) {
    if (!raw) return { plate: "", brandModel: "", tyreSize: "" };
    let plate = "";
    let brandModel = "";
    let tyreSize = "";

    const plateMatch = raw.match(/\[([A-Za-z0-9\s-]+)\]/);
    if (plateMatch) {
      plate = plateMatch[1].trim();
    } else {
      const plainPlate = raw.match(/([1-9]-[A-Z]{3}-[0-9]{3}|[A-Z]{3}-[0-9]{3})/i);
      if (plainPlate) plate = plainPlate[1].toUpperCase();
    }

    const sizeMatch = raw.match(/Maat:\s*([0-9]{3}\/[0-9]{2}\s*R[0-9]{2}[A-Za-z0-9]*)/i);
    if (sizeMatch) {
      tyreSize = sizeMatch[1].trim();
    }

    const parts = raw.split(" - ");
    if (parts.length > 0 && !parts[0].startsWith("[") && !parts[0].includes("Maat:")) {
      brandModel = parts[0].trim();
      if (brandModel === "Voertuig") brandModel = "";
    }

    return { plate, brandModel, tyreSize };
  }

  function openEditApptModal(appt: AppointmentEntry) {
    const dt = new Date(appt.dateTime);
    const pad = (n: number) => String(n).padStart(2, "0");
    const datePart = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    const timePart = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    const localIso = `${datePart}T${timePart}`;
    const parsedVehicle = parseVehicleInfo(appt.vehicleInfo);

    setEditApptError("");
    setEditingAppt(appt);
    setEditApptForm({
      date: datePart,
      time: timePart,
      dateTime: localIso,
      guestName: appt.user?.name ?? appt.guestName ?? "",
      guestPhone: appt.guestPhone ?? "",
      guestEmail: appt.user?.email ?? appt.guestEmail ?? "",
      type: appt.type || "FITTING",
      status: appt.status || "CONFIRMED",
      vehiclePlate: parsedVehicle.plate,
      vehicleBrandModel: parsedVehicle.brandModel,
      tyreSize: parsedVehicle.tyreSize,
      vehicleInfo: appt.vehicleInfo || "",
      notes: appt.notes || "",
    });
  }

  async function handleSaveApptEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAppt) return;
    setSavingApptEdit(true);
    setEditApptError("");
    try {
      const plateClean = editApptForm.vehiclePlate.trim().toUpperCase();
      const modelClean = editApptForm.vehicleBrandModel.trim();
      const sizeClean = editApptForm.tyreSize.trim();

      let compiledVehicleInfo = editApptForm.vehicleInfo.trim();
      if (modelClean || plateClean || sizeClean) {
        const parts: string[] = [];
        if (modelClean) parts.push(modelClean);
        if (plateClean) parts.push(`[${plateClean}]`);
        if (sizeClean) parts.push(`Maat: ${sizeClean}`);
        compiledVehicleInfo = parts.join(" - ");
      }

      const finalDateTime = editApptForm.date && editApptForm.time
        ? `${editApptForm.date}T${editApptForm.time}:00`
        : editApptForm.dateTime || undefined;

      const res = await fetch(`/api/appointments/${editingAppt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: editApptForm.guestName.trim() || undefined,
          guestPhone: editApptForm.guestPhone.trim() || undefined,
          guestEmail: editApptForm.guestEmail.trim() || undefined,
          type: editApptForm.type,
          dateTime: finalDateTime,
          status: editApptForm.status,
          vehicleInfo: compiledVehicleInfo || null,
          notes: editApptForm.notes.trim() || null,
        }),
      });
      if (res.ok) {
        const updated: AppointmentEntry = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === editingAppt.id ? updated : a)));
        setEditingAppt(null);
        setEditApptError("");
        setMessage({ type: "success", text: "Afspraak succesvol bijgewerkt en opgeslagen!" });
      } else {
        const err = await res.json().catch(() => null);
        const errMsg = err?.error || "Fout bij bijwerken van afspraak.";
        setEditApptError(errMsg);
        setMessage({ type: "error", text: errMsg });
      }
    } catch {
      const errMsg = "Netwerkfout bij bewerken van afspraak.";
      setEditApptError(errMsg);
      setMessage({ type: "error", text: errMsg });
    } finally {
      setSavingApptEdit(false);
    }
  }

  function openNewApptModal() {
    const now = new Date();
    let tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
    if (tomorrow.getDay() === 0) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const localIso = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
    setNewApptForm({
      dateTime: localIso,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      type: "FITTING",
      vehiclePlate: "",
      vehicleBrandModel: "",
      tyreSize: "",
      tyreSource: "own",
      tyreQuantity: 2,
      selectedTyreId: "",
      bay: "Geen voorkeur",
      status: "CONFIRMED",
      notes: "",
    });
    setShowNewApptModal(true);
  }

  async function handleCreateNewAppt(e: React.FormEvent) {
    e.preventDefault();
    if (!newApptForm.dateTime || !newApptForm.guestName.trim() || !newApptForm.guestPhone.trim()) {
      alert("Vul a.u.b. een datum/tijd, klantnaam en telefoonnummer in.");
      return;
    }
    setSavingNewAppt(true);
    try {
      const email = newApptForm.guestEmail.trim() || `gast_${Date.now()}@gentbanden.be`;

      const plateClean = newApptForm.vehiclePlate.trim().toUpperCase();
      const modelClean = newApptForm.vehicleBrandModel.trim();
      const sizeClean = newApptForm.tyreSize.trim();

      const vehicleParts: string[] = [];
      if (modelClean) vehicleParts.push(modelClean);
      if (plateClean) vehicleParts.push(`[${plateClean}]`);
      if (sizeClean) vehicleParts.push(`Maat: ${sizeClean}`);
      if (newApptForm.type === "FITTING") {
        vehicleParts.push(
          newApptForm.tyreSource === "shop"
            ? `${newApptForm.tyreQuantity}x Uit stock`
            : `${newApptForm.tyreQuantity}x Eigen banden`
        );
      }
      const compiledVehicleInfo = vehicleParts.join(" - ") || null;

      const notesParts: string[] = [];
      if (newApptForm.bay && newApptForm.bay !== "Geen voorkeur") {
        notesParts.push(`[Toegewezen aan: ${newApptForm.bay}]`);
      }
      if (newApptForm.tyreSource === "shop" && newApptForm.selectedTyreId) {
        const foundTyre = tyres.find((t) => t.id === newApptForm.selectedTyreId);
        if (foundTyre) {
          const totalCost = (foundTyre.price * newApptForm.tyreQuantity).toFixed(2);
          notesParts.push(
            `[Stock Banden Aankoop: ${newApptForm.tyreQuantity}x ${foundTyre.brand} ${foundTyre.model || ""} (${foundTyre.size}) @ €${foundTyre.price}/st = €${totalCost}]`
          );
        }
      }
      if (newApptForm.notes.trim()) {
        notesParts.push(newApptForm.notes.trim());
      }
      const compiledNotes = notesParts.join("\n") || null;

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateTime: new Date(newApptForm.dateTime).toISOString(),
          guestName: newApptForm.guestName.trim(),
          guestEmail: email,
          guestPhone: newApptForm.guestPhone.trim(),
          type: newApptForm.type,
          status: newApptForm.status,
          vehicleInfo: compiledVehicleInfo,
          notes: compiledNotes,
        }),
      });
      if (res.ok) {
        const created: AppointmentEntry = await res.json();
        setAppointments((prev) => [created, ...prev]);
        setShowNewApptModal(false);
        setMessage({ type: "success", text: "Nieuwe afspraak succesvol ingepland!" });
      } else {
        const err = await res.json().catch(() => null);
        setMessage({ type: "error", text: err?.error || "Fout bij inplannen van afspraak." });
      }
    } catch {
      setMessage({ type: "error", text: "Netwerkfout bij inplannen van afspraak." });
    } finally {
      setSavingNewAppt(false);
    }
  }

  async function handleSetPrimaryImage(imageId: string) {
    if (!editingId) return;
    setImageActionLoading(true);
    try {
      const res = await fetch(`/api/tyres/${editingId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryImageId: imageId }),
      });
      if (res.ok) {
        setExistingImages((prev) =>
          prev.map((img) => ({ ...img, isPrimary: img.id === imageId }))
        );
        await fetchTyres();
      }
    } catch {
      alert("Fout bij het instellen van de hoofdfoto.");
    } finally {
      setImageActionLoading(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!editingId) return;
    if (!confirm("Weet u zeker dat u deze foto wilt verwijderen?")) return;
    setImageActionLoading(true);
    try {
      const res = await fetch(`/api/tyres/${editingId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (res.ok) {
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
        await fetchTyres();
      }
    } catch {
      alert("Fout bij het verwijderen van de foto.");
    } finally {
      setImageActionLoading(false);
    }
  }

  async function handleAddImageByUrl() {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      alert("Voer een geldige URL in (beginnend met https:// of /)");
      return;
    }

    if (editingId) {
      setImageActionLoading(true);
      try {
        const res = await fetch(`/api/tyres/${editingId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: [{ url: trimmed, fileKey: `url_${Date.now()}` }],
          }),
        });
        if (res.ok) {
          const newImgs = await res.json();
          setExistingImages((prev) => [...prev, ...newImgs]);
          setImageUrlInput("");
          await fetchTyres();
        }
      } catch {
        alert("Fout bij het toevoegen van de foto URL.");
      } finally {
        setImageActionLoading(false);
      }
    } else {
      setPendingImages((prev) => [...prev, { url: trimmed, fileKey: `url_${Date.now()}` }]);
      setImageUrlInput("");
    }
  }

  function handleDownloadTemplate(format: "xlsx" | "csv" = "xlsx") {
    const sampleData = [
      {
        Merk: "Michelin",
        Model: "Primacy 4+",
        Maat: "205/55 R16",
        Snelheidsindex: "V",
        Draagvermogen: "91",
        Seizoen: "Zomer",
        Conditie: "Nieuw",
        Prijs: 89.95,
        Voorraad: 8,
        Profieldiepte: "",
        DOT_Bouwjaar: "",
        Runflat: "Nee",
        Reinforced_XL: "Nee",
        Brandstofverbruik: "A",
        Grip_Nat: "A",
        Geluid_dB: 69,
        Foto_URLs: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f",
        Beschrijving: "Premium zomerband met uitstekende grip op nat wegdek.",
        Uitgelicht: "Nee",
      },
      {
        Merk: "Continental",
        Model: "WinterContact TS 870",
        Maat: "225/45 R17",
        Snelheidsindex: "H",
        Draagvermogen: "94",
        Seizoen: "Winter",
        Conditie: "Nieuw",
        Prijs: 115.0,
        Voorraad: 4,
        Profieldiepte: "",
        DOT_Bouwjaar: "",
        Runflat: "Nee",
        Reinforced_XL: "Ja",
        Brandstofverbruik: "C",
        Grip_Nat: "B",
        Geluid_dB: 71,
        Foto_URLs: "",
        Beschrijving: "Veilig en betrouwbaar in winterse omstandigheden.",
        Uitgelicht: "Ja",
      },
      {
        Merk: "Goodyear",
        Model: "Vector 4Seasons Gen-3",
        Maat: "195/65 R15",
        Snelheidsindex: "T",
        Draagvermogen: "91",
        Seizoen: "All-season",
        Conditie: "Tweedehands",
        Prijs: 45.0,
        Voorraad: 2,
        Profieldiepte: 6.5,
        DOT_Bouwjaar: "2023",
        Runflat: "Nee",
        Reinforced_XL: "Nee",
        Brandstofverbruik: "B",
        Grip_Nat: "B",
        Geluid_dB: 70,
        Foto_URLs: "",
        Beschrijving: "Zo goed als nieuw, 6.5mm profieldiepte DOT 2023.",
        Uitgelicht: "Nee",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Voorbeeld");

    if (format === "csv") {
      XLSX.writeFile(wb, "gent-bandenservice-voorbeeld.csv", { bookType: "csv" });
    } else {
      XLSX.writeFile(wb, "gent-bandenservice-voorbeeld.xlsx", { bookType: "xlsx" });
    }
  }

  function handleExportCatalog() {
    if (tyres.length === 0) {
      alert("Geen banden om te exporteren.");
      return;
    }
    const rows = tyres.map((t) => ({
      Merk: t.brand,
      Model: t.model,
      Maat: t.size,
      Snelheidsindex: t.speedIndex ?? "",
      Draagvermogen: t.loadIndex ?? "",
      Seizoen: SEASON_LABELS[t.season] || t.season,
      Conditie: t.condition === "NEW" ? "Nieuw" : "Tweedehands",
      Prijs: t.price,
      Voorraad: t.stock,
      Profieldiepte: t.treadDepth ?? "",
      DOT_Bouwjaar: t.dotYear ?? "",
      Runflat: t.runflat ? "Ja" : "Nee",
      Reinforced_XL: t.reinforced ? "Ja" : "Nee",
      Brandstofverbruik: t.fuelEfficiency ?? "",
      Grip_Nat: t.wetGrip ?? "",
      Geluid_dB: t.noiseLevel ?? "",
      Foto_URLs: t.images.map((i) => i.url).join(", "),
      Beschrijving: t.description ?? "",
      Uitgelicht: t.featured ? "Ja" : "Nee",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogus");
    XLSX.writeFile(wb, `gent-bandenservice-catalogus-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function processImportFile(file: File) {
    setImportError(null);
    setImportSuccess(null);
    setSelectedFileName(file.name);
    setIsParsing(true);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        setImportError("Geen werkblad gevonden in het bestand.");
        setParsedRows([]);
        setIsParsing(false);
        return;
      }
      const ws = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      if (rawRows.length === 0) {
        setImportError("Het bestand bevat geen gegevens of rijen.");
        setParsedRows([]);
        setIsParsing(false);
        return;
      }

      setParsedRows(rawRows);
    } catch {
      setImportError("Kon het bestand niet verwerken. Controleer of het een geldig Excel (.xlsx/.xls) of CSV bestand is.");
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleExecuteImport() {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    setImportError(null);

    try {
      const res = await fetch("/api/tyres/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedRows }),
      });
      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error || "Fout bij het importeren.");
      } else {
        setImportSuccess(`Succesvol ${data.count} banden geïmporteerd!`);
        await fetchTyres();
        setTimeout(() => {
          setShowImportModal(false);
          setParsedRows([]);
          setSelectedFileName("");
          setImportSuccess(null);
        }, 1600);
      }
    } catch {
      setImportError("Netwerkfout bij communicatie met de server.");
    } finally {
      setIsImporting(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setIsCustomBrand(false);
    setExistingImages([]);
    setPendingImages([]);
    setImageUrlInput("");
    setShowForm(true);
  }

  function openEdit(tyre: Tyre) {
    const isCustom = Boolean(tyre.brand && !BRANDS.includes(tyre.brand));
    setIsCustomBrand(isCustom);

    // Parse [SPECS:tag1|tag2|...] from description as fallback if legacy data exists
    const rawDesc = tyre.description ?? "";
    const specsMatch = rawDesc.match(/\[SPECS:([^\]]*)\]/);
    const specTags = specsMatch ? specsMatch[1].split("|") : [];
    const cleanDesc = rawDesc.replace(/\s*\[SPECS:[^\]]*\]\s*$/, "").trim();

    // OE marking: use db field or fallback to parsed spec tag
    const knownOeCodes: string[] = OE_MARKINGS.map((m) => m.code).filter(Boolean);
    const oeMarking = tyre.oeMarking || (specTags.find((t) => knownOeCodes.includes(t)) ?? "");

    // Tyre class: use db field or fallback to parsed spec tag
    const knownClasses: string[] = TYRE_CLASSES.map((c) => c.code).filter(Boolean);
    const tyreClass = tyre.tyreClass || (specTags.find((t) => knownClasses.includes(t)) ?? "");

    const knownPrCodes: string[] = PLY_RATINGS.map((p) => p.code).filter(Boolean);
    const plyRating = tyre.plyRating || (specTags.find((t) => knownPrCodes.includes(t)) ?? "");

    const knownLoadRanges: string[] = LOAD_RANGES.map((l) => l.code).filter(Boolean);
    const loadRange = tyre.loadRange || (specTags.find((t) => knownLoadRanges.includes(t)) ?? "");

    const knownStructures: string[] = STRUCTURE_TYPES.map((s) => s.code).filter(Boolean);
    const structureType = tyre.structureType || (specTags.find((t) => knownStructures.includes(t)) ?? "");

    setForm({
      brand: tyre.brand,
      model: tyre.model,
      size: tyre.size,
      season: tyre.season,
      condition: tyre.condition,
      price: String(tyre.price),
      stock: String(tyre.stock),
      treadDepth: tyre.treadDepth ? String(tyre.treadDepth) : "",
      speedIndex: tyre.speedIndex ?? "",
      loadIndex: tyre.loadIndex ?? "",
      dotYear: tyre.dotYear ?? "",
      runflat: tyre.runflat ?? false,
      reinforced: tyre.reinforced ?? false,
      threepmsfRated: tyre.threepmsfRated ?? false,
      msMarking: tyre.msMarking ?? false,
      selfSealing: tyre.selfSealing ?? specTags.includes("SEAL"),
      acoustic: tyre.acoustic ?? specTags.includes("ACOUSTIC"),
      electric: tyre.electric ?? specTags.includes("EV"),
      rimProtection: tyre.rimProtection ?? false,
      iceGrip: tyre.iceGrip ?? false,
      highLoad: tyre.highLoad ?? false,
      demo: tyre.demo ?? false,
      oeMarking,
      tyreClass,
      plyRating,
      loadRange,
      structureType,
      tubeless: tyre.tubeless ?? true,
      fuelEfficiency: tyre.fuelEfficiency ?? "",
      wetGrip: tyre.wetGrip ?? "",
      noiseLevel: tyre.noiseLevel ? String(tyre.noiseLevel) : "",
      description: cleanDesc,
      featured: tyre.featured,
    });
    setEditingId(tyre.id);
    setExistingImages(tyre.images ?? []);
    setPendingImages([]);
    setImageUrlInput("");
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const cleanDesc = form.description
      ? form.description.replace(/\s*\[SPECS:[^\]]*\]\s*$/, "").trim()
      : null;

    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      size: form.size.trim(),
      season: form.season,
      condition: form.condition,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      treadDepth: form.treadDepth ? parseFloat(form.treadDepth) : null,
      speedIndex: form.speedIndex ? form.speedIndex.toUpperCase().trim() : null,
      loadIndex: form.loadIndex ? form.loadIndex.trim() : null,
      dotYear: form.dotYear ? form.dotYear.trim() : null,
      runflat: Boolean(form.runflat),
      reinforced: Boolean(form.reinforced),
      threepmsfRated: Boolean(form.threepmsfRated),
      msMarking: Boolean(form.msMarking),
      selfSealing: Boolean(form.selfSealing),
      acoustic: Boolean(form.acoustic),
      electric: Boolean(form.electric),
      rimProtection: Boolean(form.rimProtection),
      iceGrip: Boolean(form.iceGrip),
      highLoad: Boolean(form.highLoad),
      demo: Boolean(form.demo),
      oeMarking: form.oeMarking || null,
      tyreClass: form.tyreClass || null,
      plyRating: form.plyRating || null,
      loadRange: form.loadRange || null,
      structureType: form.structureType || null,
      tubeless: Boolean(form.tubeless),
      fuelEfficiency: form.fuelEfficiency ? form.fuelEfficiency.toUpperCase().trim() : null,
      wetGrip: form.wetGrip ? form.wetGrip.toUpperCase().trim() : null,
      noiseLevel: form.noiseLevel ? parseInt(form.noiseLevel, 10) : null,
      description: cleanDesc || null,
      featured: form.featured,
      ...(pendingImages.length > 0 && !editingId && {
        images: pendingImages,
      }),
    };


    try {
      let tyreId = editingId;
      if (editingId) {
        const res = await fetch(`/api/tyres/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Fout bij bijwerken (status ${res.status})`);
        }
      } else {
        const res = await fetch("/api/tyres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Fout bij toevoegen (status ${res.status})`);
        }
        const newTyre = await res.json();
        tyreId = newTyre.id;
      }

      // Save pending images if editing an existing tyre
      if (pendingImages.length > 0 && tyreId && editingId) {
        await fetch(`/api/tyres/${tyreId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: pendingImages }),
        });
      }

      setMessage({ type: "success", text: editingId ? "Band bijgewerkt!" : "Band toegevoegd!" });
      setShowForm(false);
      await fetchTyres();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Er is iets misgegaan. Probeer opnieuw.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Weet u zeker dat u deze band wilt verwijderen?")) return;
    await fetch(`/api/tyres/${id}`, { method: "DELETE" });
    await fetchTyres();
  }

  if (isPending || !session || !isAdmin) {
    return (
      <div
        className="admin-loading"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <span>Verifiëren van administrator rechten...</span>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Mobile Top Navigation Bar */}
      <header className="admin-mobile-bar">
        <div className="admin-mobile-bar__brand">
          <button
            type="button"
            className="admin-mobile-bar__toggle"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            aria-label="Menu openen"
          >
            {isMobileNavOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
          <div className="admin-mobile-bar__title">
            <span>Admin</span>
            <span className="admin-mobile-bar__tab-badge">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "tyres" && "Banden"}
              {activeTab === "orders" && "Bestellingen"}
              {activeTab === "appointments" && "Afspraken"}
              {activeTab === "secondhand" && "2de hands"}
              {activeTab === "invoices" && "Facturen"}
              {activeTab === "analytics" && "Statistieken"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" className="admin-btn admin-btn--xs admin-btn--outline" title="Naar website" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
            🌐 Website
          </Link>
          <div className="admin-sidebar__avatar" style={{ width: 30, height: 30, fontSize: "0.75rem" }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop */}
      {isMobileNavOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar${isMobileNavOpen ? " admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="admin-sidebar__title">Admin Panel</div>
            <div className="admin-sidebar__sub">Gent Bandenservice</div>
          </div>
          <button
            type="button"
            className="admin-sidebar__close-btn"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Sluit menu"
          >
            ✕
          </button>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav__item${activeTab === "dashboard" ? " admin-nav__item--active" : ""}`}
            onClick={() => { setActiveTab("dashboard"); setIsMobileNavOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </button>
          <button
            className={`admin-nav__item${activeTab === "tyres" ? " admin-nav__item--active" : ""}`}
            onClick={() => { setActiveTab("tyres"); setIsMobileNavOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            Bandenbeheer
          </button>
          <button
            className={`admin-nav__item${activeTab === "orders" ? " admin-nav__item--active" : ""}`}
            onClick={() => { setActiveTab("orders"); setIsMobileNavOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Bestellingen
            {orders.filter(o => o.status === "PENDING" || o.status === "CONFIRMED").length > 0 && (
              <span style={{ marginLeft: "auto", background: "#e63946", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                {orders.filter(o => o.status === "PENDING" || o.status === "CONFIRMED").length}
              </span>
            )}
          </button>
          <button
            className={`admin-nav__item${activeTab === "appointments" ? " admin-nav__item--active" : ""}`}
            onClick={() => { setActiveTab("appointments"); setIsMobileNavOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Afspraken
            {appointments.filter(a => a.status === "PENDING").length > 0 && (
              <span style={{ marginLeft: "auto", background: "#f59e0b", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                {appointments.filter(a => a.status === "PENDING").length}
              </span>
            )}
          </button>
          <button
            className={`admin-nav__item${activeTab === "secondhand" ? " admin-nav__item--active" : ""}`}
            onClick={() => { setActiveTab("secondhand"); setIsMobileNavOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            Tweedehands Inkoop
            {secondhandSubmissions.filter(s => s.status === "PENDING").length > 0 && (
              <span style={{ marginLeft: "auto", background: "#8b5cf6", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                {secondhandSubmissions.filter(s => s.status === "PENDING").length}
              </span>
            )}
          </button>
          <button
            className={`admin-nav__item${activeTab === "invoices" ? " admin-nav__item--active" : ""}`}
            onClick={() => { setActiveTab("invoices"); setIsMobileNavOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Facturen
            {invoices.filter((i) => i.status === "PENDING").length > 0 && (
              <span style={{ marginLeft: "auto", background: "#f59e0b", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                {invoices.filter((i) => i.status === "PENDING").length}
              </span>
            )}
          </button>
          <button
            className={`admin-nav__item${activeTab === "analytics" ? " admin-nav__item--active" : ""}`}
            onClick={() => { setActiveTab("analytics"); setIsMobileNavOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Activiteit &amp; Cookies
          </button>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{session?.user?.name?.[0]?.toUpperCase() ?? "A"}</div>
            <div>
              <div className="admin-sidebar__name">{session?.user?.name}</div>
              <div className="admin-sidebar__email">{session?.user?.email}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link href="/" className="admin-btn admin-btn--sm admin-btn--outline" style={{ flex: 1, textAlign: "center" }}>
              ← Website
            </Link>
            <button
              className="admin-btn admin-btn--sm admin-btn--danger"
              onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
              style={{ flex: 1 }}
            >
              Uitloggen
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {message && (
          <div className={`admin-alert admin-alert--${message.type}`} onClick={() => setMessage(null)}>
            {message.text}
          </div>
        )}

        {/* ── DASHBOARD TAB ─────────────────────────────── */}
        {activeTab === "dashboard" && (() => {
          const pendingOrders = orders.filter(o => o.status === "PENDING" || o.status === "CONFIRMED");
          const pendingAppts = appointments.filter(a => a.status === "PENDING");
          const confirmedAppts = appointments.filter(a => a.status === "CONFIRMED");
          const totalRevenue = orders.filter(o => o.status !== "CANCELLED").reduce((s, o) => s + o.totalAmount, 0);
          const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
          const upcomingAppts = [...appointments]
            .filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED" && new Date(a.dateTime) >= new Date())
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
            .slice(0, 6);
          const inStockCount = tyres.filter(t => t.stock > 0).length;
          const lowStockCount = tyres.filter(t => t.stock > 0 && t.stock <= 2).length;
          return (
            <>
              <div className="admin-header">
                <div>
                  <h1 className="admin-page-title">Dashboard</h1>
                  <p className="admin-page-sub">Overzicht van uw bandenwerkplaats</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                    {new Date().toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* KPI stat cards */}
              <div className="admin-stats-grid">
                {/* Revenue */}
                <div style={{ background: "linear-gradient(135deg, #016eb9 0%, #0284c7 100%)", borderRadius: 14, padding: "20px 22px", color: "#fff" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8, marginBottom: 8 }}>Totale Omzet</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>€{totalRevenue.toFixed(0)}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.75, marginTop: 6 }}>{orders.filter(o => o.status !== "CANCELLED").length} afgeronde bestellingen</div>
                </div>
                {/* Active orders */}
                <div style={{ background: pendingOrders.length > 0 ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" : "#1e2535", borderRadius: 14, padding: "20px 22px", color: "#fff", border: pendingOrders.length === 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8, marginBottom: 8 }}>Open Bestellingen</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>{pendingOrders.length}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.75, marginTop: 6 }}>
                    {pendingOrders.length === 0 ? "Alles verwerkt" : "Actie vereist"}
                  </div>
                </div>
                {/* Pending appointments */}
                <div style={{ background: pendingAppts.length > 0 ? "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)" : "#1e2535", borderRadius: 14, padding: "20px 22px", color: "#fff", border: pendingAppts.length === 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8, marginBottom: 8 }}>Afspraken te Bevestigen</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>{pendingAppts.length}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.75, marginTop: 6 }}>{confirmedAppts.length} reeds bevestigd</div>
                </div>
                {/* Tyres in stock */}
                <div style={{ background: "#1e2535", borderRadius: 14, padding: "20px 22px", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8, marginBottom: 8 }}>Banden Op Voorraad</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>{inStockCount}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.75, marginTop: 6, color: lowStockCount > 0 ? "#fbbf24" : undefined }}>
                    {lowStockCount > 0 ? `${lowStockCount} bijna uitverkocht` : "Voorraad OK"}
                  </div>
                </div>
              </div>

              <div className="admin-dashboard-split-grid">
                {/* Upcoming appointments */}
                <div style={{ background: "#1a1d27", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0" }}>Aankomende Afspraken</h3>
                    <button onClick={() => setActiveTab("appointments")} style={{ background: "none", border: "none", color: "#016eb9", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>Alles bekijken →</button>
                  </div>
                  <div style={{ padding: "12px 0" }}>
                    {upcomingAppts.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px", color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>Geen komende afspraken</div>
                    ) : upcomingAppts.map(a => {
                      const sc = APPT_STATUS_CONFIG[a.status] ?? { label: a.status, cls: "admin-badge--new" };
                      const apptDate = new Date(a.dateTime);
                      const isToday = apptDate.toDateString() === new Date().toDateString();
                      const name = a.user?.name ?? a.guestName ?? "Gast";
                      return (
                        <div key={a.id} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onClick={() => setActiveTab("appointments")}>
                          <div style={{ minWidth: 48, textAlign: "center" }}>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: isToday ? "#f59e0b" : "#e2e8f0", lineHeight: 1 }}>{apptDate.getDate()}</div>
                            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>
                              {apptDate.toLocaleDateString("nl-BE", { month: "short" })}
                            </div>
                          </div>
                          <div style={{ width: 2, height: 36, background: a.status === "CONFIRMED" ? "#016eb9" : a.status === "PENDING" ? "#f59e0b" : "rgba(255,255,255,0.15)", borderRadius: 2, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                              {APPT_TYPE_LABELS[a.type] ?? a.type} · {apptDate.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <span className={`admin-badge ${sc.cls}`} style={{ fontSize: 10, padding: "2px 8px", flexShrink: 0 }}>{sc.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent orders */}
                <div style={{ background: "#1a1d27", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0" }}>Recente Bestellingen</h3>
                    <button onClick={() => setActiveTab("orders")} style={{ background: "none", border: "none", color: "#016eb9", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>Alles bekijken →</button>
                  </div>
                  <div style={{ padding: "12px 0" }}>
                    {recentOrders.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px", color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>Nog geen bestellingen</div>
                    ) : recentOrders.map(o => {
                      const sc = ORDER_STATUS_CONFIG[o.status] ?? { label: o.status, cls: "admin-badge--new" };
                      const name = o.user?.name ?? o.guestName ?? "Gast";
                      const totalTyres = o.items?.reduce((acc, it) => acc + it.quantity, 0) || 0;
                      return (
                        <div key={o.id} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onClick={() => setActiveTab("orders")}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                              {totalTyres} band{totalTyres !== 1 ? "en" : ""} · {new Date(o.createdAt).toLocaleDateString("nl-BE", { day: "2-digit", month: "short" })}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.9rem" }}>€{o.totalAmount.toFixed(2)}</div>
                            <span className={`admin-badge ${sc.cls}`} style={{ fontSize: 10, padding: "2px 8px" }}>{sc.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="admin-btn admin-btn--outline" onClick={() => setActiveTab("tyres")} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  Bandencatalogus beheren
                </button>
                <button className="admin-btn admin-btn--outline" onClick={() => { setActiveTab("tyres"); setTimeout(openCreate, 100); }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nieuwe band toevoegen
                </button>
              </div>
            </>
          );
        })()}

        {/* ── TYRES TAB ─────────────────────────────────── */}
        {activeTab === "tyres" && (
          <>
            <div className="admin-header">
              <div>
                <h1 className="admin-page-title">Bandenbeheer</h1>
                <p className="admin-page-sub">{tyres.length} banden in catalogus</p>
              </div>
              <div className="admin-header-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => {
                    setImportError(null);
                    setImportSuccess(null);
                    setParsedRows([]);
                    setSelectedFileName("");
                    setShowImportModal(true);
                  }}
                >
                  <UploadIcon />
                  <span>Importeer CSV / Excel</span>
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={handleExportCatalog}
                  title="Download de huidige catalogus als Excel-bestand"
                >
                  <DownloadIcon />
                  <span>Exporteer Excel</span>
                </button>
                <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate}>
                  + Band toevoegen
                </button>
              </div>
            </div>

            {/* ── Search & Filter Bar ── */}
            {!loading && (
              <div className="admin-filter-bar">
                <div className="admin-filter-bar__top">
                  <div className="admin-search-wrap">
                    <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <input
                      type="text"
                      className="admin-input admin-search-input"
                      placeholder="Zoeken op merk, model of maat (bv. 205/55 R16)..."
                      value={tyreSearch}
                      onChange={(e) => { setTyreSearch(e.target.value); setTyrePage(1); }}
                    />
                    {tyreSearch && (
                      <button className="admin-search-clear" onClick={() => { setTyreSearch(""); setTyrePage(1); }} title="Wissen">✕</button>
                    )}
                  </div>
                  <select
                    className="admin-select admin-filter-select"
                    value={tyreSeasonFilter}
                    onChange={(e) => { setTyreSeasonFilter(e.target.value); setTyrePage(1); }}
                  >
                    <option value="ALL">Alle seizoenen</option>
                    <option value="SUMMER">☀️ Zomer</option>
                    <option value="WINTER">❄️ Winter</option>
                    <option value="ALL_SEASON">🍂 All-season</option>
                  </select>
                  <select
                    className="admin-select admin-filter-select"
                    value={tyreConditionFilter}
                    onChange={(e) => { setTyreConditionFilter(e.target.value); setTyrePage(1); }}
                  >
                    <option value="ALL">Alle condities</option>
                    <option value="NEW">Nieuw</option>
                    <option value="USED">Tweedehands</option>
                  </select>
                  <select
                    className="admin-select admin-filter-select"
                    value={tyreStockFilter}
                    onChange={(e) => { setTyreStockFilter(e.target.value); setTyrePage(1); }}
                  >
                    <option value="ALL">Alle voorraad</option>
                    <option value="IN_STOCK">Op voorraad</option>
                    <option value="OUT_OF_STOCK">Uitverkocht</option>
                  </select>
                </div>
                <div className="admin-filter-bar__bottom">
                  <div className="admin-filter-group">
                    <span className="admin-filter-group__label">Seizoen:</span>
                    {["ALL", "SUMMER", "WINTER", "ALL_SEASON"].map((s) => (
                      <button
                        key={s}
                        className={`admin-filter-pill${tyreSeasonFilter === s ? " admin-filter-pill--active" : ""}`}
                        onClick={() => { setTyreSeasonFilter(s); setTyrePage(1); }}
                      >
                        {s === "ALL" ? "Alle" : s === "SUMMER" ? "☀️ Zomer" : s === "WINTER" ? "❄️ Winter" : "🍂 All-season"}
                        {" "}<span style={{ opacity: 0.6 }}>({(s === "ALL" ? tyres : tyres.filter((t) => t.season === s)).length})</span>
                      </button>
                    ))}
                  </div>
                  <div className="admin-filter-group">
                    <span className="admin-filter-group__label">Conditie:</span>
                    {["ALL", "NEW", "USED"].map((c) => (
                      <button
                        key={c}
                        className={`admin-filter-pill${tyreConditionFilter === c ? " admin-filter-pill--active" : ""}`}
                        onClick={() => { setTyreConditionFilter(c); setTyrePage(1); }}
                      >
                        {c === "ALL" ? "Alle" : c === "NEW" ? "Nieuw" : "2e hands"}
                        {" "}<span style={{ opacity: 0.6 }}>({(c === "ALL" ? tyres : tyres.filter((t) => t.condition === c)).length})</span>
                      </button>
                    ))}
                  </div>
                  {(tyreSearch || tyreSeasonFilter !== "ALL" || tyreConditionFilter !== "ALL" || tyreStockFilter !== "ALL") && (
                    <button
                      className="admin-filter-reset-btn"
                      onClick={() => { setTyreSearch(""); setTyreSeasonFilter("ALL"); setTyreConditionFilter("ALL"); setTyreStockFilter("ALL"); setTyrePage(1); }}
                    >
                      ✕ Filters wissen
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CSV / Excel Bulk Import Modal */}
            {showImportModal && (
              <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowImportModal(false); }}>
                <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-modal__header">
                    <h2 className="admin-modal__title">Banden importeren (CSV of Excel)</h2>
                    <button className="admin-modal__close" onClick={() => setShowImportModal(false)}>✕</button>
                  </div>

                  <div className="admin-modal__body">
                    {/* Template download helper box */}
                    <div className="admin-import-template-box">
                      <div className="admin-import-template-text">
                        <strong>Nog geen bestand klaar?</strong> Download ons voorbeeldsjabloon met de juiste kolommen.
                      </div>
                      <div className="admin-import-template-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--xs admin-btn--outline"
                          onClick={() => handleDownloadTemplate("xlsx")}
                        >
                          Voorbeeld Excel (.xlsx)
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--xs admin-btn--outline"
                          onClick={() => handleDownloadTemplate("csv")}
                        >
                          Voorbeeld CSV (.csv)
                        </button>
                      </div>
                    </div>

                    {/* Drag and drop zone */}
                    <div
                      className={`admin-import-dropzone${isDragging ? " admin-import-dropzone--dragging" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processImportFile(file);
                      }}
                    >
                      <input
                        type="file"
                        className="admin-import-input"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processImportFile(file);
                        }}
                      />
                      <div className="admin-import-icon">
                        <UploadIcon width={24} height={24} />
                      </div>
                      <div className="admin-import-text">
                        Sleep uw Excel of CSV bestand hierheen, of <span style={{ color: "#38bdf8", textDecoration: "underline" }}>klik om te bladeren</span>
                      </div>
                      <div className="admin-import-sub">
                        Ondersteunt .xlsx, .xls en .csv bestanden
                      </div>
                    </div>

                    {/* Status notifications */}
                    {isParsing && (
                      <p style={{ marginTop: 12, color: "#94a3b8", fontSize: "0.875rem" }}>
                        Bestand analyseren...
                      </p>
                    )}

                    {importError && (
                      <div className="admin-alert admin-alert--error" style={{ marginTop: 14 }}>
                        {importError}
                      </div>
                    )}

                    {importSuccess && (
                      <div className="admin-alert admin-alert--success" style={{ marginTop: 14 }}>
                        {importSuccess}
                      </div>
                    )}

                    {/* File loaded preview */}
                    {selectedFileName && parsedRows.length > 0 && (
                      <>
                        <div className="admin-import-fileinfo">
                          <div className="admin-import-fileinfo-left">
                            <span>📄</span>
                            <div>
                              <strong>{selectedFileName}</strong>
                              <div><span>{parsedRows.length} banden gevonden in bestand</span></div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="admin-btn admin-btn--xs admin-btn--danger"
                            onClick={() => {
                              setParsedRows([]);
                              setSelectedFileName("");
                              setImportError(null);
                            }}
                          >
                            Bestand wissen
                          </button>
                        </div>

                        {/* Preview table (first 5 rows) */}
                        <div className="admin-import-preview-wrap">
                          <table className="admin-import-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Merk</th>
                                <th>Model</th>
                                <th>Maat</th>
                                <th>Seizoen</th>
                                <th>Conditie</th>
                                <th>Prijs (€)</th>
                                <th>Voorraad</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedRows.slice(0, 5).map((row, i) => (
                                <tr key={i}>
                                  <td>{i + 1}</td>
                                  <td><strong>{String(row.brand || row.Merk || row.merk || "-")}</strong></td>
                                  <td>{String(row.model || row.Model || "-")}</td>
                                  <td>{String(row.size || row.Maat || row.maat || "-")}</td>
                                  <td>{String(row.season || row.Seizoen || row.seizoen || "Zomer")}</td>
                                  <td>{String(row.condition || row.Conditie || row.Staat || row.staat || "Nieuw")}</td>
                                  <td>€ {String(row.price || row.Prijs || row.prijs || "0")}</td>
                                  <td>{String(row.stock || row.Voorraad || row.voorraad || row.aantal || "4")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {parsedRows.length > 5 && (
                          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
                            + nog {parsedRows.length - 5} rijen in bestand...
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="admin-modal__footer">
                    <button
                      type="button"
                      className="admin-btn admin-btn--outline"
                      onClick={() => setShowImportModal(false)}
                      disabled={isImporting}
                    >
                      Sluiten
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={handleExecuteImport}
                      disabled={isImporting || parsedRows.length === 0}
                    >
                      {isImporting ? "Bezig met importeren..." : `Start import (${parsedRows.length} banden)`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Modal */}
            {showForm && (
              <div
                className="admin-modal-overlay"
                onClick={(e) => {
                  // Only close if clicking the backdrop directly (not children)
                  if (e.target === e.currentTarget) setShowForm(false);
                }}
              >
                <form
                  className="admin-modal admin-modal--tyre-form"
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="admin-modal__header">
                    <h2 className="admin-modal__title">
                      {editingId ? "Band bewerken" : "Nieuwe band toevoegen"}
                    </h2>
                    <button type="button" className="admin-modal__close" onClick={() => setShowForm(false)}>✕</button>
                  </div>

                  <div className="admin-modal__body">
                    <div className="admin-form-grid">
                      {/* Section 1: Basis */}
                      <div className="admin-form-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                        <div className="admin-form-section-title">
                          <span>1. Basisinformatie</span>
                        </div>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Merk *</label>
                        <select
                          className="admin-select"
                          value={isCustomBrand ? "__custom__" : (BRANDS.includes(form.brand) ? form.brand : "")}
                          onChange={(e) => {
                            if (e.target.value === "__custom__") {
                              setIsCustomBrand(true);
                              setForm({ ...form, brand: "" });
                            } else {
                              setIsCustomBrand(false);
                              setForm({ ...form, brand: e.target.value });
                            }
                          }}
                        >
                          <option value="">— Selecteer merk —</option>
                          {BRAND_GROUPS.map((group) => (
                            <optgroup key={group.label} label={`── ${group.label} ──`}>
                              {group.brands.map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </optgroup>
                          ))}
                          <option value="__custom__">✏️ Anders (zelf invullen)…</option>
                        </select>

                        {/* Custom brand input — shown when user selects 'Anders' or brand is custom */}
                        {isCustomBrand && (
                          <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              type="text"
                              className="admin-input"
                              placeholder="Typ merknaam (bv. Falken, Nankang, etc.)…"
                              value={form.brand}
                              onChange={(e) => setForm({ ...form, brand: e.target.value })}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              style={{ padding: "6px 12px", fontSize: "0.8125rem", whiteSpace: "nowrap" }}
                              onClick={() => {
                                setIsCustomBrand(false);
                                setForm({ ...form, brand: "" });
                              }}
                              title="Terug naar merkenlijst"
                            >
                              Kies uit lijst
                            </button>
                          </div>
                        )}
                      </div>


                      <div className="admin-field">
                        <label className="admin-label">Model *</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="bijv. Primacy 4+"
                          value={form.model}
                          onChange={(e) => setForm({ ...form, model: e.target.value })}
                        />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Bandenmaat *</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="bijv. 205/55 R16"
                          value={form.size}
                          onChange={(e) => setForm({ ...form, size: e.target.value })}
                        />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Seizoen</label>
                        <select
                          className="admin-select"
                          value={form.season}
                          onChange={(e) => setForm({ ...form, season: e.target.value })}
                        >
                          {SEASONS.map((s) => (
                            <option key={s} value={s}>{SEASON_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Conditie</label>
                        <select
                          className="admin-select"
                          value={form.condition}
                          onChange={(e) => setForm({ ...form, condition: e.target.value })}
                        >
                          <option value="NEW">Nieuw</option>
                          <option value="USED">Tweedehands</option>
                        </select>
                      </div>

                      {/* Section 2: Prijs & Voorraad */}
                      <div className="admin-form-section">
                        <div className="admin-form-section-title">
                          <span>2. Prijs & Voorraad</span>
                        </div>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Prijs (€) *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="admin-input"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                      </div>

                      <div className="admin-field admin-field--full" style={{ background: "rgba(255,255,255,0.03)", padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 8 }}>
                        <label className="admin-label admin-label--checkbox" style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
                          <input
                            type="checkbox"
                            checked={parseInt(form.stock || "0", 10) > 0}
                            onChange={(e) => {
                              const isAvail = e.target.checked;
                              setForm({ ...form, stock: isAvail ? (parseInt(form.stock || "0", 10) > 0 ? form.stock : "4") : "0" });
                            }}
                            className="admin-checkbox"
                          />
                          <span>
                            🟢 Direct op voorraad / Available (Klant kan al vanaf <strong style={{ color: "#34d399" }}>morgen</strong> afspraak maken)
                          </span>
                        </label>
                        <p style={{ margin: "6px 0 0 28px", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                          <strong>Aan (In Stock):</strong> Band ligt fysiek in de werkplaats — afspraak is morgen al mogelijk.<br />
                          <strong>Uit (Op Bestelling):</strong> Wordt besteld via leverancier (2–3 werkdagen, weekend 4–5 dagen). Afspraakdatum start automatisch na levertijd.
                        </p>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Voorraad aantal (stuks in stock)</label>
                        <input
                          type="number"
                          min="0"
                          className="admin-input"
                          value={form.stock}
                          onChange={(e) => setForm({ ...form, stock: e.target.value })}
                          placeholder="0 = op bestelling, >0 = direct op voorraad"
                        />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">
                          Profieldiepte (mm)
                          {form.condition === "USED" && <span style={{ color: "#f59e0b", marginLeft: 4 }}>* (2de hands)</span>}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          className="admin-input"
                          placeholder="bijv. 6.5"
                          value={form.treadDepth}
                          onChange={(e) => setForm({ ...form, treadDepth: e.target.value })}
                        />
                      </div>

                      {/* Section 3: Bandspecificaties & EU Labels */}
                      <div className="admin-form-section">
                        <div className="admin-form-section-title">
                          <span>3. Bandspecificaties & EU Labels</span>
                        </div>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Snelheidsindex</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="bijv. V, W, Y, H, T"
                          value={form.speedIndex}
                          onChange={(e) => setForm({ ...form, speedIndex: e.target.value })}
                        />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Draagvermogen (Load Index)</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="bijv. 91, 94, 102"
                          value={form.loadIndex}
                          onChange={(e) => setForm({ ...form, loadIndex: e.target.value })}
                        />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">
                          DOT / Productiejaar
                          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginLeft: 4 }}>
                            (bv. 2023)
                          </span>
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="bijv. 2023"
                          value={form.dotYear}
                          onChange={(e) => setForm({ ...form, dotYear: e.target.value })}
                        />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Brandstofefficiëntie (EU)</label>
                        <select
                          className="admin-select"
                          value={form.fuelEfficiency}
                          onChange={(e) => setForm({ ...form, fuelEfficiency: e.target.value })}
                        >
                          <option value="">Niet gespecificeerd</option>
                          <option value="A">Klasse A</option>
                          <option value="B">Klasse B</option>
                          <option value="C">Klasse C</option>
                          <option value="D">Klasse D</option>
                          <option value="E">Klasse E</option>
                        </select>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Grip nat wegdek (EU)</label>
                        <select
                          className="admin-select"
                          value={form.wetGrip}
                          onChange={(e) => setForm({ ...form, wetGrip: e.target.value })}
                        >
                          <option value="">Niet gespecificeerd</option>
                          <option value="A">Klasse A</option>
                          <option value="B">Klasse B</option>
                          <option value="C">Klasse C</option>
                          <option value="D">Klasse D</option>
                          <option value="E">Klasse E</option>
                        </select>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Geluidsniveau (dB)</label>
                        <input
                          type="number"
                          min="50"
                          max="90"
                          className="admin-input"
                          placeholder="bijv. 71"
                          value={form.noiseLevel}
                          onChange={(e) => setForm({ ...form, noiseLevel: e.target.value })}
                        />
                      </div>

                      <div className="admin-field admin-field--full">
                        <label className="admin-label" style={{ marginBottom: 10 }}>Bandspecificaties &amp; Kenmerken</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px 24px" }}>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.runflat}
                              onChange={(e) => setForm({ ...form, runflat: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🔵 Runflat (RFT / SSR / ZP / Noodloopband)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.reinforced}
                              onChange={(e) => setForm({ ...form, reinforced: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🔶 Extra Load / XL / EL (versterkt)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.highLoad}
                              onChange={(e) => setForm({ ...form, highLoad: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🏋️ High Load (HL — extra zwaar voor EV/SUV)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.rimProtection}
                              onChange={(e) => setForm({ ...form, rimProtection: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🛡️ Velgbescherming (FSL / MFS / FR / RPB / FP)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.threepmsfRated}
                              onChange={(e) => setForm({ ...form, threepmsfRated: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🏔️ 3PMSF (Alpine wintercertificering)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.msMarking}
                              onChange={(e) => setForm({ ...form, msMarking: e.target.checked })}
                              className="admin-checkbox"
                            />
                            ❄️ M+S (Modder &amp; Sneeuw markering)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.iceGrip}
                              onChange={(e) => setForm({ ...form, iceGrip: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🧊 Noordse winterband / Ijsgrip (Nordic ISO 19447)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.selfSealing}
                              onChange={(e) => setForm({ ...form, selfSealing: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🛡️ Zelfdichtend (SEAL / SealGuard / ContiSeal)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.acoustic}
                              onChange={(e) => setForm({ ...form, acoustic: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🔇 Geluidsdemping (Acoustic / PNCS / Silent)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.electric}
                              onChange={(e) => setForm({ ...form, electric: e.target.checked })}
                              className="admin-checkbox"
                            />
                            ⚡ EV / EVC / EVR (Electric Vehicle / Ready / Compatible)
                          </label>
                          <label className="admin-label admin-label--checkbox">
                            <input
                              type="checkbox"
                              checked={form.demo}
                              onChange={(e) => setForm({ ...form, demo: e.target.checked })}
                              className="admin-checkbox"
                            />
                            🏷️ Demoband (Nieuw gedemonteerd 0-50 km)
                          </label>
                        </div>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">OEM / Homologatie markering</label>
                        <select
                          className="admin-select"
                          value={form.oeMarking}
                          onChange={(e) => setForm({ ...form, oeMarking: e.target.value })}
                        >
                          {OE_MARKINGS.map((m) => (
                            <option key={m.code || "none"} value={m.code}>{m.label}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 4, display: "block" }}>
                          OEM-markering geldig voor specifiek automerk: MO=Mercedes, AO=Audi, *=BMW, N0=Porsche…
                        </span>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Voertuigtype / Bandklasse</label>
                        <select
                          className="admin-select"
                          value={form.tyreClass}
                          onChange={(e) => setForm({ ...form, tyreClass: e.target.value })}
                        >
                          {TYRE_CLASSES.map((c) => (
                            <option key={c.code || "std"} value={c.code}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Ply Rating (PR — Lagen)</label>
                        <select
                          className="admin-select"
                          value={form.plyRating}
                          onChange={(e) => setForm({ ...form, plyRating: e.target.value })}
                        >
                          {PLY_RATINGS.map((p) => (
                            <option key={p.code || "std"} value={p.code}>{p.label}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 4, display: "block" }}>
                          Karkassterkte voor bestelwagens/vracht: 8PR, 10PR, 12PR...
                        </span>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Constructietype / Structuur (S1, SL, RF...)</label>
                        <select
                          className="admin-select"
                          value={form.structureType}
                          onChange={(e) => setForm({ ...form, structureType: e.target.value })}
                        >
                          {STRUCTURE_TYPES.map((s) => (
                            <option key={s.code || "std"} value={s.code}>{s.label}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 4, display: "block" }}>
                          Specifieke constructies zoals S1, SL (Standard Load), TL/TT of belettering (BSW/OWL)
                        </span>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Load Range letter</label>
                        <select
                          className="admin-select"
                          value={form.loadRange}
                          onChange={(e) => setForm({ ...form, loadRange: e.target.value })}
                        >
                          {LOAD_RANGES.map((l) => (
                            <option key={l.code || "std"} value={l.code}>{l.label}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 4, display: "block" }}>
                          Commerciële/Amerikaanse aanduiding: B, C, D (≈ 8PR), E (≈ 10PR)
                        </span>
                      </div>

                      <div className="admin-field admin-field--full">
                        <label className="admin-label admin-label--checkbox">
                          <input
                            type="checkbox"
                            checked={form.tubeless}
                            onChange={(e) => setForm({ ...form, tubeless: e.target.checked })}
                            className="admin-checkbox"
                          />
                          🔄 TL — Tubeless (band zonder binnenband, standaard voor 99% moderne wagens)
                        </label>
                      </div>

                      {/* Section 4: Foto's */}
                      <div className="admin-form-section">
                        <div className="admin-form-section-title">
                          <span>4. Foto&apos;s & Galerij</span>
                        </div>
                      </div>

                      <div className="admin-field admin-field--full">
                        {/* Existing Saved Photos */}
                        {existingImages.length > 0 && (
                          <div className="admin-existing-imgs">
                            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", margin: "0 0 8px", fontWeight: 600 }}>
                              Huidige foto&apos;s ({existingImages.length}):
                            </p>
                            <div className="admin-img-gallery-grid">
                              {existingImages.map((img) => (
                                <div
                                  key={img.id}
                                  className={`admin-img-card ${img.isPrimary ? "admin-img-card--primary" : ""}`}
                                >
                                  {img.isPrimary && (
                                    <span className="admin-img-card-badge">Hoofdfoto</span>
                                  )}
                                  <Image
                                    src={img.url}
                                    alt="Tyre foto"
                                    width={120}
                                    height={90}
                                    className="admin-img-card-thumb"
                                  />
                                  <div className="admin-img-card-actions">
                                    {!img.isPrimary && (
                                      <button
                                        type="button"
                                        className="admin-img-btn"
                                        disabled={imageActionLoading}
                                        onClick={() => handleSetPrimaryImage(img.id)}
                                      >
                                        Maak primair
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="admin-img-btn admin-img-btn--danger"
                                      disabled={imageActionLoading}
                                      onClick={() => handleDeleteImage(img.id)}
                                    >
                                      Verwijder
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add via URL */}
                        <div style={{ marginBottom: 16 }}>
                          <label className="admin-label" style={{ marginBottom: 6 }}>
                            Foto toevoegen via link / URL
                          </label>
                          <div className="admin-url-input-row">
                            <input
                              type="text"
                              className="admin-input"
                              placeholder="https://domein.com/band-foto.jpg"
                              value={imageUrlInput}
                              onChange={(e) => setImageUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddImageByUrl();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline"
                              onClick={handleAddImageByUrl}
                              disabled={!imageUrlInput.trim() || imageActionLoading}
                            >
                              Toevoegen
                            </button>
                          </div>
                        </div>

                        {/* Upload section: Dropzone (drag-and-drop + browse) + Paste zone */}
                        <div className="admin-upload-section" ref={uploadZoneRef}>
                          <h4 className="admin-upload-title">
                            Foto&apos;s uploaden
                            <span className="admin-upload-hint">(sleep, plak met Ctrl+V, of klik om te bladeren — max. 10)</span>
                          </h4>

                          {/* Dedicated camera / file picker button (optimized for iPhone) */}
                          <div style={{ marginBottom: 10 }}>
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "10px 18px",
                                background: "linear-gradient(135deg, #016eb9 0%, #0b192c 100%)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                borderRadius: 10,
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor: isPasting ? "not-allowed" : "pointer",
                                boxShadow: "0 4px 14px rgba(1, 110, 185, 0.3)",
                                transition: "all 150ms ease",
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                              <span>{isPasting ? "Foto's optimaliseren & uploaden…" : "📷 Foto nemen met camera of fotobibliotheek (Auto-compressie)"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                multiple
                                style={{ display: "none" }}
                                disabled={isPasting}
                                onChange={async (e) => {
                                  if (!e.target.files || e.target.files.length === 0) return;
                                  const files = Array.from(e.target.files);
                                  setIsPasting(true);
                                  setMessage({ type: "success", text: "Foto's comprimeren (MB's verkleinen voor snelle upload)..." });
                                  try {
                                    const { files: compressed, summary } = await compressImages(files);
                                    if (summary) {
                                      setMessage({ type: "success", text: `⚡ ${summary} — uploaden...` });
                                    }
                                    startUpload(compressed);
                                  } catch (err) {
                                    console.error("Camera upload error:", err);
                                    startUpload(files);
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>

                          {/* Paste / clipboard hint bar */}
                          <div
                            className={`admin-paste-zone${isPasting ? " admin-paste-zone--loading" : ""}${isPasteDragOver ? " admin-paste-zone--over" : ""}`}
                            onDragOver={(e) => { e.preventDefault(); setIsPasteDragOver(true); }}
                            onDragLeave={() => setIsPasteDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsPasteDragOver(false);
                              const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
                              if (files.length > 0) {
                                setIsPasting(true);
                                setMessage({ type: "success", text: "Foto's comprimeren..." });
                                compressImages(files).then(({ files: compressed, summary }) => {
                                  if (summary) setMessage({ type: "success", text: `⚡ ${summary} — uploaden...` });
                                  startUpload(compressed);
                                }).catch(() => startUpload(files));
                              }
                            }}
                          >
                            {isPasting ? (
                              <span className="admin-paste-spinner" />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="2" width="6" height="4" rx="1" />
                                <path d="M5 4h2a1 1 0 0 1 1 1v1h8V5a1 1 0 0 1 1-1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                              </svg>
                            )}
                            <span>{isPasting ? "Comprimeren & uploaden…" : "Plak afbeelding (Ctrl+V) of sleep hier naartoe"}</span>
                          </div>

                          {/* UploadDropzone: browse + drag-and-drop with auto compression */}
                          <UploadDropzone
                            endpoint="tyreImages"
                            onBeforeUploadBegin={async (files) => {
                              setMessage({ type: "success", text: "Foto's comprimeren..." });
                              try {
                                const { files: compressed, summary } = await compressImages(files);
                                if (summary) {
                                  setMessage({ type: "success", text: `⚡ ${summary} — uploaden naar server...` });
                                }
                                return compressed;
                              } catch (err) {
                                console.warn("[UploadDropzone] Compression fallback:", err);
                                return files;
                              }
                            }}
                            onClientUploadComplete={(res) => {
                              console.log("[Upload] complete:", res);
                              onUploadDone(res);
                            }}
                            onUploadError={(error) => {
                              console.error("[Upload] error:", error);
                              setMessage({ type: "error", text: `Upload fout: ${error.message}` });
                            }}
                            onUploadBegin={() => setMessage(null)}
                            className="admin-dropzone"
                          />
                          {pendingImages.length > 0 && (
                            <div className="admin-pending-imgs">
                              <p className="admin-pending-label">
                                {pendingImages.length} nieuwe foto{pendingImages.length !== 1 ? "'s" : ""} klaar om op te slaan
                              </p>
                              <div className="admin-img-preview-row">
                                {pendingImages.map((img, i) => (
                                  <div key={i} className="admin-img-thumb">
                                    <Image
                                      src={img.url}
                                      alt={`preview-${i}`}
                                      width={80}
                                      height={80}
                                      style={{ objectFit: "cover", borderRadius: 8 }}
                                    />
                                    <button
                                      type="button"
                                      className="admin-img-remove"
                                      onClick={() => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 5: Beschrijving & Uitgelicht */}
                      <div className="admin-form-section">
                        <div className="admin-form-section-title">
                          <span>5. Beschrijving & Publicatie</span>
                        </div>
                      </div>

                      <div className="admin-field admin-field--full">
                        <label className="admin-label">Beschrijving</label>
                        <textarea
                          className="admin-textarea"
                          rows={3}
                          placeholder="Optionele beschrijving of bijzonderheden..."
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label admin-label--checkbox">
                          <input
                            type="checkbox"
                            checked={form.featured}
                            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                            className="admin-checkbox"
                          />
                          Uitgelicht op homepage
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="admin-modal__footer">
                    <button type="button" className="admin-btn admin-btn--outline" onClick={() => setShowForm(false)}>
                      Annuleren
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={handleSave}
                      disabled={saving || !form.brand || !form.model || !form.size || !form.price}
                    >
                      {saving ? "Opslaan..." : editingId ? "Bijwerken" : "Toevoegen"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tyres Table */}
            {loading ? (
              <div className="admin-loading">Laden...</div>
            ) : (() => {
              // Apply filters
              const q = tyreSearch.toLowerCase().trim();
              const filtered = tyres.filter((t) => {
                if (tyreSeasonFilter !== "ALL" && t.season !== tyreSeasonFilter) return false;
                if (tyreConditionFilter !== "ALL" && t.condition !== tyreConditionFilter) return false;
                if (tyreStockFilter === "IN_STOCK" && t.stock === 0) return false;
                if (tyreStockFilter === "OUT_OF_STOCK" && t.stock > 0) return false;
                if (q) {
                  const normQ = q.replace(/[\s/-]/g, "");
                  const normSize = t.size.toLowerCase().replace(/[\s/-]/g, "");
                  return (
                    t.brand.toLowerCase().includes(q) ||
                    t.model.toLowerCase().includes(q) ||
                    t.size.toLowerCase().includes(q) ||
                    normSize.includes(normQ) ||
                    `${t.brand} ${t.model}`.toLowerCase().includes(q)
                  );
                }
                return true;
              });

              const totalPages = Math.max(1, Math.ceil(filtered.length / TYRES_PER_PAGE));
              const safePage = Math.min(tyrePage, totalPages);
              const pageItems = filtered.slice((safePage - 1) * TYRES_PER_PAGE, safePage * TYRES_PER_PAGE);

              return (
                <>
                  {/* Table scroll hint for touch/mobile */}
                  <div className="admin-table-scroll-hint">
                    <span>↔️</span> Veeg horizontaal om alle kolommen te bekijken
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Foto</th>
                          <th>Merk / Model</th>
                          <th>Maat & Specificaties</th>
                          <th>Seizoen</th>
                          <th>Conditie</th>
                          <th>Prijs</th>
                          <th>Voorraad</th>
                          <th>Acties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((t) => {
                          const primaryImg = t.images.find((i) => i.isPrimary) ?? t.images[0];
                          const speedLoad = [t.loadIndex, t.speedIndex].filter(Boolean).join("");
                          return (
                            <tr key={t.id}>
                              <td>
                                {primaryImg ? (
                                  <Image
                                    src={primaryImg.url}
                                    alt={t.brand}
                                    width={54}
                                    height={54}
                                    style={{ objectFit: "cover", borderRadius: 8 }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 54,
                                      height: 54,
                                      borderRadius: 8,
                                      background: "rgba(255,255,255,0.05)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "rgba(255,255,255,0.3)",
                                    }}
                                  >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="9" />
                                      <circle cx="12" cy="12" r="3" />
                                      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
                                    </svg>
                                  </div>
                                )}
                              </td>
                              <td>
                                <div className="admin-table__name">{t.brand}</div>
                                <div className="admin-table__sub">{t.model}</div>
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <div>
                                    <code className="admin-code">{t.size}</code>
                                    {speedLoad && (
                                      <span style={{ marginLeft: 6, fontWeight: 700, fontSize: "0.8125rem", color: "#e2e8f0" }}>
                                        {speedLoad}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {t.dotYear && (
                                      <span className="admin-spec-pill admin-spec-pill--dot">
                                        DOT &apos;{t.dotYear.slice(-2)}
                                      </span>
                                    )}
                                    {t.reinforced && (
                                      <span className="admin-spec-pill admin-spec-pill--xl" data-tooltip={getSpecTooltip("XL")} title={getSpecTooltip("XL")}>XL</span>
                                    )}
                                    {t.highLoad && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(249, 115, 22, 0.2)", color: "#fb923c", borderColor: "rgba(249, 115, 22, 0.4)" }} data-tooltip={getSpecTooltip("HL")} title={getSpecTooltip("HL")}>HL</span>
                                    )}
                                    {t.runflat && (
                                      <span className="admin-spec-pill admin-spec-pill--rft" data-tooltip={getSpecTooltip("Runflat")} title={getSpecTooltip("Runflat")}>RFT</span>
                                    )}
                                    {t.rimProtection && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.4)" }} data-tooltip={getSpecTooltip("Velgbescherming")} title={getSpecTooltip("Velgbescherming")}>FSL</span>
                                    )}
                                    {t.threepmsfRated && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.4)" }} data-tooltip={getSpecTooltip("3PMSF")} title={getSpecTooltip("3PMSF")}>3PMSF</span>
                                    )}
                                    {t.msMarking && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(148, 163, 184, 0.2)", color: "#cbd5e1", borderColor: "rgba(148, 163, 184, 0.4)" }} data-tooltip={getSpecTooltip("M+S")} title={getSpecTooltip("M+S")}>M+S</span>
                                    )}
                                    {t.iceGrip && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(6, 182, 212, 0.2)", color: "#22d3ee", borderColor: "rgba(6, 182, 212, 0.4)" }} data-tooltip={getSpecTooltip("Nordic")} title={getSpecTooltip("Nordic")}>🧊 Nordic</span>
                                    )}
                                    {t.electric && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(234, 179, 8, 0.2)", color: "#facc15", borderColor: "rgba(234, 179, 8, 0.4)" }} data-tooltip={getSpecTooltip("EV")} title={getSpecTooltip("EV")}>⚡ EV</span>
                                    )}
                                    {t.demo && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(236, 72, 153, 0.2)", color: "#f472b6", borderColor: "rgba(236, 72, 153, 0.4)" }} data-tooltip={getSpecTooltip("Demo")} title={getSpecTooltip("Demo")}>Demo</span>
                                    )}
                                    {t.oeMarking && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.4)" }} data-tooltip={getSpecTooltip(t.oeMarking)} title={getSpecTooltip(t.oeMarking)}>{t.oeMarking}</span>
                                    )}
                                    {t.tyreClass && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(14, 165, 233, 0.2)", color: "#38bdf8", borderColor: "rgba(14, 165, 233, 0.4)" }} data-tooltip={getSpecTooltip(t.tyreClass)} title={getSpecTooltip(t.tyreClass)}>{t.tyreClass}</span>
                                    )}
                                    {t.plyRating && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.4)" }} data-tooltip={getSpecTooltip(t.plyRating)} title={getSpecTooltip(t.plyRating)}>{t.plyRating}</span>
                                    )}
                                    {t.structureType && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(99, 102, 241, 0.2)", color: "#818cf8", borderColor: "rgba(99, 102, 241, 0.4)" }} data-tooltip={getSpecTooltip(t.structureType)} title={getSpecTooltip(t.structureType)}>{t.structureType}</span>
                                    )}
                                    {t.loadRange && (
                                      <span className="admin-spec-pill" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.4)" }} data-tooltip={getSpecTooltip(`Range ${t.loadRange}`)} title={getSpecTooltip(`Range ${t.loadRange}`)}>Range {t.loadRange}</span>
                                    )}
                                    {(t.fuelEfficiency || t.wetGrip) && (
                                      <span className="admin-spec-pill" data-tooltip={getSpecTooltip("EU")} title={getSpecTooltip("EU")}>
                                        EU: {t.fuelEfficiency || "-"}/{t.wetGrip || "-"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>{SEASON_LABELS[t.season] ?? t.season}</td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                  <span className={`admin-badge admin-badge--${t.condition === "NEW" ? "new" : "used"}`}>
                                    {t.condition === "NEW" ? "Nieuw" : "2de hands"}
                                  </span>
                                  {t.treadDepth && (
                                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                                      {t.treadDepth} mm
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td><strong>€{t.price.toFixed(2)}</strong></td>
                              <td>
                                <span className={t.stock === 0 ? "admin-table__oos" : "admin-table__stock"}>
                                  {t.stock === 0 ? "Op bestelling (2–3d)" : `In stock (${t.stock} st.)`}
                                </span>
                              </td>
                              <td>
                                <div className="admin-table__actions">
                                  <button className="admin-btn admin-btn--xs admin-btn--outline" onClick={() => openEdit(t)}>
                                    Bewerken
                                  </button>
                                  <button className="admin-btn admin-btn--xs admin-btn--danger" onClick={() => handleDelete(t.id)}>
                                    Verwijder
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {filtered.length === 0 && (
                      <div className="admin-empty">
                        {tyres.length === 0 ? (
                          <p>Nog geen banden. Klik op &quot;Band toevoegen&quot; om te starten.</p>
                        ) : (
                          <>
                            <p style={{ marginBottom: 12 }}>Geen banden gevonden voor de huidige filters.</p>
                            <button
                              className="admin-btn admin-btn--outline"
                              onClick={() => { setTyreSearch(""); setTyreSeasonFilter("ALL"); setTyreConditionFilter("ALL"); setTyreStockFilter("ALL"); setTyrePage(1); }}
                            >
                              Filters wissen
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {filtered.length > TYRES_PER_PAGE && (
                    <div className="admin-pagination">
                      <span className="admin-pagination__info">
                        {filtered.length} banden · pagina {safePage} van {totalPages}
                        {tyreSearch || tyreSeasonFilter !== "ALL" || tyreConditionFilter !== "ALL" || tyreStockFilter !== "ALL"
                          ? ` (gefilterd uit ${tyres.length} totaal)`
                          : ""}
                      </span>
                      <div className="admin-pagination__actions">
                        <button
                          className="admin-pagination__btn"
                          disabled={safePage === 1}
                          onClick={() => setTyrePage((p) => Math.max(1, p - 1))}
                        >
                          ← Vorige
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                          .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((item, i) =>
                            item === "..." ? (
                              <span key={`ellipsis-${i}`} className="admin-pagination__ellipsis">…</span>
                            ) : (
                              <button
                                key={item}
                                className={`admin-pagination__btn${safePage === item ? " admin-pagination__btn--active" : ""}`}
                                onClick={() => setTyrePage(item as number)}
                              >
                                {item}
                              </button>
                            )
                          )}
                        <button
                          className="admin-pagination__btn"
                          disabled={safePage === totalPages}
                          onClick={() => setTyrePage((p) => Math.min(totalPages, p + 1))}
                        >
                          Volgende →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* ── ORDERS TAB ────────────────────────────────── */}
        {activeTab === "orders" && (() => {
          const ordersWithReturns = orders.filter((o) => o.returnRequests && o.returnRequests.length > 0);
          const pendingReturns = orders.filter((o) => o.returnRequests?.some((r) => r.status === "PENDING"));

          const filteredOrders = orders.filter((o) => {
            if (orderStatusFilter === "RETURNS") {
              if (!o.returnRequests || o.returnRequests.length === 0) return false;
            } else if (orderStatusFilter !== "ALL" && o.status !== orderStatusFilter) {
              return false;
            }
            if (orderSearch.trim()) {
              const q = orderSearch.toLowerCase();
              const customer = (o.user?.name || o.guestName || "").toLowerCase();
              const email = (o.user?.email || o.guestEmail || "").toLowerCase();
              const phone = (o.guestPhone || o.user?.phone || "").toLowerCase();
              const address = (o.deliveryAddress || `${o.deliveryStreet || ""} ${o.deliveryPostalCode || ""} ${o.deliveryCity || ""}`).toLowerCase();
              const idMatch = o.id.toLowerCase().includes(q);
              const tyreMatch = o.items?.some((it) =>
                `${it.tyre?.brand} ${it.tyre?.model} ${it.tyre?.size}`.toLowerCase().includes(q)
              );
              if (!customer.includes(q) && !email.includes(q) && !phone.includes(q) && !address.includes(q) && !idMatch && !tyreMatch) {
                return false;
              }
            }
            return true;
          });

          const totalRevenue = orders
            .filter((o) => o.status !== "CANCELLED")
            .reduce((sum, o) => sum + o.totalAmount, 0);

          return (
            <>
              <div className="admin-header">
                <div>
                  <h1 className="admin-page-title">Bestellingen &amp; Retouren</h1>
                  <p className="admin-page-sub">
                    {orders.length} bestellingen · €{totalRevenue.toFixed(2)} omzet · {ordersWithReturns.length} retouraanvragen
                  </p>
                </div>
                <button
                  className="admin-btn admin-btn--secondary"
                  onClick={() => fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : []))}
                >
                  ↺ Vernieuwen
                </button>
              </div>

              {/* Stats overview */}
              <div className="admin-stats-grid">
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Totaal Bestellingen</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0b192c", marginTop: 4 }}>{orders.length}</div>
                </div>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "0.75rem", color: "#0369a1", fontWeight: 700, textTransform: "uppercase" }}>Nieuw &amp; Bevestigd</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
                    {orders.filter((o) => o.status === "CONFIRMED").length}
                  </div>
                </div>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 700, textTransform: "uppercase" }}>Klaar voor klant</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#d97706", marginTop: 4 }}>
                    {orders.filter((o) => o.status === "READY").length}
                  </div>
                </div>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 700, textTransform: "uppercase" }}>Afgerond &amp; Voltooid</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
                    {orders.filter((o) => o.status === "COMPLETED").length}
                  </div>
                </div>
                <div
                  style={{
                    background: pendingReturns.length > 0 ? "#fffbeb" : "#ffffff",
                    border: pendingReturns.length > 0 ? "1px solid #fde68a" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "14px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    cursor: "pointer",
                  }}
                  onClick={() => setOrderStatusFilter("RETURNS")}
                  title="Klik om alle retouraanvragen te bekijken"
                >
                  <div style={{ fontSize: "0.75rem", color: pendingReturns.length > 0 ? "#b45309" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    ↩ Retouraanvragen
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: pendingReturns.length > 0 ? "#d97706" : "#0b192c", marginTop: 4 }}>
                    {ordersWithReturns.length}{pendingReturns.length > 0 && <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#d97706", marginLeft: 6 }}>({pendingReturns.length} nieuw)</span>}
                  </div>
                </div>
              </div>

              {/* Filter and search toolbar */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["ALL", "CONFIRMED", "READY", "COMPLETED", "RETURNS", "CANCELLED", "PENDING"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`admin-filter-pill${orderStatusFilter === st ? " admin-filter-pill--active" : ""}`}
                    >
                      {st === "ALL" ? "Alle" : st === "RETURNS" ? "↩ Retouren" : ORDER_STATUS_CONFIG[st]?.label ?? st}
                      {" "}
                      <span style={{ opacity: 0.65 }}>
                        ({st === "ALL" ? orders.length : st === "RETURNS" ? ordersWithReturns.length : orders.filter((o) => o.status === st).length})
                      </span>
                    </button>
                  ))}
                </div>

                <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Zoek op klant, e-mail, band of ID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ margin: 0, padding: "8px 14px", fontSize: "0.85rem", width: "100%" }}
                  />
                </div>
              </div>

              {/* Table scroll hint for touch/mobile */}
              <div className="admin-table-scroll-hint">
                <span>↔️</span> Veeg horizontaal om alle kolommen te bekijken
              </div>

              {/* Orders Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Bestelling</th>
                      <th>Klant &amp; Contact</th>
                      <th>Banden &amp; Aantal</th>
                      <th>Service</th>
                      <th>Totaalbedrag</th>
                      <th>Status</th>
                      <th>Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
                      const customerName = o.user?.name ?? o.guestName ?? "Gast";
                      const customerEmail = o.user?.email ?? o.guestEmail;
                      const customerPhone = o.guestPhone ?? o.user?.phone;
                      const hasMontage = o.serviceType === "MONTAGE" || (o.notes?.includes("Montage & balancering inbegrepen") ?? false);
                      const deliveryAddress = o.deliveryAddress || (o.deliveryStreet ? `${o.deliveryStreet}, ${o.deliveryPostalCode} ${o.deliveryCity}` : null);
                      const isExpanded = expandedOrder === o.id;
                      const orderNum = `GBV-${new Date(o.createdAt).getFullYear()}-${o.id.slice(-6).toUpperCase()}`;
                      const sc = ORDER_STATUS_CONFIG[o.status] ?? { label: o.status, cls: "admin-badge--new" };
                      const totalTyres = o.items?.reduce((acc, it) => acc + it.quantity, 0) || 0;

                      return (
                        <React.Fragment key={o.id}>
                          <tr
                            style={{ cursor: "pointer", background: isExpanded ? "#f8fafc" : undefined }}
                            onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                          >
                            <td>
                              <code className="admin-code">#{orderNum}</code>
                              <br />
                              <span style={{ fontSize: 12, opacity: 0.65 }}>
                                {new Date(o.createdAt).toLocaleDateString("nl-BE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <strong>{customerName}</strong>
                                {o.user ? (
                                  <span style={{ fontSize: 10, background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                    Account
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 10, background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: 4 }}>
                                    Gast
                                  </span>
                                )}
                              </div>
                              {customerEmail && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                  <a href={`mailto:${customerEmail}`} onClick={(e) => e.stopPropagation()} style={{ color: "#016eb9", textDecoration: "none" }}>
                                    {customerEmail}
                                  </a>
                                </div>
                              )}
                              {customerPhone && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                  <a href={`tel:${customerPhone}`} onClick={(e) => e.stopPropagation()} style={{ color: "#475569", textDecoration: "none" }}>
                                    📞 {customerPhone}
                                  </a>
                                </div>
                              )}
                              {deliveryAddress && !hasMontage && (
                                <div style={{ fontSize: 11, color: "#475569", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                  <span>📍</span>
                                  <span style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={deliveryAddress}>
                                    {deliveryAddress}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                                {totalTyres} band{totalTyres !== 1 ? "en" : ""}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {o.items?.map((it) => `${it.quantity}× ${it.tyre?.brand} ${it.tyre?.model}`).join(", ") || "—"}
                              </div>
                            </td>
                            <td>
                              {hasMontage ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
                                  🔧 Montage Gent
                                </span>
                              ) : (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f8fafc", color: "#334155", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, border: "1px solid #e2e8f0" }}>
                                  📦 Thuislevering
                                </span>
                              )}
                            </td>
                            <td>
                              <strong style={{ fontSize: "0.95rem", color: "#0b192c" }}>
                                €{o.totalAmount.toFixed(2)}
                              </strong>
                            </td>
                            <td>
                              <span className={`admin-badge ${sc.cls}`}>{sc.label}</span>
                              {o.returnRequests && o.returnRequests.length > 0 && (
                                <div style={{ marginTop: 4 }}>
                                  <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#fef3c7", color: "#92400e", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    ↩ Retour ({o.returnRequests[0].status})
                                  </span>
                                </div>
                              )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                {o.status === "CONFIRMED" && (
                                  <button
                                    className="admin-btn admin-btn--sm admin-btn--primary"
                                    disabled={orderActionLoading === o.id + "READY"}
                                    onClick={() => updateOrderStatus(o.id, "READY")}
                                    title="Markeer als klaar voor montage of afhaling"
                                  >
                                    📦 Klaarzetten
                                  </button>
                                )}
                                {(o.status === "CONFIRMED" || o.status === "READY") && (
                                  <button
                                    className="admin-btn admin-btn--sm"
                                    style={{ background: "#16a34a", color: "#fff", borderColor: "#15803d" }}
                                    disabled={orderActionLoading === o.id + "COMPLETED"}
                                    onClick={() => updateOrderStatus(o.id, "COMPLETED")}
                                    title="Markeer als voltooid / afgeleverd"
                                  >
                                    ✓ Voltooien
                                  </button>
                                )}
                                {o.status !== "CANCELLED" && o.status !== "COMPLETED" && (
                                  <button
                                    className="admin-btn admin-btn--sm admin-btn--danger"
                                    disabled={orderActionLoading === o.id + "CANCELLED"}
                                    onClick={() => updateOrderStatus(o.id, "CANCELLED")}
                                    title="Bestelling annuleren"
                                  >
                                    ✕
                                  </button>
                                )}
                                <Link
                                  href={`/bestelling/factuur/${o.id}`}
                                  target="_blank"
                                  className="admin-btn admin-btn--sm admin-btn--secondary"
                                  title="Officiële factuur bekijken / printen"
                                >
                                  📄 Factuur
                                </Link>
                                <button
                                  className="admin-btn admin-btn--sm"
                                  style={{ color: "#94a3b8", background: "none", border: "none", padding: "4px" }}
                                  disabled={orderActionLoading === o.id + "delete"}
                                  onClick={() => deleteOrder(o.id)}
                                  title="Bestelling verwijderen"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Order Details */}
                          {isExpanded && (
                            <tr style={{ background: "#f8fafc" }}>
                              <td colSpan={7} style={{ padding: "14px 16px" }}>
                                <div className="admin-order-detail-grid">
                                  {/* Left: Items list */}
                                  <div>
                                    <h4 style={{ margin: "0 0 10px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
                                      Bestelde Banden ({totalTyres} stuks)
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                      {o.items?.map((it) => (
                                        <div
                                          key={it.id}
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "10px 12px",
                                            background: "#ffffff",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 8,
                                          }}
                                        >
                                          <div>
                                            <strong style={{ color: "#0b192c" }}>{it.tyre?.brand} {it.tyre?.model}</strong>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>
                                              Maat: {it.tyre?.size} · {it.tyre?.condition === "NEW" ? "Nieuw" : "2de hands"}
                                            </div>
                                          </div>
                                          <div style={{ textAlign: "right" }}>
                                            <span style={{ fontWeight: 700 }}>{it.quantity}×</span>
                                            <span style={{ marginLeft: 8, color: "#016eb9", fontWeight: 700 }}>
                                              €{(it.price * it.quantity).toFixed(2)}
                                            </span>
                                            <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                                              (€{it.price.toFixed(2)}/st)
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Right: Customer & Delivery details */}
                                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px" }}>
                                      <h4 style={{ margin: "0 0 10px", fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                                        Klant- &amp; Leveringsgegevens
                                      </h4>
                                      <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: 5, color: "#334155" }}>
                                        <div><strong>Klant:</strong> {customerName} {o.user ? "· (Geregistreerd account)" : "· (Gast)"}</div>
                                        <div><strong>E-mail:</strong> {customerEmail || "—"}</div>
                                        <div><strong>Telefoon:</strong> {customerPhone ? <a href={`tel:${customerPhone}`} style={{ color: "#016eb9", textDecoration: "none" }}>{customerPhone}</a> : "Niet opgegeven"}</div>
                                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed #e2e8f0" }}>
                                          <strong>Service:</strong> {hasMontage ? "🔧 Vakkundige montage in Gent (Dendermondsesteenweg 428)" : "📦 Thuislevering"}
                                        </div>
                                        {!hasMontage && (
                                          <div>
                                            <strong>Bezorgadres:</strong> {deliveryAddress || "Niet opgegeven"}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {o.notes && (
                                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
                                        <h4 style={{ margin: "0 0 6px", fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b" }}>
                                          Opmerkingen &amp; Systeemnotities
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "0.825rem", color: "#475569", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                                          {o.notes}
                                        </p>
                                      </div>
                                    )}

                                    {/* Return requests block */}
                                    {o.returnRequests && o.returnRequests.length > 0 && (
                                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px" }}>
                                        <h4 style={{ margin: "0 0 8px", fontSize: "0.8rem", textTransform: "uppercase", color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                                          <span>↩</span> Retouraanvragen ({o.returnRequests.length})
                                        </h4>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                          {o.returnRequests.map((ret) => (
                                            <div key={ret.id} style={{ background: "#ffffff", border: "1px solid #fef3c7", borderRadius: 6, padding: "10px 12px" }}>
                                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                                                <div>
                                                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>{ret.reason}</span>
                                                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 8 }}>
                                                    {new Date(ret.createdAt).toLocaleDateString("nl-BE")}
                                                  </span>
                                                </div>
                                                <span style={{
                                                  fontSize: "0.72rem",
                                                  fontWeight: 700,
                                                  padding: "2px 8px",
                                                  borderRadius: 4,
                                                  background: ret.status === "APPROVED" ? "#dcfce7" : ret.status === "REFUNDED" ? "#dbeafe" : ret.status === "REJECTED" ? "#fee2e2" : "#fef3c7",
                                                  color: ret.status === "APPROVED" ? "#166534" : ret.status === "REFUNDED" ? "#1e40af" : ret.status === "REJECTED" ? "#991b1b" : "#92400e",
                                                }}>
                                                  {ret.status}
                                                </span>
                                              </div>
                                              {ret.reasonDetails && (
                                                <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "#475569" }}>
                                                  {ret.reasonDetails}
                                                </p>
                                              )}
                                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                                <button
                                                  type="button"
                                                  className="admin-btn admin-btn--xs"
                                                  style={{ background: "#16a34a", color: "#fff", border: "none" }}
                                                  onClick={() => updateReturnStatus(o.id, ret.id, "APPROVED")}
                                                >
                                                  ✓ Goedkeuren
                                                </button>
                                                <button
                                                  type="button"
                                                  className="admin-btn admin-btn--xs"
                                                  style={{ background: "#0284c7", color: "#fff", border: "none" }}
                                                  onClick={() => updateReturnStatus(o.id, ret.id, "REFUNDED")}
                                                >
                                                  💳 Terugbetaald
                                                </button>
                                                <button
                                                  type="button"
                                                  className="admin-btn admin-btn--xs"
                                                  style={{ background: "#dc2626", color: "#fff", border: "none" }}
                                                  onClick={() => updateReturnStatus(o.id, ret.id, "REJECTED")}
                                                >
                                                  ✕ Afwijzen
                                                </button>
                                                <button
                                                  type="button"
                                                  className="admin-btn admin-btn--xs admin-btn--outline"
                                                  onClick={() => updateReturnStatus(o.id, ret.id, "PENDING")}
                                                >
                                                  ⏳ Wachtend
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div style={{ display: "flex", gap: 10 }}>
                                      <Link
                                        href={`/bestelling/factuur/${o.id}`}
                                        target="_blank"
                                        className="admin-btn admin-btn--primary admin-btn--sm"
                                        style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
                                      >
                                        📄 Bekijk / Print Factuur
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {filteredOrders.length === 0 && (
                  <div className="admin-empty">
                    <p>
                      {orderSearch || orderStatusFilter !== "ALL"
                        ? "Geen bestellingen gevonden met deze filters."
                        : "Nog geen bestellingen geplaatst."}
                    </p>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* ── APPOINTMENTS TAB ──────────────────────────── */}
        {activeTab === "appointments" && (() => {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          const startOfDayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
          const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

          // Metrics counts
          const todayCount = appointments.filter((a) => {
            const d = new Date(a.dateTime);
            return d >= startOfToday && d < startOfTomorrow;
          }).length;

          const tomorrowCount = appointments.filter((a) => {
            const d = new Date(a.dateTime);
            return d >= startOfTomorrow && d < startOfDayAfterTomorrow;
          }).length;

          const thisWeekCount = appointments.filter((a) => {
            const d = new Date(a.dateTime);
            return d >= startOfToday && d < endOfWeek;
          }).length;

          const upcomingCount = appointments.filter((a) => new Date(a.dateTime) >= startOfToday).length;
          const pastCount = appointments.filter((a) => new Date(a.dateTime) < startOfToday).length;

          const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
          const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
          const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
          const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;

          // Filter appointments
          const filteredAppointments = appointments.filter((a) => {
            // 1. Status filter
            if (apptStatusFilter !== "ALL" && a.status !== apptStatusFilter) return false;

            // 2. Date filter
            const apptDate = new Date(a.dateTime);
            if (apptDateFilter === "TODAY") {
              if (apptDate < startOfToday || apptDate >= startOfTomorrow) return false;
            } else if (apptDateFilter === "TOMORROW") {
              if (apptDate < startOfTomorrow || apptDate >= startOfDayAfterTomorrow) return false;
            } else if (apptDateFilter === "THIS_WEEK") {
              if (apptDate < startOfToday || apptDate >= endOfWeek) return false;
            } else if (apptDateFilter === "UPCOMING") {
              if (apptDate < startOfToday) return false;
            } else if (apptDateFilter === "PAST") {
              if (apptDate >= startOfToday) return false;
            }

            // 3. Search filter
            if (apptSearch.trim()) {
              const q = apptSearch.toLowerCase();
              const customer = (a.user?.name || a.guestName || "").toLowerCase();
              const email = (a.user?.email || a.guestEmail || "").toLowerCase();
              const phone = (a.guestPhone || "").toLowerCase();
              const vehicle = (a.vehicleInfo || "").toLowerCase();
              const notes = (a.notes || "").toLowerCase();
              const serviceName = (APPT_TYPE_LABELS[a.type] || a.type || "").toLowerCase();
              if (
                !customer.includes(q) &&
                !email.includes(q) &&
                !phone.includes(q) &&
                !vehicle.includes(q) &&
                !notes.includes(q) &&
                !serviceName.includes(q)
              ) {
                return false;
              }
            }

            return true;
          });

          // Sorted chronologically
          const sortedAppointments = [...filteredAppointments].sort(
            (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
          );

          // Group by Day for Agenda view
          const groupedByDay: { [dateKey: string]: { date: Date; items: AppointmentEntry[] } } = {};
          for (const appt of sortedAppointments) {
            const d = new Date(appt.dateTime);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            if (!groupedByDay[key]) {
              groupedByDay[key] = { date: d, items: [] };
            }
            groupedByDay[key].items.push(appt);
          }

          return (
            <>
              {/* Header */}
              <div className="admin-header">
                <div>
                  <h1 className="admin-page-title">Afspraken &amp; Werkplaatsplanning</h1>
                  <p className="admin-page-sub">
                    {appointments.length} afspraken totaal · <strong style={{ color: todayCount > 0 ? "#f59e0b" : "#fff" }}>{todayCount} vandaag</strong> · {pendingCount} te bevestigen
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    className="admin-btn admin-btn--primary"
                    onClick={openNewApptModal}
                    style={{ fontWeight: 700 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    + Nieuwe Afspraak Inplannen
                  </button>
                  <button
                    className="admin-btn admin-btn--secondary"
                    onClick={() => fetch("/api/appointments").then((r) => r.json()).then((d) => setAppointments(Array.isArray(d) ? d : []))}
                    title="Vernieuwen"
                  >
                    ↺ Vernieuwen
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards (1-Click Filters) */}
              <div className="admin-stats-grid">
                {/* Total */}
                <div
                  onClick={() => { setApptStatusFilter("ALL"); setApptDateFilter("ALL"); }}
                  style={{
                    background: apptStatusFilter === "ALL" && apptDateFilter === "ALL" ? "rgba(255,255,255,0.08)" : "#1a1d27",
                    border: `1.5px solid ${apptStatusFilter === "ALL" && apptDateFilter === "ALL" ? "#016eb9" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Totaal Afspraken</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginTop: 4 }}>{appointments.length}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Alle statussen &amp; data</div>
                </div>

                {/* Vandaag */}
                <div
                  onClick={() => setApptDateFilter(apptDateFilter === "TODAY" ? "ALL" : "TODAY")}
                  style={{
                    background: apptDateFilter === "TODAY" ? "rgba(245, 158, 11, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${apptDateFilter === "TODAY" ? "#f59e0b" : todayCount > 0 ? "rgba(245, 158, 11, 0.4)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vandaag</span>
                    {todayCount > 0 && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />}
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>{todayCount}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Op de planning vandaag</div>
                </div>

                {/* Te Bevestigen */}
                <div
                  onClick={() => setApptStatusFilter(apptStatusFilter === "PENDING" ? "ALL" : "PENDING")}
                  style={{
                    background: apptStatusFilter === "PENDING" ? "rgba(245, 158, 11, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${apptStatusFilter === "PENDING" ? "#f59e0b" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Te Bevestigen</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>{pendingCount}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Wachten op goedkeuring</div>
                </div>

                {/* Bevestigd */}
                <div
                  onClick={() => setApptStatusFilter(apptStatusFilter === "CONFIRMED" ? "ALL" : "CONFIRMED")}
                  style={{
                    background: apptStatusFilter === "CONFIRMED" ? "rgba(1, 110, 185, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${apptStatusFilter === "CONFIRMED" ? "#016eb9" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#60c0ff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bevestigd</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#60c0ff", marginTop: 4 }}>{confirmedCount}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Klaar voor werkplaats</div>
                </div>

                {/* Voltooid */}
                <div
                  onClick={() => setApptStatusFilter(apptStatusFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
                  style={{
                    background: apptStatusFilter === "COMPLETED" ? "rgba(16, 185, 129, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${apptStatusFilter === "COMPLETED" ? "#10b981" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Voltooid</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10b981", marginTop: 4 }}>{completedCount}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Succesvol afgerond</div>
                </div>

                {/* Geannuleerd */}
                <div
                  onClick={() => setApptStatusFilter(apptStatusFilter === "CANCELLED" ? "ALL" : "CANCELLED")}
                  style={{
                    background: apptStatusFilter === "CANCELLED" ? "rgba(148, 163, 184, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${apptStatusFilter === "CANCELLED" ? "#94a3b8" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Geannuleerd</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#94a3b8", marginTop: 4 }}>{cancelledCount}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Niet doorgegaan</div>
                </div>
              </div>

              {/* Toolbar: Search, Filters & View Switcher */}
              <div style={{ background: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
                {/* Search & View Mode row */}
                <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 14 }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Zoek op klant, nummerplaat, telefoon, e-mail of dienst..."
                      value={apptSearch}
                      onChange={(e) => setApptSearch(e.target.value)}
                      style={{ paddingLeft: 36, paddingRight: apptSearch ? 32 : 12, margin: 0, width: "100%", fontSize: "0.85rem" }}
                    />
                    {apptSearch && (
                      <button
                        onClick={() => setApptSearch("")}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* View Toggle */}
                  <div className="admin-view-toggle">
                    <button
                      className={`admin-view-toggle-btn${apptViewMode === "agenda" ? " admin-view-toggle-btn--active" : ""}`}
                      onClick={() => setApptViewMode("agenda")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Dagoverzicht (Agenda)
                    </button>
                    <button
                      className={`admin-view-toggle-btn${apptViewMode === "table" ? " admin-view-toggle-btn--active" : ""}`}
                      onClick={() => setApptViewMode("table")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      Tabelweergave
                    </button>
                  </div>
                </div>

                {/* Filter Pills row */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Date pills */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", width: 60 }}>Datum:</span>
                    {[
                      { key: "ALL", label: "Alle data" },
                      { key: "TODAY", label: `Vandaag (${todayCount})` },
                      { key: "TOMORROW", label: `Morgen (${tomorrowCount})` },
                      { key: "THIS_WEEK", label: `Deze week (${thisWeekCount})` },
                      { key: "UPCOMING", label: `Aankomend (${upcomingCount})` },
                      { key: "PAST", label: `Geschiedenis (${pastCount})` },
                    ].map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setApptDateFilter(d.key as any)}
                        className={`admin-filter-pill${apptDateFilter === d.key ? " admin-filter-pill--active" : ""}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {/* Status pills */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", width: 60 }}>Status:</span>
                    {[
                      { key: "ALL", label: `Alle (${appointments.length})` },
                      { key: "PENDING", label: `Te bevestigen (${pendingCount})` },
                      { key: "CONFIRMED", label: `Bevestigd (${confirmedCount})` },
                      { key: "COMPLETED", label: `Voltooid (${completedCount})` },
                      { key: "CANCELLED", label: `Geannuleerd (${cancelledCount})` },
                    ].map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setApptStatusFilter(s.key)}
                        className={`admin-filter-pill${apptStatusFilter === s.key ? " admin-filter-pill--active" : ""}`}
                      >
                        {s.label}
                      </button>
                    ))}

                    {(apptStatusFilter !== "ALL" || apptDateFilter !== "ALL" || apptSearch) && (
                      <button
                        onClick={() => {
                          setApptStatusFilter("ALL");
                          setApptDateFilter("ALL");
                          setApptSearch("");
                        }}
                        style={{ marginLeft: "auto", background: "none", border: "none", color: "#60c0ff", fontSize: "0.8rem", cursor: "pointer", padding: "4px 8px" }}
                      >
                        ✕ Alle filters wissen
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results status indicator */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                <span>{filteredAppointments.length} afspraken geselecteerd</span>
                <span style={{ fontSize: "0.78rem" }}>Klik op een afspraak voor alle contact- &amp; voertuigdetails</span>
              </div>

              {/* No results */}
              {filteredAppointments.length === 0 && (
                <div className="admin-empty" style={{ background: "#1a1d27", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>📅</div>
                  <p style={{ margin: 0, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Geen afspraken gevonden</p>
                  <p style={{ margin: "4px 0 16px", fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
                    Er zijn geen afspraken die voldoen aan de huidige filter- of zoekopdracht.
                  </p>
                  <button
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    onClick={() => {
                      setApptStatusFilter("ALL");
                      setApptDateFilter("ALL");
                      setApptSearch("");
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              )}

              {/* ─── VIEW 1: AGENDA (DAY GROUPED TIMELINE) ────────────────────────── */}
              {apptViewMode === "agenda" && filteredAppointments.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {Object.entries(groupedByDay).map(([dayKey, group]) => {
                    const isToday = group.date.toDateString() === now.toDateString();
                    const isTomorrow = group.date.toDateString() === new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString();
                    const dayTitle = isToday
                      ? "Vandaag"
                      : isTomorrow
                      ? "Morgen"
                      : group.date.toLocaleDateString("nl-BE", { weekday: "long" });

                    const fullDateStr = group.date.toLocaleDateString("nl-BE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <div key={dayKey}>
                        {/* Day Group Header */}
                        <div
                          className="admin-day-group-header"
                          style={{
                            borderLeft: isToday ? "4px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.06)",
                            background: isToday ? "rgba(245, 158, 11, 0.08)" : "rgba(255, 255, 255, 0.03)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: "1.1rem" }}>📅</span>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <strong style={{ fontSize: "0.95rem", color: isToday ? "#f59e0b" : "#ffffff", textTransform: "capitalize" }}>
                                  {dayTitle}
                                </strong>
                                {(isToday || isTomorrow) && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      fontWeight: 800,
                                      textTransform: "uppercase",
                                      background: isToday ? "#f59e0b" : "#016eb9",
                                      color: "#fff",
                                    }}
                                  >
                                    {isToday ? "VANDAAG" : "MORGEN"}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>{fullDateStr}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>
                            {group.items.length} afspraak{group.items.length !== 1 ? "en" : ""}
                          </span>
                        </div>

                        {/* Cards for this day */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {group.items.map((a) => {
                            const name = a.user?.name ?? a.guestName ?? "Gast";
                            const email = a.user?.email ?? a.guestEmail;
                            const phone = a.guestPhone;
                            const sc = APPT_STATUS_CONFIG[a.status] ?? { label: a.status, cls: "admin-badge--new", color: "#94a3b8", bg: "rgba(255,255,255,0.08)" };
                            const typeConf = APPT_TYPE_CONFIG[a.type] ?? { label: a.type, duration: "ca. 30 min", icon: "🔧" };
                            const isExpanded = expandedAppt === a.id;
                            const apptDate = new Date(a.dateTime);

                            // Clean phone for WhatsApp
                            const rawPhone = phone || "";
                            const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
                            const intlPhone = cleanPhone.startsWith("0") ? "32" + cleanPhone.slice(1) : cleanPhone;
                            const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(
                              `Beste ${name},\n\nWij contacteren u vanuit Gent Bandenservice over uw afspraak (${typeConf.label}) op ${apptDate.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" })} om ${apptDate.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}.\n\n`
                            )}`;

                            return (
                              <div
                                key={a.id}
                                className={`admin-appt-card admin-appt-card--${a.status.toLowerCase()}${isToday ? " admin-appt-card--today" : ""}`}
                                style={{
                                  border: isExpanded ? "1px solid #016eb9" : undefined,
                                }}
                              >
                                <div
                                  className="admin-appt-card__header"
                                  onClick={() => setExpandedAppt(isExpanded ? null : a.id)}
                                >
                                  {/* Time block */}
                                  <div
                                    style={{
                                      textAlign: "center",
                                      background: "rgba(255,255,255,0.04)",
                                      borderRadius: 10,
                                      padding: "10px 8px",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                  >
                                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                                      {apptDate.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", marginTop: 4, fontWeight: 600 }}>
                                      {typeConf.duration}
                                    </div>
                                    <div style={{ fontSize: "1rem", marginTop: 4 }} title={typeConf.label}>
                                      {typeConf.icon}
                                    </div>
                                  </div>

                                  {/* Customer & Details Info */}
                                  <div style={{ minWidth: 0 }}>
                                    {/* Top row: Name, Account/Guest, Status, Vehicle plate */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                                      <span style={{ fontWeight: 700, color: "#ffffff", fontSize: "1rem" }}>{name}</span>
                                      {a.user ? (
                                        <span style={{ fontSize: 10, background: "rgba(1,110,185,0.2)", color: "#60c0ff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                          Account
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: 10, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", padding: "1px 6px", borderRadius: 4 }}>
                                          Gast
                                        </span>
                                      )}
                                      <span className={`admin-badge ${sc.cls}`} style={{ fontSize: 11, padding: "2px 9px", fontWeight: 700 }}>
                                        {sc.label}
                                      </span>

                                      {/* Vehicle License Plate Badge */}
                                      {a.vehicleInfo && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                          <LicensePlateBadge plate={a.vehicleInfo} />
                                        </div>
                                      )}
                                    </div>

                                    {/* Service type description */}
                                    <div style={{ fontSize: "0.85rem", color: "#60c0ff", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                                      <span>{typeConf.icon}</span>
                                      <span>{typeConf.label}</span>
                                    </div>

                                    {/* Contact Shortcuts Bar */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                                      {phone && (
                                        <>
                                          <a
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="admin-contact-btn admin-contact-btn--wa"
                                            title="Stuur een WhatsApp bericht"
                                          >
                                            <WhatsAppIcon size={12} />
                                            WhatsApp
                                          </a>
                                          <a
                                            href={`tel:${phone}`}
                                            className="admin-contact-btn admin-contact-btn--phone"
                                            title="Bel klant"
                                          >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l.9-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                            {phone}
                                          </a>
                                        </>
                                      )}

                                      {email && (
                                        <a
                                          href={`mailto:${email}?subject=${encodeURIComponent("Uw afspraak bij Gent Bandenservice")}`}
                                          className="admin-contact-btn admin-contact-btn--email"
                                          title="E-mail sturen"
                                        >
                                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                          {email}
                                        </a>
                                      )}
                                    </div>

                                    {/* Notes preview if any */}
                                    {a.notes && (
                                      <div
                                        style={{
                                          marginTop: 8,
                                          fontSize: "0.8rem",
                                          color: "rgba(255,255,255,0.65)",
                                          background: "rgba(0,0,0,0.2)",
                                          padding: "5px 10px",
                                          borderRadius: 6,
                                          borderLeft: "2px solid #016eb9",
                                          fontStyle: "italic",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                        }}
                                      >
                                        <span style={{ fontStyle: "normal" }}>💬</span>
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExpanded ? "pre-wrap" : "nowrap" }}>
                                          {a.notes}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons Column */}
                                  <div
                                    style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <select
                                        value={a.status}
                                        disabled={apptActionLoading === a.id + a.status}
                                        onChange={(e) => updateAppointmentStatus(a.id, e.target.value)}
                                        style={{
                                          background: sc.bg,
                                          color: sc.color,
                                          border: `1.5px solid ${sc.color}55`,
                                          borderRadius: 8,
                                          padding: "5px 10px",
                                          fontSize: "0.8rem",
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          outline: "none",
                                        }}
                                      >
                                        <option value="PENDING" style={{ background: "#161922", color: "#f59e0b" }}>⏳ In afwachting</option>
                                        <option value="CONFIRMED" style={{ background: "#161922", color: "#60c0ff" }}>🔵 Bevestigd</option>
                                        <option value="COMPLETED" style={{ background: "#161922", color: "#10b981" }}>✅ Voltooid</option>
                                        <option value="CANCELLED" style={{ background: "#161922", color: "#94a3b8" }}>❌ Geannuleerd</option>
                                      </select>
                                    </div>

                                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                                      {/* Edit button */}
                                      <button
                                        className="admin-btn admin-btn--sm admin-btn--primary"
                                        onClick={() => openEditApptModal(a)}
                                        title="Afspraak wijzigen of verzetten"
                                        style={{ padding: "5px 11px", fontSize: "0.8rem", fontWeight: 700 }}
                                      >
                                        ✏️ Bewerken
                                      </button>

                                      {/* Cancel button */}
                                      {a.status !== "CANCELLED" && (
                                        <button
                                          className="admin-btn admin-btn--sm admin-btn--danger"
                                          disabled={apptActionLoading === a.id + "CANCELLED"}
                                          onClick={() => {
                                            if (confirm("Wilt u deze afspraak annuleren? De klant ontvangt een automatische e-mail.")) {
                                              updateAppointmentStatus(a.id, "CANCELLED");
                                            }
                                          }}
                                          style={{ padding: "5px 9px", fontSize: "0.78rem" }}
                                          title="Afspraak annuleren"
                                        >
                                          ✕
                                        </button>
                                      )}

                                      {/* Delete button */}
                                      <button
                                        className="admin-btn admin-btn--sm"
                                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", padding: "5px 6px" }}
                                        disabled={apptActionLoading === a.id + "delete"}
                                        onClick={() => deleteAppointment(a.id)}
                                        title="Afspraak definitief verwijderen"
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Details Box */}
                                {isExpanded && (
                                  <div className="admin-appt-detail-grid">
                                    <div>
                                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                                        Boekingsdetails
                                      </div>
                                      <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", gap: 4 }}>
                                        <div><strong>Boekings-ID:</strong> <code style={{ fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 3 }}>{a.id}</code></div>
                                        <div><strong>Aangemaakt op:</strong> {new Date(a.createdAt).toLocaleString("nl-BE")}</div>
                                        <div><strong>Type service:</strong> {typeConf.label} ({typeConf.duration})</div>
                                        {a.vehicleInfo && <div><strong>Voertuig / Plaat:</strong> {a.vehicleInfo}</div>}
                                      </div>
                                    </div>

                                    <div>
                                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                                        Volledige Opmerkingen
                                      </div>
                                      <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                                        {a.notes || "Geen opmerkingen ingevoerd."}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── VIEW 2: TABLE VIEW ────────────────────────── */}
              {apptViewMode === "table" && filteredAppointments.length > 0 && (
                <>
                  <div className="admin-table-scroll-hint">
                    <span>↔️</span> Veeg horizontaal om alle kolommen te bekijken
                  </div>
                  <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tijdstip &amp; Datum</th>
                        <th>Klant &amp; Contact</th>
                        <th>Voertuig</th>
                        <th>Dienst &amp; Duur</th>
                        <th>Status</th>
                        <th>Opmerking</th>
                        <th style={{ textAlign: "right" }}>Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAppointments.map((a) => {
                        const name = a.user?.name ?? a.guestName ?? "Gast";
                        const email = a.user?.email ?? a.guestEmail;
                        const phone = a.guestPhone;
                        const sc = APPT_STATUS_CONFIG[a.status] ?? { label: a.status, cls: "admin-badge--new" };
                        const typeConf = APPT_TYPE_CONFIG[a.type] ?? { label: a.type, duration: "ca. 30 min", icon: "🔧" };
                        const apptDate = new Date(a.dateTime);
                        const isToday = apptDate.toDateString() === now.toDateString();
                        const isExpanded = expandedAppt === a.id;

                        const rawPhone = phone || "";
                        const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
                        const intlPhone = cleanPhone.startsWith("0") ? "32" + cleanPhone.slice(1) : cleanPhone;
                        const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(
                          `Beste ${name}, Gent Bandenservice i.v.m. uw afspraak op ${apptDate.toLocaleDateString("nl-BE")}.`
                        )}`;

                        return (
                          <React.Fragment key={a.id}>
                            <tr
                              style={{ cursor: "pointer", background: isExpanded ? "rgba(1,110,185,0.08)" : undefined }}
                              onClick={() => setExpandedAppt(isExpanded ? null : a.id)}
                            >
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <strong style={{ fontSize: "0.95rem", color: isToday ? "#f59e0b" : "#fff" }}>
                                    {apptDate.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}
                                  </strong>
                                  {isToday && (
                                    <span style={{ fontSize: 9, background: "#f59e0b", color: "#fff", padding: "1px 5px", borderRadius: 4, fontWeight: 800 }}>
                                      VANDAAG
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                                  {apptDate.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" })}
                                </div>
                              </td>

                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <strong style={{ color: "#fff" }}>{name}</strong>
                                  {a.user ? (
                                    <span style={{ fontSize: 9, background: "rgba(1,110,185,0.2)", color: "#60c0ff", padding: "1px 5px", borderRadius: 4 }}>
                                      Account
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 9, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", padding: "1px 5px", borderRadius: 4 }}>
                                      Gast
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                                  {phone && (
                                    <>
                                      <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#25d366", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3, textDecoration: "none" }} title="WhatsApp">
                                        <WhatsAppIcon size={11} /> WhatsApp
                                      </a>
                                      <a href={`tel:${phone}`} style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textDecoration: "none" }}>
                                        📞 {phone}
                                      </a>
                                    </>
                                  )}
                                  {email && (
                                    <a href={`mailto:${email}`} style={{ color: "#60c0ff", fontSize: 11, textDecoration: "none" }}>
                                      ✉️ {email}
                                    </a>
                                  )}
                                </div>
                              </td>

                              <td>
                                {a.vehicleInfo ? <LicensePlateBadge plate={a.vehicleInfo} /> : <span style={{ opacity: 0.35 }}>—</span>}
                              </td>

                              <td>
                                <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#e2e8f0" }}>
                                  {typeConf.icon} {typeConf.label}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                                  {typeConf.duration}
                                </div>
                              </td>

                              <td>
                                <select
                                  value={a.status}
                                  disabled={apptActionLoading === a.id + a.status}
                                  onChange={(e) => updateAppointmentStatus(a.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    background: sc.bg || "rgba(255,255,255,0.06)",
                                    color: sc.color || "#fff",
                                    border: `1px solid ${sc.color || "#fff"}44`,
                                    borderRadius: 6,
                                    padding: "3px 6px",
                                    fontSize: "0.74rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    outline: "none",
                                  }}
                                >
                                  <option value="PENDING" style={{ background: "#161922", color: "#f59e0b" }}>⏳ In afwachting</option>
                                  <option value="CONFIRMED" style={{ background: "#161922", color: "#60c0ff" }}>🔵 Bevestigd</option>
                                  <option value="COMPLETED" style={{ background: "#161922", color: "#10b981" }}>✅ Voltooid</option>
                                  <option value="CANCELLED" style={{ background: "#161922", color: "#94a3b8" }}>❌ Geannuleerd</option>
                                </select>
                              </td>

                              <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>
                                {a.notes || <span style={{ opacity: 0.3 }}>Geen</span>}
                              </td>

                              <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                                  {a.status === "PENDING" && (
                                    <button
                                      className="admin-btn admin-btn--xs admin-btn--primary"
                                      disabled={apptActionLoading === a.id + "CONFIRMED"}
                                      onClick={() => updateAppointmentStatus(a.id, "CONFIRMED")}
                                      title="Bevestigen"
                                    >
                                      ✓
                                    </button>
                                  )}
                                  {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                                    <button
                                      className="admin-btn admin-btn--xs"
                                      style={{ background: "#10b981", color: "#fff" }}
                                      disabled={apptActionLoading === a.id + "COMPLETED"}
                                      onClick={() => updateAppointmentStatus(a.id, "COMPLETED")}
                                      title="Voltooien"
                                    >
                                      ✓
                                    </button>
                                  )}
                                  <button
                                    className="admin-btn admin-btn--xs admin-btn--secondary"
                                    onClick={() => openEditApptModal(a)}
                                    title="Wijzigen"
                                  >
                                    ✏️
                                  </button>
                                  {a.status !== "CANCELLED" && (
                                    <button
                                      className="admin-btn admin-btn--xs admin-btn--danger"
                                      disabled={apptActionLoading === a.id + "CANCELLED"}
                                      onClick={() => {
                                        if (confirm("Afspraak annuleren?")) updateAppointmentStatus(a.id, "CANCELLED");
                                      }}
                                      title="Annuleren"
                                    >
                                      ✕
                                    </button>
                                  )}
                                  <button
                                    className="admin-btn admin-btn--xs"
                                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)" }}
                                    disabled={apptActionLoading === a.id + "delete"}
                                    onClick={() => deleteAppointment(a.id)}
                                    title="Verwijderen"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded row details */}
                            {isExpanded && (
                              <tr style={{ background: "rgba(1,110,185,0.04)" }}>
                                <td colSpan={7} style={{ padding: "12px 20px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: 20, fontSize: "0.82rem" }}>
                                    <div>
                                      <strong>Boekingscode:</strong> <code>{a.id}</code> · <strong>Ingepland op:</strong> {new Date(a.createdAt).toLocaleString("nl-BE")}
                                    </div>
                                    <div style={{ flex: 1, maxWidth: 500, textAlign: "right" }}>
                                      <strong>Opmerkingen:</strong> {a.notes || "Geen notities opgegeven."}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

              {/* ─── MODAL: AFSPRAAK WIJZIGEN / VERZETTEN ──────────────────── */}
              {editingAppt && (() => {
                const statusOptions = [
                  { key: "PENDING", label: "In afwachting", icon: "⏳", color: "#f59e0b", activeClass: "admin-appt-status-tab--active-pending" },
                  { key: "CONFIRMED", label: "Bevestigd", icon: "🔵", color: "#016eb9", activeClass: "admin-appt-status-tab--active-confirmed" },
                  { key: "COMPLETED", label: "Voltooid", icon: "✅", color: "#10b981", activeClass: "admin-appt-status-tab--active-completed" },
                  { key: "CANCELLED", label: "Geannuleerd", icon: "❌", color: "#94a3b8", activeClass: "admin-appt-status-tab--active-cancelled" },
                ];

                const serviceOptions = [
                  { value: "FITTING", icon: "🛞", label: "Montage & Balanceren", duration: "ca. 45 min" },
                  { value: "REPAIR", icon: "🔧", label: "Bandenreparatie", duration: "ca. 30 min" },
                  { value: "INSPECTION", icon: "🔍", label: "Inspectie & Wissel", duration: "ca. 30 min" },
                  { value: "OTHER", icon: "💬", label: "Andere Service", duration: "ca. 30 min" },
                ];

                return (
                  <div
                    className="admin-modal-overlay"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setEditingAppt(null);
                    }}
                  >
                    <div
                      className="admin-modal admin-modal--appt-clean"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="admin-modal__header">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: "linear-gradient(135deg, #016eb9, #0284c7)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "1.15rem",
                              flexShrink: 0,
                            }}
                          >
                            ✏️
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <h2 className="admin-modal__title" style={{ fontSize: "1.1rem" }}>
                                Afspraak Bewerken
                              </h2>
                              <code style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.08)", color: "#60c0ff", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>
                                #{editingAppt.id.slice(-6).toUpperCase()}
                              </code>
                            </div>
                            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                              {editingAppt.user?.name ?? editingAppt.guestName ?? "Gastklant"}
                              {editingAppt.guestPhone && ` · 📞 ${editingAppt.guestPhone}`}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="admin-modal__close"
                          onClick={() => setEditingAppt(null)}
                          title="Sluiten"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Form Body */}
                      <form onSubmit={handleSaveApptEdit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, margin: 0 }}>
                        <div className="admin-modal__body">
                          {/* Error alert */}
                          {editApptError && (
                            <div
                              style={{
                                padding: "12px 16px",
                                borderRadius: 10,
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.4)",
                                color: "#fca5a5",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <span>⚠️</span>
                              <span style={{ flex: 1 }}>{editApptError}</span>
                              <button
                                type="button"
                                onClick={() => setEditApptError("")}
                                style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "1rem" }}
                              >
                                ✕
                              </button>
                            </div>
                          )}

                          {/* 1. Status Selector */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>🚦 1. Status van de Afspraak</span>
                            </div>
                            <div className="admin-appt-status-grid">
                              {statusOptions.map((st) => {
                                const isSelected = editApptForm.status === st.key;
                                return (
                                  <button
                                    key={st.key}
                                    type="button"
                                    onClick={() => setEditApptForm({ ...editApptForm, status: st.key })}
                                    className={`admin-appt-status-tab${isSelected ? ` ${st.activeClass}` : ""}`}
                                  >
                                    <span>{st.icon}</span>
                                    <span>{st.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Planning (Datum & Tijdstip) */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>📅 2. Datum &amp; Tijdstip</span>
                              {editApptForm.date && (
                                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "none", fontWeight: 500 }}>
                                  {(() => {
                                    try {
                                      const d = new Date(`${editApptForm.date}T${editApptForm.time || "10:00"}:00`);
                                      return d.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "long" });
                                    } catch {
                                      return editApptForm.date;
                                    }
                                  })()}
                                </span>
                              )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div className="admin-field">
                                <label className="admin-label">Datum *</label>
                                <input
                                  type="date"
                                  className="admin-input"
                                  value={editApptForm.date}
                                  onChange={(e) => setEditApptForm((prev) => ({ ...prev, date: e.target.value }))}
                                  required
                                  style={{ fontSize: "0.92rem", padding: "10px 12px" }}
                                />
                                {/* Quick date shortcuts */}
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                  {[
                                    { label: "Vandaag", days: 0 },
                                    { label: "Morgen", days: 1 },
                                    { label: "+2d", days: 2 },
                                    { label: "+1w", days: 7 },
                                  ].map((p) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + p.days);
                                    const pad = (n: number) => String(n).padStart(2, "0");
                                    const pDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                                    const isPicked = editApptForm.date === pDate;
                                    return (
                                      <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => setEditApptForm((prev) => ({ ...prev, date: pDate }))}
                                        className={`admin-quick-time-pill${isPicked ? " admin-quick-time-pill--active" : ""}`}
                                      >
                                        {p.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Tijdstip *</label>
                                <input
                                  type="time"
                                  className="admin-input"
                                  value={editApptForm.time}
                                  onChange={(e) => setEditApptForm((prev) => ({ ...prev, time: e.target.value }))}
                                  required
                                  style={{ fontSize: "0.92rem", padding: "10px 12px" }}
                                />
                                {/* Quick time shortcuts */}
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                  {["09:00", "10:30", "12:00", "14:00", "16:00"].map((t) => {
                                    const isPicked = editApptForm.time === t;
                                    return (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={() => setEditApptForm((prev) => ({ ...prev, time: t }))}
                                        className={`admin-quick-time-pill${isPicked ? " admin-quick-time-pill--active" : ""}`}
                                      >
                                        {t}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 3. Type Service */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>🔧 3. Type Service</span>
                            </div>
                            <div className="admin-appt-services-grid">
                              {serviceOptions.map((s) => {
                                const isSelected = editApptForm.type === s.value;
                                return (
                                  <div
                                    key={s.value}
                                    onClick={() => setEditApptForm({ ...editApptForm, type: s.value })}
                                    className={`admin-appt-service-card${isSelected ? " admin-appt-service-card--selected" : ""}`}
                                  >
                                    <span style={{ fontSize: "1.3rem" }}>{s.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: isSelected ? "#fff" : "rgba(255,255,255,0.85)" }}>
                                        {s.label}
                                      </div>
                                      <div style={{ fontSize: "0.7rem", color: isSelected ? "#60c0ff" : "rgba(255,255,255,0.4)" }}>
                                        {s.duration}
                                      </div>
                                    </div>
                                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${isSelected ? "#016eb9" : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? "#016eb9" : "transparent" }}>
                                      {isSelected && <span style={{ fontSize: 9, color: "#fff", fontWeight: 900 }}>✓</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 4. Klantgegevens */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>👤 4. Klantgegevens</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div className="admin-field">
                                <label className="admin-label">Klantnaam</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="bijv. Jan Jansen"
                                  value={editApptForm.guestName}
                                  onChange={(e) => setEditApptForm({ ...editApptForm, guestName: e.target.value })}
                                />
                              </div>

                              <div className="admin-field">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <label className="admin-label">Telefoonnummer</label>
                                  {editApptForm.guestPhone && (
                                    <a
                                      href={`https://wa.me/${editApptForm.guestPhone.replace(/[^0-9]/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: "#22c55e", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: "0.72rem", fontWeight: 700 }}
                                      title="Open WhatsApp chat"
                                    >
                                      <WhatsAppIcon size={11} /> WhatsApp
                                    </a>
                                  )}
                                </div>
                                <input
                                  type="tel"
                                  className="admin-input"
                                  placeholder="bijv. 0488 12 34 56"
                                  value={editApptForm.guestPhone}
                                  onChange={(e) => setEditApptForm({ ...editApptForm, guestPhone: e.target.value })}
                                />
                              </div>

                              <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                                <label className="admin-label">E-mailadres</label>
                                <input
                                  type="email"
                                  className="admin-input"
                                  placeholder="bijv. klant@email.be"
                                  value={editApptForm.guestEmail}
                                  onChange={(e) => setEditApptForm({ ...editApptForm, guestEmail: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          {/* 5. Voertuig & Banden */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>🚗 5. Voertuig &amp; Banden</span>
                              {editApptForm.vehiclePlate && (
                                <LicensePlateBadge plate={editApptForm.vehiclePlate} />
                              )}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div className="admin-field">
                                <label className="admin-label">Nummerplaat</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="bijv. 1-ABC-123"
                                  value={editApptForm.vehiclePlate}
                                  onChange={(e) => setEditApptForm({ ...editApptForm, vehiclePlate: e.target.value.toUpperCase() })}
                                  style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Merk &amp; Model</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="bijv. Volkswagen Golf 7"
                                  value={editApptForm.vehicleBrandModel}
                                  onChange={(e) => setEditApptForm({ ...editApptForm, vehicleBrandModel: e.target.value })}
                                />
                              </div>

                              <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                  <label className="admin-label" style={{ margin: 0 }}>Bandenmaat</label>
                                  <div style={{ display: "flex", gap: 5 }}>
                                    {["205/55 R16", "225/45 R17", "225/40 R18", "195/65 R15"].map((sz) => (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() => setEditApptForm({ ...editApptForm, tyreSize: sz })}
                                        className="admin-quick-time-pill"
                                        style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                                      >
                                        {sz}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="bijv. 205/55 R16 91V"
                                  value={editApptForm.tyreSize}
                                  onChange={(e) => setEditApptForm({ ...editApptForm, tyreSize: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          {/* 6. Werkplaatsnotities */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>📝 6. Werkplaatsnotities</span>
                            </div>
                            <div className="admin-field">
                              <textarea
                                className="admin-textarea"
                                rows={2}
                                placeholder="Notities voor monteurs of details die de klant meedeelde..."
                                value={editApptForm.notes}
                                onChange={(e) => setEditApptForm({ ...editApptForm, notes: e.target.value })}
                                style={{ minHeight: 65, fontSize: "0.84rem" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="admin-modal__footer">
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary"
                            onClick={() => setEditingAppt(null)}
                            disabled={savingApptEdit}
                          >
                            Annuleren
                          </button>

                          <button
                            type="submit"
                            className="admin-btn admin-btn--primary"
                            disabled={savingApptEdit}
                            style={{ fontWeight: 800, padding: "10px 24px", minWidth: 170 }}
                          >
                            {savingApptEdit ? "Bezig met opslaan..." : "✓ Wijzigingen Opslaan"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              })()}

              {/* ─── MODAL: NIEUWE AFSPRAAK (USER-FRIENDLY CLEAN MODAL) ─────────── */}
              {showNewApptModal && (() => {
                const selectedTyre = newApptForm.selectedTyreId ? tyres.find((t) => t.id === newApptForm.selectedTyreId) : null;
                const tyreTotal = selectedTyre ? (selectedTyre.price * newApptForm.tyreQuantity).toFixed(2) : null;

                // Split dateTime into date and time
                let datePart = "";
                let timePart = "10:00";
                if (newApptForm.dateTime) {
                  const parts = newApptForm.dateTime.split("T");
                  if (parts[0]) datePart = parts[0];
                  if (parts[1]) timePart = parts[1].slice(0, 5);
                }

                const handleDateChange = (newDate: string) => {
                  const currentT = timePart || "10:00";
                  setNewApptForm({ ...newApptForm, dateTime: `${newDate}T${currentT}` });
                };

                const handleTimeChange = (newTime: string) => {
                  const currentD = datePart || new Date().toISOString().split("T")[0];
                  setNewApptForm({ ...newApptForm, dateTime: `${currentD}T${newTime}` });
                };

                const serviceOptions = [
                  { value: "FITTING", icon: "🛞", label: "Montage & Balanceren", duration: "ca. 45 min", desc: "Nieuwe of eigen banden" },
                  { value: "REPAIR", icon: "🔧", label: "Bandenreparatie", duration: "ca. 30 min", desc: "Spijker, schroef of ventiel" },
                  { value: "INSPECTION", icon: "🔍", label: "Inspectie & Wissel", duration: "ca. 30 min", desc: "Wielset wissel of controle" },
                  { value: "OTHER", icon: "💬", label: "Andere Service / Advies", duration: "ca. 30 min", desc: "TPMS sensoren of diagnose" },
                ];

                return (
                  <div
                    className="admin-modal-overlay"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setShowNewApptModal(false);
                    }}
                  >
                    <div
                      className="admin-modal admin-modal--appt-clean"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="admin-modal__header">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: "linear-gradient(135deg, #016eb9, #0284c7)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "1.15rem",
                              flexShrink: 0,
                            }}
                          >
                            📅
                          </div>
                          <div>
                            <h2 className="admin-modal__title" style={{ fontSize: "1.1rem" }}>
                              Nieuwe Afspraak Inplannen
                            </h2>
                            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                              Gent Bandenservice BV · Klantenplanning
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="admin-modal__close"
                          onClick={() => setShowNewApptModal(false)}
                          title="Sluiten"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Form Body */}
                      <form onSubmit={handleCreateNewAppt} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, margin: 0 }}>
                        <div className="admin-modal__body">

                          {/* 1. Klantgegevens */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>👤 1. Klantgegevens</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div className="admin-field">
                                <label className="admin-label">Klantnaam *</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="bijv. Jan Jansen"
                                  value={newApptForm.guestName}
                                  onChange={(e) => setNewApptForm({ ...newApptForm, guestName: e.target.value })}
                                  required
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Telefoonnummer *</label>
                                <input
                                  type="tel"
                                  className="admin-input"
                                  placeholder="bijv. 0488 12 34 56"
                                  value={newApptForm.guestPhone}
                                  onChange={(e) => setNewApptForm({ ...newApptForm, guestPhone: e.target.value })}
                                  required
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">E-mailadres (optioneel)</label>
                                <input
                                  type="email"
                                  className="admin-input"
                                  placeholder="klant@email.be"
                                  value={newApptForm.guestEmail}
                                  onChange={(e) => setNewApptForm({ ...newApptForm, guestEmail: e.target.value })}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Werkplek / Brug</label>
                                <select
                                  className="admin-select"
                                  value={newApptForm.bay}
                                  onChange={(e) => setNewApptForm({ ...newApptForm, bay: e.target.value })}
                                >
                                  <option value="Geen voorkeur">Geen voorkeur</option>
                                  <option value="Brug 1 (Montage)">Brug 1 (Montage)</option>
                                  <option value="Brug 2 (Uitlijning)">Brug 2 (Uitlijning)</option>
                                  <option value="Snelservice">Snelservice</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* 2. Planning (Datum & Tijd) */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>📅 2. Datum &amp; Tijdstip *</span>
                              {datePart && (
                                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "none", fontWeight: 500 }}>
                                  {(() => {
                                    try {
                                      const d = new Date(`${datePart}T${timePart || "10:00"}:00`);
                                      return d.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "long" });
                                    } catch {
                                      return datePart;
                                    }
                                  })()}
                                </span>
                              )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div className="admin-field">
                                <label className="admin-label">Datum *</label>
                                <input
                                  type="date"
                                  className="admin-input"
                                  value={datePart}
                                  onChange={(e) => handleDateChange(e.target.value)}
                                  required
                                  style={{ fontSize: "0.92rem", padding: "10px 12px" }}
                                />
                                {/* Quick date shortcuts */}
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                  {[
                                    { label: "Vandaag", days: 0 },
                                    { label: "Morgen", days: 1 },
                                    { label: "+2d", days: 2 },
                                    { label: "+1w", days: 7 },
                                  ].map((p) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + p.days);
                                    const pad = (n: number) => String(n).padStart(2, "0");
                                    const pDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                                    const isPicked = datePart === pDate;
                                    return (
                                      <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => handleDateChange(pDate)}
                                        className={`admin-quick-time-pill${isPicked ? " admin-quick-time-pill--active" : ""}`}
                                      >
                                        {p.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Tijdstip *</label>
                                <input
                                  type="time"
                                  className="admin-input"
                                  value={timePart}
                                  onChange={(e) => handleTimeChange(e.target.value)}
                                  required
                                  style={{ fontSize: "0.92rem", padding: "10px 12px" }}
                                />
                                {/* Quick time shortcuts */}
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                  {["09:00", "10:30", "12:00", "14:00", "16:00"].map((t) => {
                                    const isPicked = timePart === t;
                                    return (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={() => handleTimeChange(t)}
                                        className={`admin-quick-time-pill${isPicked ? " admin-quick-time-pill--active" : ""}`}
                                      >
                                        {t}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 3. Type Service */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>🔧 3. Type Service *</span>
                            </div>
                            <div className="admin-appt-services-grid">
                              {serviceOptions.map((s) => {
                                const isSelected = newApptForm.type === s.value;
                                return (
                                  <div
                                    key={s.value}
                                    onClick={() => setNewApptForm({ ...newApptForm, type: s.value as any })}
                                    className={`admin-appt-service-card${isSelected ? " admin-appt-service-card--selected" : ""}`}
                                  >
                                    <span style={{ fontSize: "1.3rem" }}>{s.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: isSelected ? "#fff" : "rgba(255,255,255,0.85)" }}>
                                        {s.label}
                                      </div>
                                      <div style={{ fontSize: "0.7rem", color: isSelected ? "#60c0ff" : "rgba(255,255,255,0.4)" }}>
                                        {s.duration} · {s.desc}
                                      </div>
                                    </div>
                                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${isSelected ? "#016eb9" : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? "#016eb9" : "transparent" }}>
                                      {isSelected && <span style={{ fontSize: 9, color: "#fff", fontWeight: 900 }}>✓</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 4. Bandenbron & Aantal (bij FITTING) */}
                          {newApptForm.type === "FITTING" && (
                            <div className="admin-appt-section">
                              <div className="admin-appt-section-header">
                                <span>🛞 4. Bandenbron &amp; Aantal</span>
                              </div>
                              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                                <button
                                  type="button"
                                  className={`admin-segmented-btn${newApptForm.tyreSource === "own" ? " admin-segmented-btn--active-confirmed" : ""}`}
                                  onClick={() => setNewApptForm({ ...newApptForm, tyreSource: "own" })}
                                  style={{ padding: "10px 14px" }}
                                >
                                  📦 Eigen banden meebrengen
                                </button>
                                <button
                                  type="button"
                                  className={`admin-segmented-btn${newApptForm.tyreSource === "shop" ? " admin-segmented-btn--active-confirmed" : ""}`}
                                  onClick={() => setNewApptForm({ ...newApptForm, tyreSource: "shop" })}
                                  style={{ padding: "10px 14px" }}
                                >
                                  🏪 Kopen uit stock / voorraad
                                </button>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                                  Aantal banden:
                                </span>
                                <div style={{ display: "flex", gap: 8 }}>
                                  {[1, 2, 4].map((qty) => (
                                    <button
                                      key={qty}
                                      type="button"
                                      className={`admin-count-chip${newApptForm.tyreQuantity === qty ? " admin-count-chip--active" : ""}`}
                                      onClick={() => setNewApptForm({ ...newApptForm, tyreQuantity: qty })}
                                    >
                                      {qty} {qty === 1 ? "band" : "banden"}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {newApptForm.tyreSource === "shop" && (
                                <div style={{ marginTop: 10, padding: "12px 14px", background: "rgba(1,110,185,0.06)", borderRadius: 10, border: "1px solid rgba(1,110,185,0.2)" }}>
                                  <label className="admin-label" style={{ fontSize: "0.78rem", color: "#60c0ff", marginBottom: 6 }}>
                                    Selecteer Band uit Stock ({tyres.length} banden beschikbaar)
                                  </label>
                                  <select
                                    className="admin-select"
                                    value={newApptForm.selectedTyreId}
                                    onChange={(e) => {
                                      const tyreId = e.target.value;
                                      const found = tyres.find((t) => t.id === tyreId);
                                      setNewApptForm({
                                        ...newApptForm,
                                        selectedTyreId: tyreId,
                                        ...(found ? { tyreSize: found.size } : {}),
                                      });
                                    }}
                                  >
                                    <option value="">-- Kies een band uit voorraad --</option>
                                    {tyres.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.brand} {t.model ? `${t.model} ` : ""}({t.size}) · €{t.price} · Stock: {t.stock}st
                                      </option>
                                    ))}
                                  </select>

                                  {selectedTyre && (
                                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                                      <span style={{ color: "rgba(255,255,255,0.7)" }}>
                                        Bandenkost ({newApptForm.tyreQuantity}x €{selectedTyre.price.toFixed(2)}):
                                      </span>
                                      <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: "0.95rem" }}>
                                        €{tyreTotal} incl. BTW
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 5. Voertuig & Bandenspecificaties */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>🚗 5. Voertuig &amp; Bandenspecificaties</span>
                              {newApptForm.vehiclePlate && (
                                <LicensePlateBadge plate={newApptForm.vehiclePlate} />
                              )}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div className="admin-field">
                                <label className="admin-label">Nummerplaat</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="bijv. 1-ABC-123"
                                  value={newApptForm.vehiclePlate}
                                  onChange={(e) => setNewApptForm({ ...newApptForm, vehiclePlate: e.target.value.toUpperCase() })}
                                  style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Merk &amp; Model</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="bijv. Volkswagen Golf 7"
                                  value={newApptForm.vehicleBrandModel}
                                  onChange={(e) => setNewApptForm({ ...newApptForm, vehicleBrandModel: e.target.value })}
                                />
                              </div>

                              <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                  <label className="admin-label" style={{ margin: 0 }}>Bandenmaat</label>
                                  <div style={{ display: "flex", gap: 5 }}>
                                    {["205/55 R16", "225/45 R17", "225/40 R18", "195/65 R15"].map((sz) => (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() => setNewApptForm({ ...newApptForm, tyreSize: sz })}
                                        className="admin-quick-time-pill"
                                        style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                                      >
                                        {sz}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="bijv. 205/55 R16 91V"
                                  value={newApptForm.tyreSize}
                                  onChange={(e) => setNewApptForm({ ...newApptForm, tyreSize: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          {/* 6. Status & Werkplaatsnotities */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header">
                              <span>📝 6. Status &amp; Werkplaatsnotities</span>
                            </div>

                            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                              <button
                                type="button"
                                className={`admin-segmented-btn${newApptForm.status === "CONFIRMED" ? " admin-segmented-btn--active-confirmed" : ""}`}
                                onClick={() => setNewApptForm({ ...newApptForm, status: "CONFIRMED" })}
                                style={{ padding: "10px 14px" }}
                              >
                                ✓ Direct Bevestigd (Ingepland)
                              </button>
                              <button
                                type="button"
                                className={`admin-segmented-btn${newApptForm.status === "PENDING" ? " admin-segmented-btn--active-pending" : ""}`}
                                onClick={() => setNewApptForm({ ...newApptForm, status: "PENDING" })}
                                style={{ padding: "10px 14px" }}
                              >
                                ⏳ In Afwachting (Te Bevestigen)
                              </button>
                            </div>

                            <div className="admin-field">
                              <textarea
                                className="admin-textarea"
                                rows={2}
                                placeholder="Werkplaatsnotities: slotbouten in handschoenkastje, velgen behoedzaam behandelen, klant wacht ter plaatse..."
                                value={newApptForm.notes}
                                onChange={(e) => setNewApptForm({ ...newApptForm, notes: e.target.value })}
                                style={{ minHeight: 65, fontSize: "0.84rem" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="admin-modal__footer">
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary"
                            onClick={() => setShowNewApptModal(false)}
                            disabled={savingNewAppt}
                          >
                            Annuleren
                          </button>

                          <button
                            type="submit"
                            className="admin-btn admin-btn--primary"
                            disabled={savingNewAppt || !newApptForm.guestName.trim() || !newApptForm.guestPhone.trim() || !newApptForm.dateTime}
                            style={{ fontWeight: 800, padding: "10px 24px", minWidth: 200 }}
                          >
                            {savingNewAppt ? "Bezig met inplannen..." : "✓ Afspraak Definitief Inplannen"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              })()}
            </>
          );
        })()}

        {/* ── TWEEDEHANDS INKOOP TAB ───────────────────────── */}
        {activeTab === "secondhand" && (() => {
          const SECONDHAND_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
            PENDING: { label: "Te beoordelen", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
            ACCEPTED: { label: "Geaccepteerd", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
            REJECTED: { label: "Afgewezen", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
          };
          const SEASON_LABELS: Record<string, string> = { SUMMER: "Zomer", WINTER: "Winter", ALL_SEASON: "All-season" };

          const pendingCount = secondhandSubmissions.filter(s => s.status === "PENDING").length;
          const acceptedCount = secondhandSubmissions.filter(s => s.status === "ACCEPTED").length;
          const rejectedCount = secondhandSubmissions.filter(s => s.status === "REJECTED").length;

          const filtered = secondhandSubmissions.filter((s) => {
            if (secondhandStatusFilter !== "ALL" && s.status !== secondhandStatusFilter) return false;
            if (secondhandSearch) {
              const q = secondhandSearch.toLowerCase();
              if (![s.name, s.email, s.brand, s.model, s.size, s.phone].some(v => v?.toLowerCase().includes(q))) return false;
            }
            return true;
          });

          async function reviewSecondhand(id: string, status: "ACCEPTED" | "REJECTED") {
            setSecondhandActionLoading(id + status);
            try {
              const res = await fetch(`/api/secondhand/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status,
                  offerPrice: status === "ACCEPTED" ? (parseFloat(secondhandOfferInput[id] || "0") || null) : null,
                  adminNotes: secondhandAdminNotes[id] || null,
                }),
              });
              if (res.ok) {
                const updated = await res.json();
                setSecondhandSubmissions(prev => prev.map(s => s.id === id ? updated : s));
              }
            } finally {
              setSecondhandActionLoading(null);
            }
          }

          async function deleteSecondhand(id: string) {
            if (!confirm("Aanvraag definitief verwijderen?")) return;
            setSecondhandActionLoading(id + "delete");
            try {
              const res = await fetch(`/api/secondhand/${id}`, { method: "DELETE" });
              if (res.ok) setSecondhandSubmissions(prev => prev.filter(s => s.id !== id));
            } finally {
              setSecondhandActionLoading(null);
            }
          }

          return (
            <>
              {/* Header */}
              <div className="admin-header" style={{ marginBottom: 24 }}>
                <div>
                  <h1 className="admin-page-title">Tweedehands Banden Inkoop</h1>
                  <p className="admin-page-sub">
                    Beheer en beoordeel inkoop-aanvragen van klanten. Bied direct een prijs of wijs af met toelichting.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    className="admin-btn admin-btn--outline"
                    onClick={() => fetch("/api/secondhand").then(r => r.json()).then(d => setSecondhandSubmissions(Array.isArray(d) ? d : []))}
                    title="Vernieuwen"
                  >
                    ↺ Vernieuwen
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards (1-Click Filters) */}
              <div className="admin-stats-grid">
                {/* Total */}
                <div
                  onClick={() => setSecondhandStatusFilter("ALL")}
                  style={{
                    background: secondhandStatusFilter === "ALL" ? "rgba(1, 110, 185, 0.16)" : "#1a1d27",
                    border: `1.5px solid ${secondhandStatusFilter === "ALL" ? "#016eb9" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Totaal Aanvragen</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginTop: 4 }}>{secondhandSubmissions.length}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Alle statussen</div>
                </div>

                {/* Te beoordelen (Pending) */}
                <div
                  onClick={() => setSecondhandStatusFilter("PENDING")}
                  style={{
                    background: secondhandStatusFilter === "PENDING" ? "rgba(245, 158, 11, 0.15)" : "#1a1d27",
                    border: `1.5px solid ${secondhandStatusFilter === "PENDING" ? "#f59e0b" : pendingCount > 0 ? "rgba(245, 158, 11, 0.4)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Te Beoordelen</span>
                    {pendingCount > 0 && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }} />}
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>{pendingCount}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Wachten op een bod</div>
                </div>

                {/* Geaccepteerd */}
                <div
                  onClick={() => setSecondhandStatusFilter("ACCEPTED")}
                  style={{
                    background: secondhandStatusFilter === "ACCEPTED" ? "rgba(16, 185, 129, 0.15)" : "#1a1d27",
                    border: `1.5px solid ${secondhandStatusFilter === "ACCEPTED" ? "#10b981" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Geaccepteerd</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10b981", marginTop: 4 }}>{acceptedCount}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Bod geaccepteerd</div>
                </div>

                {/* Afgewezen */}
                <div
                  onClick={() => setSecondhandStatusFilter("REJECTED")}
                  style={{
                    background: secondhandStatusFilter === "REJECTED" ? "rgba(148, 163, 184, 0.15)" : "#1a1d27",
                    border: `1.5px solid ${secondhandStatusFilter === "REJECTED" ? "#94a3b8" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Afgewezen</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#94a3b8", marginTop: 4 }}>{rejectedCount}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Niet ingekocht</div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div style={{ background: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Zoek op klantnaam, e-mail, bandenmaat, merk of telefoon..."
                    value={secondhandSearch}
                    onChange={e => setSecondhandSearch(e.target.value)}
                    style={{ width: "100%", paddingLeft: 38, paddingRight: secondhandSearch ? 32 : 14, margin: 0 }}
                  />
                  {secondhandSearch && (
                    <button
                      onClick={() => setSecondhandSearch("")}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase" }}>Status:</span>
                  {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map(s => {
                    const count = s === "ALL" ? secondhandSubmissions.length : secondhandSubmissions.filter(x => x.status === s).length;
                    return (
                      <button
                        key={s}
                        onClick={() => setSecondhandStatusFilter(s)}
                        className={`admin-filter-pill${secondhandStatusFilter === s ? " admin-filter-pill--active" : ""}`}
                      >
                        {s === "ALL" ? "Alle" : SECONDHAND_STATUS_CONFIG[s]?.label}
                        <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.75 }}>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submissions List */}
              {filtered.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty__icon">🛞</div>
                  <div className="admin-empty__title">Geen tweedehands aanvragen gevonden</div>
                  <p className="admin-empty__sub">
                    {secondhandSearch ? "Geen resultaten voor uw zoekopdracht." : "Er zijn momenteel geen aanvragen binnen dit filter."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {filtered.map((s) => {
                    const cfg = SECONDHAND_STATUS_CONFIG[s.status] ?? SECONDHAND_STATUS_CONFIG.PENDING;
                    const isExpanded = expandedSecondhand === s.id;
                    const actionKey = s.id;

                    // Parse photos if any (handles single or double-encoded JSON, array, or comma-separated)
                    let photoList: string[] = [];
                    if (s.photos) {
                      try {
                        let parsed: unknown = typeof s.photos === "string" ? JSON.parse(s.photos) : s.photos;
                        if (typeof parsed === "string") {
                          try {
                            parsed = JSON.parse(parsed);
                          } catch {
                            // keep as string
                          }
                        }
                        if (Array.isArray(parsed)) {
                          photoList = parsed.map((item) => String(item).trim()).filter(Boolean);
                        } else if (typeof parsed === "string") {
                          photoList = parsed.split(",").map((item) => item.trim()).filter(Boolean);
                        }
                      } catch {
                        photoList = String(s.photos).split(",").map((item) => item.trim()).filter(Boolean);
                      }
                    }

                    return (
                      <div
                        key={s.id}
                        style={{
                          background: "#1a1d27",
                          border: `1.5px solid ${isExpanded ? "rgba(1, 110, 185, 0.45)" : "rgba(255, 255, 255, 0.08)"}`,
                          borderRadius: 14,
                          overflow: "hidden",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          transition: "all 0.18s ease",
                        }}
                      >
                        {/* Header Row */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "16px 20px",
                            cursor: "pointer",
                            background: isExpanded ? "rgba(255, 255, 255, 0.02)" : "transparent",
                          }}
                          onClick={() => setExpandedSecondhand(isExpanded ? null : s.id)}
                        >
                          {/* Status Badge */}
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: cfg.bg,
                              border: `1px solid ${cfg.border}`,
                              color: cfg.color,
                              borderRadius: 999,
                              padding: "4px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {s.status === "PENDING" && "⏳"}
                            {s.status === "ACCEPTED" && "✓"}
                            {s.status === "REJECTED" && "✕"}
                            {" "}{cfg.label}
                          </div>

                          {/* Tyre & Customer Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: "#ffffff" }}>
                                {s.quantity}× {s.brand} {s.model ?? ""} — {s.size}
                              </span>
                              {s.season && (
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                                  {SEASON_LABELS[s.season] ?? s.season}
                                </span>
                              )}
                              {photoList.length > 0 && (
                                <span style={{ fontSize: 11, color: "#60afff", background: "rgba(1, 110, 185, 0.15)", border: "1px solid rgba(1, 110, 185, 0.3)", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>
                                  📸 {photoList.length} foto{photoList.length > 1 ? "'s" : ""}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.55)", marginTop: 4 }}>
                              <strong style={{ color: "#ffffff" }}>{s.name}</strong> · {s.email}
                              {s.phone && (
                                <span> · <span style={{ color: "#60afff" }}>{s.phone}</span></span>
                              )}
                            </div>
                          </div>

                          {/* Offer Price Highlight (if any) */}
                          {s.offerPrice != null && (
                            <div style={{ textAlign: "right", flexShrink: 0, padding: "0 10px" }}>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Bod uitgebracht</div>
                              <div style={{ fontWeight: 800, fontSize: 17, color: "#10b981" }}>€{s.offerPrice.toFixed(2)} /st.</div>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>totaal: €{(s.offerPrice * s.quantity).toFixed(2)}</div>
                            </div>
                          )}

                          {/* Created Date */}
                          <div style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }}>
                            {new Date(s.createdAt).toLocaleDateString("nl-BE", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>

                          {/* Chevron */}
                          <svg
                            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                              flexShrink: 0,
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>

                        {/* Expanded Detail View */}
                        {isExpanded && (
                          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.07)", padding: "22px 24px", background: "rgba(0, 0, 0, 0.2)" }}>
                            
                            {/* Quick Action Contact Bar */}
                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
                              {s.phone && (
                                <a
                                  href={`tel:${s.phone.replace(/[^0-9+]/g, "")}`}
                                  className="admin-btn admin-btn--sm"
                                  style={{ background: "rgba(1, 110, 185, 0.2)", color: "#60afff", border: "1px solid rgba(1, 110, 185, 0.35)", textDecoration: "none" }}
                                >
                                  📞 Bellen ({s.phone})
                                </a>
                              )}
                              <a
                                href={`mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent("Bod op uw tweedehands banden - Gent Bandenservice")}`}
                                className="admin-btn admin-btn--sm"
                                style={{ background: "rgba(255, 255, 255, 0.05)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", textDecoration: "none" }}
                              >
                                ✉️ E-mail verzenden ({s.email})
                              </a>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                              {[
                                { label: "Klantnaam", value: s.name },
                                { label: "E-mailadres", value: s.email },
                                { label: "Telefoonnummer", value: s.phone ?? "—" },
                                { label: "Bandenmerk", value: s.brand },
                                { label: "Model / Type", value: s.model ?? "—" },
                                { label: "Bandenmaat", value: s.size },
                                { label: "Seizoen", value: s.season ? (SEASON_LABELS[s.season] ?? s.season) : "—" },
                                { label: "Aantal stuks", value: `${s.quantity} stuks` },
                                { label: "Restprofiel", value: s.treadDepth != null ? `${s.treadDepth} mm` : "—" },
                                { label: "DOT-productiejaar", value: s.dotYear ?? "—" },
                                { label: "Staat beschrijving", value: s.condition ?? "—" },
                              ].map(({ label, value }) => (
                                <div
                                  key={label}
                                  style={{
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    borderRadius: 10,
                                    padding: "10px 14px",
                                  }}
                                >
                                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                                    {label}
                                  </div>
                                  <div style={{ fontSize: "0.92rem", color: "#ffffff", fontWeight: 600 }}>
                                    {value}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Customer Notes */}
                            {s.extraNotes && (
                              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.07)", borderLeft: "3.5px solid #016eb9", borderRadius: "0 10px 10px 0", padding: "14px 18px", marginBottom: 20 }}>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#60afff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                                  💬 Opmerkingen van klant
                                </div>
                                <p style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                                  {s.extraNotes}
                                </p>
                              </div>
                            )}

                            {/* Uploaded Photos Gallery */}
                            {photoList.length > 0 && (
                              <div style={{ background: "rgba(255, 255, 255, 0.025)", border: "1px solid rgba(255, 255, 255, 0.07)", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.65)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span>📸 Geüploade foto&apos;s ({photoList.length})</span>
                                  <span style={{ fontSize: "0.7rem", color: "#60afff", fontWeight: 600 }}>(klik om te vergroten)</span>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                                  {photoList.map((url, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() =>
                                        setAdminLightbox({
                                          list: photoList,
                                          index: idx,
                                          title: `${s.brand} ${s.model || ""} (${s.size}) – ${s.name}`,
                                        })
                                      }
                                      style={{
                                        position: "relative",
                                        width: 100,
                                        height: 100,
                                        borderRadius: 10,
                                        overflow: "hidden",
                                        border: "1.5px solid rgba(255, 255, 255, 0.15)",
                                        display: "block",
                                        background: "#0a0c10",
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                                        cursor: "zoom-in",
                                        padding: 0,
                                        transition: "transform 0.18s ease, border-color 0.18s ease",
                                      }}
                                      title="Klik om foto te vergroten"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={url}
                                        alt={`Band foto ${idx + 1}`}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                      <div
                                        style={{
                                          position: "absolute",
                                          bottom: 4,
                                          right: 4,
                                          background: "rgba(15, 23, 42, 0.8)",
                                          borderRadius: 4,
                                          padding: "3px 5px",
                                          display: "flex",
                                          alignItems: "center",
                                          color: "#fff",
                                        }}
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                          <circle cx="11" cy="11" r="8" />
                                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                          <line x1="11" y1="8" x2="11" y2="14" />
                                          <line x1="8" y1="11" x2="14" y2="11" />
                                        </svg>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Admin Review Action Box */}
                            {s.status === "PENDING" && (
                              <div style={{ background: "rgba(1, 110, 185, 0.08)", border: "1.5px solid rgba(1, 110, 185, 0.3)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#60afff", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span>🔍 Beoordeling & Bod uitbrengen</span>
                                </div>
                                <div className="admin-secondhand-detail-grid">
                                  <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: 6 }}>
                                      Bod per stuk (€)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="bijv. 25.00"
                                      value={secondhandOfferInput[actionKey] ?? ""}
                                      onChange={e => setSecondhandOfferInput(prev => ({ ...prev, [actionKey]: e.target.value }))}
                                      className="admin-input"
                                      style={{ width: "100%" }}
                                    />
                                    {secondhandOfferInput[actionKey] && (
                                      <span style={{ fontSize: 11, color: "#10b981", marginTop: 4, display: "block" }}>
                                        Totaalbod ({s.quantity} st.): €{(parseFloat(secondhandOfferInput[actionKey] || "0") * s.quantity).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.7)", display: "block", marginBottom: 6 }}>
                                      Interne notitie of reden
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Optioneel (intern gebruik)"
                                      value={secondhandAdminNotes[actionKey] ?? ""}
                                      onChange={e => setSecondhandAdminNotes(prev => ({ ...prev, [actionKey]: e.target.value }))}
                                      className="admin-input"
                                      style={{ width: "100%" }}
                                    />
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                  <button
                                    onClick={() => reviewSecondhand(s.id, "ACCEPTED")}
                                    disabled={secondhandActionLoading === actionKey + "ACCEPTED"}
                                    className="admin-btn"
                                    style={{
                                      background: "#16a34a",
                                      color: "#fff",
                                      fontWeight: 700,
                                      flex: 1,
                                      minWidth: 200,
                                      opacity: secondhandActionLoading === actionKey + "ACCEPTED" ? 0.65 : 1,
                                    }}
                                  >
                                    ✓ Bod accepteren & klant e-mailen
                                  </button>
                                  <button
                                    onClick={() => reviewSecondhand(s.id, "REJECTED")}
                                    disabled={secondhandActionLoading === actionKey + "REJECTED"}
                                    className="admin-btn admin-btn--outline"
                                    style={{
                                      color: "#fca5a5",
                                      borderColor: "rgba(220, 38, 38, 0.35)",
                                      opacity: secondhandActionLoading === actionKey + "REJECTED" ? 0.65 : 1,
                                    }}
                                  >
                                    ✕ Aanvraag afwijzen
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Reviewed Info Summary */}
                            {s.status !== "PENDING" && (
                              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 14 }}>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                                  Beoordeeld op {s.reviewedAt ? new Date(s.reviewedAt).toLocaleDateString("nl-BE") : "—"}
                                </span>
                                {s.adminNotes && (
                                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                                    — Notitie: {s.adminNotes}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Delete Option */}
                            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
                              <button
                                onClick={() => deleteSecondhand(s.id)}
                                disabled={secondhandActionLoading === actionKey + "delete"}
                                className="admin-btn admin-btn--danger admin-btn--xs"
                              >
                                🗑️ Aanvraag verwijderen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* ── FACTUREN / INVOICES TAB ───────────────────────── */}
        {activeTab === "invoices" && (() => {
          const filteredInvoices = invoices.filter((inv) => {
            if (invoiceStatusFilter !== "ALL" && inv.status !== invoiceStatusFilter) return false;
            if (invoiceSearch.trim()) {
              const q = invoiceSearch.toLowerCase().trim();
              const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
              const matchName = inv.customerName.toLowerCase().includes(q);
              const matchEmail = inv.customerEmail.toLowerCase().includes(q);
              const matchCompany = inv.companyName ? inv.companyName.toLowerCase().includes(q) : false;
              if (!matchNum && !matchName && !matchEmail && !matchCompany) return false;
            }
            return true;
          });

          const totalBilled = invoices.reduce((sum, i) => sum + (i.status !== "CANCELLED" ? i.totalAmount : 0), 0);
          const totalPending = invoices.reduce((sum, i) => sum + (i.status === "PENDING" ? i.totalAmount : 0), 0);
          const countPaid = invoices.filter((i) => i.status === "PAID").length;
          const countPending = invoices.filter((i) => i.status === "PENDING").length;

          // Helper to calculate preview total for modal
          const modalSubtotal = newInvoiceForm.items.reduce((acc, it) => acc + (it.price / (1 + (it.vatRate || 21) / 100)) * it.quantity, 0);
          const modalTotal = newInvoiceForm.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
          const modalVat = modalTotal - modalSubtotal;

          return (
            <>
              {/* Header */}
              <div className="admin-header">
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, rgba(1, 110, 185, 0.25) 0%, rgba(2, 132, 199, 0.15) 100%)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#38bdf8",
                      boxShadow: "0 0 20px rgba(1, 110, 185, 0.2)",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="admin-page-title" style={{ margin: 0 }}>Facturen &amp; Facturatie</h1>
                    <p className="admin-page-sub" style={{ margin: "4px 0 0" }}>
                      {invoices.length} facturen totaal · €{totalBilled.toFixed(2)} gefactureerd · <strong style={{ color: countPending > 0 ? "#f59e0b" : "#fff" }}>{countPending} openstaand</strong>
                    </p>
                  </div>
                </div>
                <div className="admin-header-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline"
                    onClick={fetchInvoices}
                    title="Facturenlijst vernieuwen"
                    style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    <span>Vernieuwen</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={() => setShowNewInvoiceModal(true)}
                    style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Nieuwe Factuur Maken</span>
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards (Interactive SVG-Driven Filters) */}
              <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
                {/* Total */}
                <div
                  onClick={() => setInvoiceStatusFilter("ALL")}
                  style={{
                    background: invoiceStatusFilter === "ALL" ? "rgba(1, 110, 185, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${invoiceStatusFilter === "ALL" ? "#016eb9" : "rgba(255, 255, 255, 0.07)"}`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "rgba(1, 110, 185, 0.15)",
                      border: "1px solid rgba(1, 110, 185, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#38bdf8",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="6" y1="12" x2="18" y2="12" />
                      <line x1="10" y1="8" x2="14" y2="8" />
                      <line x1="10" y1="16" x2="14" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Totaal Gefactureerd
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginTop: 2, lineHeight: 1.1 }}>
                      €{totalBilled.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.4)", marginTop: 4 }}>
                      {invoices.length} facturen
                    </div>
                  </div>
                </div>

                {/* Pending */}
                <div
                  onClick={() => setInvoiceStatusFilter(invoiceStatusFilter === "PENDING" ? "ALL" : "PENDING")}
                  style={{
                    background: invoiceStatusFilter === "PENDING" ? "rgba(245, 158, 11, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${invoiceStatusFilter === "PENDING" ? "#f59e0b" : countPending > 0 ? "rgba(245, 158, 11, 0.4)" : "rgba(255, 255, 255, 0.07)"}`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "rgba(245, 158, 11, 0.15)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f59e0b",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Openstaand
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fbbf24", marginTop: 2, lineHeight: 1.1 }}>
                      €{totalPending.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.5)", marginTop: 4 }}>
                      {countPending} wacht op betaling
                    </div>
                  </div>
                </div>

                {/* Paid */}
                <div
                  onClick={() => setInvoiceStatusFilter(invoiceStatusFilter === "PAID" ? "ALL" : "PAID")}
                  style={{
                    background: invoiceStatusFilter === "PAID" ? "rgba(16, 185, 129, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${invoiceStatusFilter === "PAID" ? "#10b981" : "rgba(255, 255, 255, 0.07)"}`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#10b981",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Voldaan / Betaald
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#34d399", marginTop: 2, lineHeight: 1.1 }}>
                      {countPaid} facturen
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.4)", marginTop: 4 }}>
                      Succesvol ontvangen
                    </div>
                  </div>
                </div>

                {/* Total Created */}
                <div
                  onClick={() => setInvoiceStatusFilter(invoiceStatusFilter === "CANCELLED" ? "ALL" : "CANCELLED")}
                  style={{
                    background: invoiceStatusFilter === "CANCELLED" ? "rgba(139, 92, 246, 0.12)" : "#1a1d27",
                    border: `1.5px solid ${invoiceStatusFilter === "CANCELLED" ? "#8b5cf6" : "rgba(255, 255, 255, 0.07)"}`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#a78bfa",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Totaal Aangemaakt
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginTop: 2, lineHeight: 1.1 }}>
                      {invoices.length}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.4)", marginTop: 4 }}>
                      Alle factuurnummers
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="admin-filter-bar">
                <div className="admin-filter-bar__top">
                  <div className="admin-search-wrap">
                    <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      className="admin-input admin-search-input"
                      placeholder="Zoek op factuurnr, klantnaam, e-mailadres of bedrijf..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                    />
                    {invoiceSearch && (
                      <button
                        type="button"
                        className="admin-search-clear"
                        onClick={() => setInvoiceSearch("")}
                        title="Zoekopdracht wissen"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter tabs */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {[
                      { key: "ALL", label: "Alle facturen", count: invoices.length },
                      { key: "PENDING", label: "Openstaand", count: countPending, color: "#f59e0b" },
                      { key: "PAID", label: "Betaald", count: countPaid, color: "#10b981" },
                    ].map((flt) => (
                      <button
                        key={flt.key}
                        type="button"
                        className={`admin-quick-time-pill${invoiceStatusFilter === flt.key ? " admin-quick-time-pill--active" : ""}`}
                        onClick={() => setInvoiceStatusFilter(flt.key as any)}
                        style={{ padding: "8px 14px", fontSize: "0.825rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        {flt.color && (
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: flt.color, display: "inline-block" }} />
                        )}
                        <span>{flt.label}</span>
                        <span style={{ background: "rgba(255, 255, 255, 0.12)", borderRadius: 10, padding: "1px 6px", fontSize: "0.72rem", fontWeight: 700 }}>
                          {flt.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Invoices List / Table */}
              <div className="admin-table-wrap">
                {filteredInvoices.length === 0 ? (
                  <div style={{ padding: "48px 20px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "rgba(255,255,255,0.35)" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>Geen facturen gevonden</div>
                    <p style={{ margin: "6px 0 16px", fontSize: "0.85rem" }}>
                      {invoiceSearch ? "Geen facturen voldoen aan uw zoekopdracht." : "Maak een nieuwe factuur aan om deze direct per e-mail met PDF naar de klant te sturen."}
                    </p>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={() => setShowNewInvoiceModal(true)}
                      style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span>Factuur Aanmaken</span>
                    </button>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 140 }}>Factuurnr</th>
                        <th style={{ width: 160 }}>Datum &amp; Vervaldatum</th>
                        <th>Klant / Bedrijf</th>
                        <th style={{ textAlign: "right", width: 140 }}>Totaal (incl. BTW)</th>
                        <th style={{ textAlign: "center", width: 120 }}>Status</th>
                        <th style={{ textAlign: "center", width: 130 }}>Verzending</th>
                        <th style={{ textAlign: "right", width: 230 }}>Acties</th>
                      </tr>
                    </thead>
                      <tbody>
                        {filteredInvoices.map((inv) => {
                          const isPaid = inv.status === "PAID";
                          const isCancelled = inv.status === "CANCELLED";
                          const issueFormatted = new Date(inv.issueDate).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" });
                          const dueFormatted = new Date(inv.dueDate).toLocaleDateString("nl-BE", { day: "numeric", month: "short" });

                          return (
                            <tr
                              key={inv.id}
                              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              {/* Invoice Number */}
                              <td style={{ padding: "14px 18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <a
                                    href={`/factuur/${inv.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "#38bdf8", fontWeight: 800, textDecoration: "none", fontSize: "0.9rem" }}
                                    title="Bekijk online factuur"
                                  >
                                    #{inv.invoiceNumber}
                                  </a>
                                </div>
                              </td>

                              {/* Dates */}
                              <td style={{ padding: "14px 18px" }}>
                                <div style={{ color: "#ffffff", fontWeight: 600 }}>{issueFormatted}</div>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                                  Vervalt: {dueFormatted}
                                </div>
                              </td>

                              {/* Customer */}
                              <td style={{ padding: "14px 18px" }}>
                                <div style={{ fontWeight: 700, color: "#ffffff" }}>{inv.customerName}</div>
                                {inv.companyName && (
                                  <div style={{ fontSize: "0.75rem", color: "#60c0ff", fontWeight: 600 }}>{inv.companyName}</div>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                                  <span>{inv.customerEmail}</span>
                                  {inv.customerPhone && (
                                    <a
                                      href={`https://wa.me/${inv.customerPhone.replace(/[^0-9]/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: "#22c55e", display: "inline-flex" }}
                                      title="WhatsApp"
                                    >
                                      <WhatsAppIcon size={11} />
                                    </a>
                                  )}
                                </div>
                              </td>

                              {/* Total Amount */}
                              <td style={{ padding: "14px 18px", textAlign: "right" }}>
                                <div style={{ fontWeight: 800, color: "#ffffff", fontSize: "1rem" }}>
                                  €{inv.totalAmount.toFixed(2)}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                                  excl: €{inv.subtotal.toFixed(2)}
                                </div>
                              </td>

                              {/* Status Badge & Toggle */}
                              <td style={{ padding: "14px 18px", textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleInvoiceStatus(inv.id, inv.status)}
                                  title="Klik om status te wijzigen"
                                  style={{
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                >
                                  <span
                                    className={`admin-badge ${isPaid ? "admin-badge--completed" : isCancelled ? "admin-badge--cancelled" : "admin-badge--new"}`}
                                    style={{ padding: "4px 10px", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                                  >
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isPaid ? "#10b981" : isCancelled ? "#ef4444" : "#f59e0b", display: "inline-block" }} />
                                    <span>{isPaid ? "Betaald" : isCancelled ? "Geannuleerd" : "Openstaand"}</span>
                                  </span>
                                </button>
                              </td>

                              {/* E-mail status */}
                              <td style={{ padding: "14px 18px", textAlign: "center" }}>
                                {inv.sentAt ? (
                                  <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    Verzonden ({new Date(inv.sentAt).toLocaleDateString("nl-BE", { day: "numeric", month: "short" })})
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                                    Nog niet verstuurd
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td style={{ padding: "14px 18px", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                                  {/* Edit invoice button */}
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn--sm admin-btn--secondary"
                                    style={{ padding: "6px 10px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 6 }}
                                    onClick={() => openEditInvoiceModal(inv)}
                                    title="Factuur bewerken"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    <span>Bewerken</span>
                                  </button>

                                  {/* Send email button */}
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn--sm"
                                    style={{
                                      background: "rgba(1,110,185,0.15)",
                                      borderColor: "rgba(1,110,185,0.3)",
                                      color: "#60c0ff",
                                      padding: "6px 10px",
                                      fontSize: "0.78rem",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                    disabled={sendingInvoiceId === inv.id}
                                    onClick={() => handleSendInvoiceEmail(inv.id)}
                                    title="Factuur met PDF verzenden via e-mail naar klant"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                      <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <span>{sendingInvoiceId === inv.id ? "Bezig…" : "Verstuur"}</span>
                                  </button>

                                  {/* View / Print button */}
                                  <a
                                    href={`/factuur/${inv.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="admin-btn admin-btn--sm admin-btn--secondary"
                                    style={{ padding: "6px 10px", fontSize: "0.78rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                                    title="Bekijk of print factuur online"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="6 9 6 2 18 2 18 9" />
                                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                      <rect x="6" y="14" width="12" height="8" />
                                    </svg>
                                    <span>Print</span>
                                  </a>

                                  {/* Download PDF button */}
                                  <a
                                    href={`/api/invoices/${inv.id}/pdf`}
                                    className="admin-btn admin-btn--sm admin-btn--secondary"
                                    style={{ padding: "6px 10px", fontSize: "0.78rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                                    title="Download officiële PDF"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="7 10 12 15 17 10" />
                                      <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>PDF</span>
                                  </a>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn--sm admin-btn--danger"
                                    style={{ padding: "5px 8px", fontSize: "0.78rem" }}
                                    disabled={deletingInvoiceId === inv.id}
                                    onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                                    title="Factuur verwijderen"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                )}
              </div>

              {/* ─── MODAL: NIEUWE FACTUUR MAKEN ──────────────────────────── */}
              {showNewInvoiceModal && (
                <div
                  className="admin-modal-overlay"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setShowNewInvoiceModal(false);
                  }}
                >
                  <div className="admin-modal admin-modal--appt-clean" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="admin-modal__header">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: "linear-gradient(135deg, #016eb9, #0284c7)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            flexShrink: 0,
                            boxShadow: "0 4px 12px rgba(1, 110, 185, 0.35)",
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="admin-modal__title" style={{ fontSize: "1.1rem" }}>
                            Nieuwe Factuur Aanmaken
                          </h2>
                          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                            Direct opmaken en optioneel verzenden naar de klant
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="admin-modal__close"
                        onClick={() => setShowNewInvoiceModal(false)}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleCreateInvoice} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, margin: 0 }}>
                      <div className="admin-modal__body">
                        {/* 1. Klant- & Factuurgegevens */}
                        <div className="admin-appt-section">
                          <div className="admin-appt-section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>1. Klant- &amp; Bedrijfsgegevens</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div className="admin-field">
                              <label className="admin-label">Klantnaam *</label>
                              <input
                                type="text"
                                className="admin-input"
                                placeholder="bijv. Jan Jansen"
                                value={newInvoiceForm.customerName}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerName: e.target.value })}
                                required
                              />
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">E-mailadres *</label>
                              <input
                                type="email"
                                className="admin-input"
                                placeholder="klant@bedrijf.be"
                                value={newInvoiceForm.customerEmail}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerEmail: e.target.value })}
                                required
                              />
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">Telefoonnummer</label>
                              <input
                                type="tel"
                                className="admin-input"
                                placeholder="bijv. 0488 12 34 56"
                                value={newInvoiceForm.customerPhone}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerPhone: e.target.value })}
                              />
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">Bedrijfsnaam (optioneel voor B2B)</label>
                              <input
                                type="text"
                                className="admin-input"
                                placeholder="bijv. Transport BV"
                                value={newInvoiceForm.companyName}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, companyName: e.target.value })}
                              />
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">BTW-nummer (B2B)</label>
                              <input
                                type="text"
                                className="admin-input"
                                placeholder="bijv. BE 0123.456.789"
                                value={newInvoiceForm.vatNumber}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, vatNumber: e.target.value })}
                              />
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">Straat en huisnummer</label>
                              <input
                                type="text"
                                className="admin-input"
                                placeholder="bijv. Kerkstraat 12"
                                value={newInvoiceForm.customerStreet}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerStreet: e.target.value })}
                              />
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">Postcode &amp; Gemeente</label>
                              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="9000"
                                  value={newInvoiceForm.customerPostal}
                                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerPostal: e.target.value })}
                                />
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="Gent"
                                  value={newInvoiceForm.customerCity}
                                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerCity: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Factuurinstellingen */}
                        <div className="admin-appt-section">
                          <div className="admin-appt-section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>2. Factuurdetails &amp; Datums</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div className="admin-field">
                              <label className="admin-label">Factuurdatum</label>
                              <input
                                type="date"
                                className="admin-input"
                                value={newInvoiceForm.issueDate}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, issueDate: e.target.value })}
                              />
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">Vervaldatum</label>
                              <input
                                type="date"
                                className="admin-input"
                                value={newInvoiceForm.dueDate}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, dueDate: e.target.value })}
                              />
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">Betaalmethode</label>
                              <select
                                className="admin-select"
                                value={newInvoiceForm.paymentMethod}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, paymentMethod: e.target.value })}
                              >
                                <option value="Overschrijving">Overschrijving (met SEPA QR-code)</option>
                                <option value="Bancontact / Kaart">Bancontact / Betaalterminal</option>
                                <option value="Contant">Contant in werkplaats</option>
                                <option value="Online betaald">Online voldaan</option>
                              </select>
                            </div>

                            <div className="admin-field">
                              <label className="admin-label">Initiële Status</label>
                              <select
                                className="admin-select"
                                value={newInvoiceForm.status}
                                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, status: e.target.value as any })}
                              >
                                <option value="PENDING">Openstaand (Klant moet nog betalen)</option>
                                <option value="PAID">Betaald (Reeds voldaan)</option>
                              </select>
                            </div>

                            {newInvoiceForm.paymentMethod.includes("Overschrijving") && (
                              <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "rgba(1, 110, 185, 0.08)", border: "1px solid rgba(1, 110, 185, 0.25)", borderRadius: 8, fontSize: "0.78rem", color: "#60c0ff", display: "flex", alignItems: "center", gap: 10 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                  <rect x="3" y="3" width="7" height="7" />
                                  <rect x="14" y="3" width="7" height="7" />
                                  <rect x="3" y="14" width="7" height="7" />
                                  <rect x="14" y="14" width="3" height="3" />
                                  <line x1="20" y1="14" x2="20" y2="14.01" />
                                  <line x1="14" y1="20" x2="14" y2="20.01" />
                                  <line x1="20" y1="20" x2="20" y2="20.01" />
                                </svg>
                                <span>Er wordt automatisch een officiële <strong>SEPA EPC QR-code</strong> gegenereerd zodat de klant direct kan scannen en betalen via bank-apps (KBC, Belfius, ING, Fortis).</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3. Factuurregels */}
                        <div className="admin-appt-section">
                          <div className="admin-appt-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                              </svg>
                              <span>3. Factuurregels (Artikelen &amp; Diensten)</span>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "none" }}>
                              Prijzen incl. 21% BTW
                            </span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {newInvoiceForm.items.map((it, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 80px 110px 100px 36px",
                                  gap: 8,
                                  alignItems: "center",
                                  background: "rgba(255,255,255,0.02)",
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder="Omschrijving dienst of band..."
                                  value={it.description}
                                  onChange={(e) => {
                                    const next = [...newInvoiceForm.items];
                                    next[idx].description = e.target.value;
                                    setNewInvoiceForm({ ...newInvoiceForm, items: next });
                                  }}
                                  style={{ margin: 0 }}
                                />
                                <input
                                  type="number"
                                  min={1}
                                  className="admin-input"
                                  placeholder="Aantal"
                                  value={it.quantity}
                                  onChange={(e) => {
                                    const next = [...newInvoiceForm.items];
                                    next[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    setNewInvoiceForm({ ...newInvoiceForm, items: next });
                                  }}
                                  style={{ margin: 0, textAlign: "center" }}
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className="admin-input"
                                  placeholder="Prijs (€)"
                                  value={it.price}
                                  onChange={(e) => {
                                    const next = [...newInvoiceForm.items];
                                    next[idx].price = parseFloat(e.target.value) || 0;
                                    setNewInvoiceForm({ ...newInvoiceForm, items: next });
                                  }}
                                  style={{ margin: 0, textAlign: "right" }}
                                />
                                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60c0ff", textAlign: "right" }}>
                                  €{(it.quantity * it.price).toFixed(2)}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (newInvoiceForm.items.length <= 1) return;
                                    setNewInvoiceForm({
                                      ...newInvoiceForm,
                                      items: newInvoiceForm.items.filter((_, i) => i !== idx),
                                    });
                                  }}
                                  disabled={newInvoiceForm.items.length <= 1}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: newInvoiceForm.items.length <= 1 ? "rgba(255,255,255,0.15)" : "#f87171",
                                    cursor: newInvoiceForm.items.length <= 1 ? "default" : "pointer",
                                    fontSize: "1rem",
                                  }}
                                  title="Verwijder regel"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Quick add buttons */}
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                            <button
                              type="button"
                              className="admin-quick-time-pill"
                              onClick={() => {
                                setNewInvoiceForm({
                                  ...newInvoiceForm,
                                  items: [...newInvoiceForm.items, { description: "", quantity: 1, price: 0, vatRate: 21 }],
                                });
                              }}
                              style={{ padding: "6px 12px" }}
                            >
                              + Regel toevoegen
                            </button>

                            {/* Quick add common tyre services */}
                            <button
                              type="button"
                              className="admin-quick-time-pill"
                              onClick={() => {
                                setNewInvoiceForm({
                                  ...newInvoiceForm,
                                  items: [...newInvoiceForm.items, { description: "Bandenmontage & balanceren (per band)", quantity: 4, price: 19.99, vatRate: 21 }],
                                });
                              }}
                              style={{ padding: "6px 12px" }}
                            >
                              + Montage 4x toevoegen
                            </button>

                            <button
                              type="button"
                              className="admin-quick-time-pill"
                              onClick={() => {
                                setNewInvoiceForm({
                                  ...newInvoiceForm,
                                  items: [...newInvoiceForm.items, { description: "Bandenreparatie (wiek / plug)", quantity: 1, price: 25.0, vatRate: 21 }],
                                });
                              }}
                              style={{ padding: "6px 12px" }}
                            >
                              + Reparatie toevoegen
                            </button>
                          </div>

                          {/* Subtotal & Total Preview */}
                          <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(1,110,185,0.06)", borderRadius: 10, border: "1px solid rgba(1,110,185,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>
                              Subtotaal: €{modalSubtotal.toFixed(2)} · BTW 21%: €{modalVat.toFixed(2)}
                            </span>
                            <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#38bdf8" }}>
                              Totaal: €{modalTotal.toFixed(2)} incl. BTW
                            </span>
                          </div>
                        </div>

                        {/* 4. Notities & Verzendoptie */}
                        <div className="admin-appt-section">
                          <div className="admin-appt-section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            <span>4. Notities &amp; Verzending</span>
                          </div>
                          <div className="admin-field">
                            <label className="admin-label">Factuurnotities (verschijnen op factuur)</label>
                            <textarea
                              className="admin-textarea"
                              rows={2}
                              value={newInvoiceForm.notes}
                              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, notes: e.target.value })}
                              style={{ minHeight: 50, fontSize: "0.82rem" }}
                            />
                          </div>

                          {/* Send email checkbox */}
                          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: 4, fontSize: "0.875rem", color: "#60c0ff", fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={newInvoiceForm.sendDirectly}
                              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, sendDirectly: e.target.checked })}
                              style={{ width: 18, height: 18, accentColor: "#016eb9" }}
                            />
                            <span>✉️ Direct na opslaan per e-mail versturen naar {newInvoiceForm.customerEmail || "de klant"}</span>
                          </label>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="admin-modal__footer">
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          onClick={() => setShowNewInvoiceModal(false)}
                          disabled={savingInvoice}
                        >
                          Annuleren
                        </button>

                        <button
                          type="submit"
                          className="admin-btn admin-btn--primary"
                          disabled={savingInvoice || !newInvoiceForm.customerName.trim() || !newInvoiceForm.customerEmail.trim()}
                          style={{ fontWeight: 800, padding: "10px 24px" }}
                        >
                          {savingInvoice ? "Bezig met verwerken..." : newInvoiceForm.sendDirectly ? "✓ Factuur Aanmaken & Verzenden" : "✓ Factuur Opslaan"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ─── MODAL: FACTUUR BEWERKEN ──────────────────────────────── */}
              {editingInvoice && (() => {
                const editSubtotal = editInvoiceForm.items.reduce((acc, it) => acc + (it.price / (1 + (it.vatRate || 21) / 100)) * it.quantity, 0);
                const editTotal = editInvoiceForm.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
                const editVat = editTotal - editSubtotal;

                return (
                  <div
                    className="admin-modal-overlay"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setEditingInvoice(null);
                    }}
                  >
                    <div className="admin-modal admin-modal--appt-clean" onClick={(e) => e.stopPropagation()}>
                      {/* Header */}
                      <div className="admin-modal__header">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              background: "linear-gradient(135deg, #016eb9, #0284c7)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              flexShrink: 0,
                              boxShadow: "0 4px 12px rgba(1, 110, 185, 0.35)",
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </div>
                          <div>
                            <h2 className="admin-modal__title" style={{ fontSize: "1.1rem" }}>
                              Factuur #{editingInvoice.invoiceNumber} Bewerken
                            </h2>
                            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                              Pas klantgegevens, bedragen, status of regels direct aan
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="admin-modal__close"
                          onClick={() => setEditingInvoice(null)}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Form Body */}
                      <form onSubmit={handleUpdateInvoice} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, margin: 0 }}>
                        <div className="admin-modal__body">
                          {/* 1. Klant- & Factuurgegevens */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              <span>1. Klant- &amp; Bedrijfsgegevens</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div className="admin-field">
                                <label className="admin-label">Klantnaam *</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  value={editInvoiceForm.customerName}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, customerName: e.target.value })}
                                  required
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">E-mailadres *</label>
                                <input
                                  type="email"
                                  className="admin-input"
                                  value={editInvoiceForm.customerEmail}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, customerEmail: e.target.value })}
                                  required
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Telefoonnummer</label>
                                <input
                                  type="tel"
                                  className="admin-input"
                                  value={editInvoiceForm.customerPhone}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, customerPhone: e.target.value })}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Bedrijfsnaam</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  value={editInvoiceForm.companyName}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, companyName: e.target.value })}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">BTW-nummer</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  value={editInvoiceForm.vatNumber}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, vatNumber: e.target.value })}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Straat en huisnummer</label>
                                <input
                                  type="text"
                                  className="admin-input"
                                  value={editInvoiceForm.customerStreet}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, customerStreet: e.target.value })}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Postcode &amp; Gemeente</label>
                                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
                                  <input
                                    type="text"
                                    className="admin-input"
                                    value={editInvoiceForm.customerPostal}
                                    onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, customerPostal: e.target.value })}
                                  />
                                  <input
                                    type="text"
                                    className="admin-input"
                                    value={editInvoiceForm.customerCity}
                                    onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, customerCity: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2. Factuurdetails */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              <span>2. Factuurdetails &amp; Datums</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              <div className="admin-field">
                                <label className="admin-label">Factuurdatum</label>
                                <input
                                  type="date"
                                  className="admin-input"
                                  value={editInvoiceForm.issueDate}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, issueDate: e.target.value })}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Vervaldatum</label>
                                <input
                                  type="date"
                                  className="admin-input"
                                  value={editInvoiceForm.dueDate}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, dueDate: e.target.value })}
                                />
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Betaalmethode</label>
                                <select
                                  className="admin-select"
                                  value={editInvoiceForm.paymentMethod}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, paymentMethod: e.target.value })}
                                >
                                  <option value="Overschrijving">Overschrijving (met SEPA QR-code)</option>
                                  <option value="Bancontact / Kaart">Bancontact / Betaalterminal</option>
                                  <option value="Contant">Contant in werkplaats</option>
                                  <option value="Online betaald">Online voldaan</option>
                                </select>
                              </div>

                              <div className="admin-field">
                                <label className="admin-label">Status</label>
                                <select
                                  className="admin-select"
                                  value={editInvoiceForm.status}
                                  onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, status: e.target.value as any })}
                                >
                                  <option value="PENDING">Openstaand (Nog te betalen)</option>
                                  <option value="PAID">Betaald (Voldaan)</option>
                                  <option value="CANCELLED">Geannuleerd</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* 3. Factuurregels */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                  <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                                <span>3. Factuurregels (Artikelen &amp; Diensten)</span>
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "none" }}>
                                Prijzen incl. 21% BTW
                              </span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {editInvoiceForm.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 80px 110px 100px 36px",
                                    gap: 8,
                                    alignItems: "center",
                                    background: "rgba(255,255,255,0.02)",
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255,255,255,0.06)",
                                  }}
                                >
                                  <input
                                    type="text"
                                    className="admin-input"
                                    placeholder="Omschrijving..."
                                    value={it.description}
                                    onChange={(e) => {
                                      const next = [...editInvoiceForm.items];
                                      next[idx].description = e.target.value;
                                      setEditInvoiceForm({ ...editInvoiceForm, items: next });
                                    }}
                                    style={{ margin: 0 }}
                                  />
                                  <input
                                    type="number"
                                    min={1}
                                    className="admin-input"
                                    placeholder="Aantal"
                                    value={it.quantity}
                                    onChange={(e) => {
                                      const next = [...editInvoiceForm.items];
                                      next[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                                      setEditInvoiceForm({ ...editInvoiceForm, items: next });
                                    }}
                                    style={{ margin: 0, textAlign: "center" }}
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="admin-input"
                                    placeholder="Prijs (€)"
                                    value={it.price}
                                    onChange={(e) => {
                                      const next = [...editInvoiceForm.items];
                                      next[idx].price = parseFloat(e.target.value) || 0;
                                      setEditInvoiceForm({ ...editInvoiceForm, items: next });
                                    }}
                                    style={{ margin: 0, textAlign: "right" }}
                                  />
                                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60c0ff", textAlign: "right" }}>
                                    €{(it.quantity * it.price).toFixed(2)}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editInvoiceForm.items.length <= 1) return;
                                      setEditInvoiceForm({
                                        ...editInvoiceForm,
                                        items: editInvoiceForm.items.filter((_, i) => i !== idx),
                                      });
                                    }}
                                    disabled={editInvoiceForm.items.length <= 1}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: editInvoiceForm.items.length <= 1 ? "rgba(255,255,255,0.15)" : "#f87171",
                                      cursor: editInvoiceForm.items.length <= 1 ? "default" : "pointer",
                                      fontSize: "1rem",
                                    }}
                                    title="Verwijder regel"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add row button */}
                            <div style={{ marginTop: 8 }}>
                              <button
                                type="button"
                                className="admin-quick-time-pill"
                                onClick={() => {
                                  setEditInvoiceForm({
                                    ...editInvoiceForm,
                                    items: [...editInvoiceForm.items, { description: "", quantity: 1, price: 0, vatRate: 21 }],
                                  });
                                }}
                                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                              >
                                + Regel toevoegen
                              </button>
                            </div>

                            {/* Totals Preview */}
                            <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(1,110,185,0.06)", borderRadius: 10, border: "1px solid rgba(1,110,185,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>
                                Subtotaal: €{editSubtotal.toFixed(2)} · BTW 21%: €{editVat.toFixed(2)}
                              </span>
                              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#38bdf8" }}>
                                Totaal: €{editTotal.toFixed(2)} incl. BTW
                              </span>
                            </div>
                          </div>

                          {/* 4. Notities */}
                          <div className="admin-appt-section">
                            <div className="admin-appt-section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                              <span>4. Factuurnotities</span>
                            </div>
                            <div className="admin-field">
                              <textarea
                                className="admin-textarea"
                                rows={2}
                                value={editInvoiceForm.notes}
                                onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, notes: e.target.value })}
                                style={{ minHeight: 60, fontSize: "0.82rem" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="admin-modal__footer">
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary"
                            onClick={() => setEditingInvoice(null)}
                            disabled={savingInvoice}
                          >
                            Annuleren
                          </button>

                          <button
                            type="submit"
                            className="admin-btn admin-btn--primary"
                            disabled={savingInvoice || !editInvoiceForm.customerName.trim() || !editInvoiceForm.customerEmail.trim()}
                            style={{ fontWeight: 800, padding: "10px 24px" }}
                          >
                            {savingInvoice ? "Bezig met opslaan..." : "✓ Wijzigingen Opslaan"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              })()}
            </>
          );
        })()}

        {/* ── ANALYTICS & COOKIE TRACKING TAB ────────────── */}
        {activeTab === "analytics" && <AdminAnalyticsView />}
      </main>

      {/* Secondhand / General Image Lightbox Modal */}
      {adminLightbox && adminLightbox.list[adminLightbox.index] && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(10, 12, 16, 0.94)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            animation: "adminFadeIn 140ms ease-out",
          }}
          onClick={() => setAdminLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              position: "relative",
              maxWidth: "92vw",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              background: "#161922",
              border: "1.5px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                background: "rgba(22, 25, 34, 0.98)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60afff" }}>
                  Foto {adminLightbox.index + 1} van {adminLightbox.list.length}
                </span>
                {adminLightbox.title && (
                  <span
                    style={{
                      fontSize: "0.82rem",
                      color: "rgba(255, 255, 255, 0.6)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    · {adminLightbox.title}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a
                  href={adminLightbox.list[adminLightbox.index]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "#38bdf8",
                    background: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: 6,
                    padding: "6px 12px",
                    textDecoration: "none",
                  }}
                  title="Open originele foto in nieuw tabblad"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>Origineel</span>
                </a>
                <button
                  type="button"
                  onClick={() => setAdminLightbox(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Sluiten (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a0c10",
                padding: 16,
                minWidth: 320,
                minHeight: 280,
              }}
            >
              {adminLightbox.list.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setAdminLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: prev.index > 0 ? prev.index - 1 : prev.list.length - 1,
                          }
                        : null
                    )
                  }
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(22, 25, 34, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    fontSize: 26,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                  }}
                  title="Vorige foto (←)"
                >
                  ‹
                </button>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={adminLightbox.list[adminLightbox.index]}
                alt={`Band foto ${adminLightbox.index + 1}`}
                style={{
                  maxWidth: "86vw",
                  maxHeight: "78vh",
                  objectFit: "contain",
                  borderRadius: 8,
                  display: "block",
                }}
              />

              {adminLightbox.list.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setAdminLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: prev.index < prev.list.length - 1 ? prev.index + 1 : 0,
                          }
                        : null
                    )
                  }
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(22, 25, 34, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    fontSize: 26,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                  }}
                  title="Volgende foto (→)"
                >
                  ›
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function UploadIcon({ width = 16, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon({ width = 16, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function LicensePlateBadge({ plate }: { plate: string }) {
  const clean = plate.trim();
  if (!clean) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#ffffff",
        border: "1.5px solid #dc2626",
        borderRadius: 4,
        overflow: "hidden",
        fontSize: "0.75rem",
        fontWeight: 800,
        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        lineHeight: 1,
        letterSpacing: "0.06em",
        verticalAlign: "middle",
      }}
      title={`Nummerplaat / Voertuig: ${clean}`}
    >
      <span
        style={{
          background: "#016eb9",
          color: "#fbbf24",
          fontSize: 8,
          fontWeight: 900,
          padding: "2px 4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 6 }}>★</span>
        <span style={{ fontSize: 7, color: "#ffffff", marginTop: 1 }}>B</span>
      </span>
      <span style={{ color: "#991b1b", padding: "2px 7px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {clean}
      </span>
    </span>
  );
}

function WhatsAppIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

function setQuickDate(currentIsoStr: string, daysAhead: number) {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  let hour = 10;
  let minute = 0;
  if (currentIsoStr) {
    const parsed = new Date(currentIsoStr);
    if (!isNaN(parsed.getTime())) {
      hour = parsed.getHours();
      minute = parsed.getMinutes();
    }
  }
  target.setHours(hour, minute, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
}

function setQuickTime(currentIsoStr: string, timeStr: string) {
  const [hStr, mStr] = timeStr.split(":");
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);
  let baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1); // default tomorrow
  if (currentIsoStr) {
    const parsed = new Date(currentIsoStr);
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }
  baseDate.setHours(hour, minute, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}T${pad(baseDate.getHours())}:${pad(baseDate.getMinutes())}`;
}
