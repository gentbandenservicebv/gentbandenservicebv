"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import ManageAppointments from "@/app/components/appointments/ManageAppointments";
import { formatUserNotes } from "@/lib/sanitize-notes";
import { getCart } from "@/lib/store";
import {
  TyreIcon,
  WrenchIcon,
  SearchIcon,
  MessageSquareIcon,
  ClockIcon,
  CheckIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClipboardListIcon,
  CarIcon,
  UserIcon,
  PackageIcon,
  ShoppingCartIcon,
  SunIcon,
  SunriseIcon,
  SnowflakeIcon,
  LeafIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  StoreIcon,
  BanknoteIcon,
  LockIcon,
  MailIcon,
  EditIcon,
  LightbulbIcon,
  AlertTriangleIcon,
  XCircleIcon,
  XIcon,
} from "@/app/components/appointments/AppointmentIcons";
import "./appointment.css";

const APPOINTMENT_TYPES: Array<{
  value: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  duration: string;
}> = [
  {
    value: "FITTING",
    icon: <TyreIcon size={24} />,
    label: "Banden monteren & balanceren",
    desc: "Montage van banden inclusief balanceren en ventielen. Met eigen banden of aankoop uit onze voorraad.",
    duration: "ca. 45 min",
  },
  {
    value: "REPAIR",
    icon: <WrenchIcon size={24} />,
    label: "Bandenreparatie",
    desc: "Professionele herstelling van een lekke band, spijker, schroef of beschadigd ventiel.",
    duration: "ca. 30 min",
  },
  {
    value: "INSPECTION",
    icon: <SearchIcon size={24} />,
    label: "Inspectie & Seizoenswissel",
    desc: "Controle van profieldiepte, bandenspanning of wissel van een complete zomer-/winterwielset.",
    duration: "ca. 30 min",
  },
  {
    value: "OTHER",
    icon: <MessageSquareIcon size={24} />,
    label: "Andere service / Advies",
    desc: "TPMS sensoren, trillingsdiagnose, bandenadvies of specifieke vraag.",
    duration: "ca. 30 min",
  },
];

type WizardStep = 1 | 2 | 3 | 4 | "verify" | "done";

interface SlotInfo {
  time: string;
  period: "morning" | "afternoon";
  available: boolean;
  booked: boolean;
  isPast: boolean;
  reason: string;
  remaining: number;
}

interface TyreItem {
  id: string;
  slug?: string;
  brand: string;
  model: string;
  size: string;
  season: "SUMMER" | "WINTER" | "ALL_SEASON";
  condition: "NEW" | "USED";
  price: number;
  stock: number;
  treadDepth?: number | null;
  images?: { url: string }[];
}

interface SuccessData {
  name: string;
  email: string;
  dateTime: string;
  type: string;
  vehicleInfo?: string;
  notes?: string;
}

interface PlateCheckResult {
  formatted: string;
  country: "BE" | "NL" | "OTHER";
  isValid: boolean;
  typeDesc?: string;
}

function parseAndFormatPlate(raw: string): PlateCheckResult {
  if (!raw) return { formatted: "", country: "BE", isValid: false };

  // Remove whitespace and clean
  const clean = raw.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
  const unhyphenated = clean.replace(/-/g, "");

  // 1. Belgian European Standard: 1 index digit (1-9) + 3 letters + 3 digits (e.g. 1ABC123)
  if (/^[1-9][A-Z]{3}[0-9]{3}$/.test(unhyphenated)) {
    return {
      formatted: `${unhyphenated[0]}-${unhyphenated.slice(1, 4)}-${unhyphenated.slice(4)}`,
      country: "BE",
      isValid: true,
      typeDesc: "Belgisch Europees formaat",
    };
  }

  // 2. Already formatted Belgian European with dashes: e.g. 1-ABC-123
  if (/^[1-9]-[A-Z]{3}-[0-9]{3}$/.test(clean)) {
    return {
      formatted: clean,
      country: "BE",
      isValid: true,
      typeDesc: "Belgisch Europees formaat",
    };
  }

  // 3. Belgian classic: 3 letters + 3 digits (e.g. ABC123 or ABC-123)
  if (/^[A-Z]{3}[0-9]{3}$/.test(unhyphenated)) {
    return {
      formatted: `${unhyphenated.slice(0, 3)}-${unhyphenated.slice(3)}`,
      country: "BE",
      isValid: true,
      typeDesc: "Belgisch klassiek formaat",
    };
  }

  // 4. Belgian classic reversed: 3 digits + 3 letters (e.g. 123ABC or 123-ABC)
  if (/^[0-9]{3}[A-Z]{3}$/.test(unhyphenated)) {
    return {
      formatted: `${unhyphenated.slice(0, 3)}-${unhyphenated.slice(3)}`,
      country: "BE",
      isValid: true,
      typeDesc: "Belgisch klassiek formaat",
    };
  }

  // 5. Dutch RDW formats (6 characters, sidecodes)
  if (unhyphenated.length === 6) {
    const formatted = `${unhyphenated.slice(0, 2)}-${unhyphenated.slice(2, 4)}-${unhyphenated.slice(4)}`;
    return {
      formatted,
      country: "NL",
      isValid: true,
      typeDesc: "Nederlands kenteken (RDW)",
    };
  }

  // 6. Progressive typing helper for Belgian European plates
  if (/^[1-9][A-Z]{1,3}/.test(unhyphenated)) {
    let progressive = unhyphenated[0] + "-";
    const letters = unhyphenated.slice(1, 4);
    progressive += letters;
    const digits = unhyphenated.slice(4, 7);
    if (digits) {
      progressive += "-" + digits;
    }
    return {
      formatted: progressive,
      country: "BE",
      isValid: progressive.length === 9,
      typeDesc: progressive.length === 9 ? "Belgisch Europees formaat" : "Bezig met invoeren...",
    };
  }

  return {
    formatted: clean,
    country: "BE",
    isValid: clean.length >= 2,
    typeDesc: clean.length >= 2 ? "Aangepast formaat" : undefined,
  };
}

/**
 * Extracts tire size and tire brand/model from URL parameters:
 * Handles strings like "Kormoran All Season (155/65 R15)" or explicit ?size=155/65 R15
 */
function extractTyreInfoFromParams(tireParam: string | null, sizeParam: string | null) {
  let size = sizeParam?.trim() || "";
  let name = "";

  if (tireParam) {
    const rawTire = tireParam.trim();
    if (!size) {
      // 1. Check inside parentheses: e.g. "Kormoran All Season (155/65 R15)"
      const parenMatch = rawTire.match(/\(([^)]+)\)/);
      if (parenMatch && parenMatch[1]) {
        size = parenMatch[1].trim();
      } else {
        // 2. Check standard tire size pattern: e.g. "155/65 R15", "185/60 R15C", "205/55R16"
        const sizePatternMatch = rawTire.match(/(\d{3}\s*\/\s*\d{2,3}\s*[R|Z|D|B]?\s*\d{2}[C]?)/i);
        if (sizePatternMatch && sizePatternMatch[1]) {
          size = sizePatternMatch[1].trim();
        } else if (/^\d{3}\/\d{2}/.test(rawTire)) {
          size = rawTire;
        }
      }
    }
    // Extract tire name without the size portion
    name = rawTire.replace(/\([^)]*\)/, "").trim();
  }

  return { size, name };
}

function AppointmentContent() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

  // Read URL query parameters (e.g. /afspraak?service=fitting&tire=Kormoran%20All%20Season%20(155%2F65%20R15)&size=155%2F65%20R15)
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service");
  const tireParam = searchParams.get("tire");
  const sizeParam = searchParams.get("size");
  const tireIdParam = searchParams.get("tireId");
  const qtyParam = searchParams.get("qty") || searchParams.get("quantity");
  const fromCheckout = searchParams.get("from") === "checkout";

  const initialTyreInfo = extractTyreInfoFromParams(tireParam, sizeParam);

  // Mode: "book" (new appointment) or "manage" (view & manage existing appointments)
  const viewParam = searchParams.get("view") || searchParams.get("tab");
  const statusParam = searchParams.get("status");
  const sessionIdParam = searchParams.get("session_id");

  const [activeMode, setActiveMode] = useState<"book" | "manage">(() => {
    return viewParam === "manage" || viewParam === "appointments" ? "manage" : "book";
  });

  // Hybrid payment method: "on_site" (pay at workshop) or "online" (pay now via Stripe/Bancontact)
  const [paymentMethod, setPaymentMethod] = useState<"on_site" | "online">("on_site");

  useEffect(() => {
    if (viewParam === "manage" || viewParam === "appointments") {
      setActiveMode("manage");
    } else if (viewParam === "book") {
      setActiveMode("book");
    }
  }, [viewParam]);

  // Handle Stripe return redirect for online payment
  useEffect(() => {
    if (statusParam === "paid" && sessionIdParam) {
      setLoading(true);
      fetch("/api/appointments/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdParam }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.appointment) {
            setSuccessData({
              name: data.appointment.guestName || "Klant",
              email: data.appointment.guestEmail || "",
              dateTime: data.appointment.dateTime,
              type: data.appointment.type || "FITTING",
              vehicleInfo: data.appointment.vehicleInfo,
              notes: data.appointment.notes,
            });
            setCurrentStep("done");
          } else {
            setStepError(data.error || "De betaling kon niet worden bevestigd.");
          }
        })
        .catch(() => {
          setStepError("Fout bij ophalen van betalingsstatus.");
        })
        .finally(() => setLoading(false));
    } else if (statusParam === "cancelled") {
      setStepError("De online betaling is geannuleerd. U kunt hieronder opnieuw kiezen of kiezen voor betalen ter plaatse.");
    }
  }, [statusParam, sessionIdParam]);

  // Wizard state (1: Service, 2: Date & Time, 3: Vehicle, 4: Contact & Review, verify: OTP, done: Success)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form fields
  const [serviceType, setServiceType] = useState(() => {
    if (serviceParam) {
      const upper = serviceParam.toUpperCase();
      if (["FITTING", "REPAIR", "INSPECTION", "OTHER"].includes(upper)) return upper;
    }
    return "FITTING";
  });

  // Tyre source logic (only for FITTING)
  const [tyreSource, setTyreSource] = useState<"own" | "shop">(() => {
    if (tireParam || sizeParam || tireIdParam) return "shop";
    return "own";
  });
  const [tyreCount, setTyreCount] = useState<"2" | "4" | "other">("4");
  const [repairTyreCount, setRepairTyreCount] = useState<"1" | "2">("1");

  // Shop tyres catalogue state
  const [tyresCatalog, setTyresCatalog] = useState<TyreItem[]>([]);
  const [loadingTyres, setLoadingTyres] = useState(false);
  const [selectedTyreId, setSelectedTyreId] = useState<string | null>(() => {
    return tireIdParam || null;
  });
  const [tyreFilterCondition, setTyreFilterCondition] = useState<"ALL" | "NEW" | "USED">("ALL");
  const [tyreSearchQuery, setTyreSearchQuery] = useState(() => {
    return initialTyreInfo.size || initialTyreInfo.name || "";
  });
  const [shopTyreQuantity, setShopTyreQuantity] = useState<2 | 4>(() => {
    if (qtyParam === "2") return 2;
    return 4;
  });

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Smart Availability Slot state
  const [morningSlots, setMorningSlots] = useState<SlotInfo[]>([]);
  const [afternoonSlots, setAfternoonSlots] = useState<SlotInfo[]>([]);
  const [totalAvailableSlots, setTotalAvailableSlots] = useState<number | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isClosedDay, setIsClosedDay] = useState(false);

  const [vehicleBrandModel, setVehicleBrandModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [plateResult, setPlateResult] = useState<PlateCheckResult>({ formatted: "", country: "BE", isValid: false });
  const [rdwLookupLoading, setRdwLookupLoading] = useState(false);
  const [rdwVehicleFound, setRdwVehicleFound] = useState<string | null>(null);

  const [tyreSize, setTyreSize] = useState(() => {
    return initialTyreInfo.size || "";
  });
  const [notes, setNotes] = useState("");

  // Smart plate input handler with auto-format and RDW auto-lookup for NL plates
  function handlePlateInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value;
    const result = parseAndFormatPlate(input);
    setPlateResult(result);
    setVehiclePlate(result.formatted);

    // If Dutch plate detected (6 chars), automatically lookup vehicle details on RDW open data
    const cleanDutch = result.formatted.replace(/-/g, "");
    if (result.country === "NL" && cleanDutch.length === 6) {
      setRdwLookupLoading(true);
      fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${cleanDutch}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data[0]?.merk) {
            const autoModel = `${data[0].merk} ${data[0].handelsbenaming || ""}`.trim();
            setRdwVehicleFound(autoModel);
            if (!vehicleBrandModel.trim()) {
              setVehicleBrandModel(autoModel);
            }
          } else {
            setRdwVehicleFound(null);
          }
        })
        .catch(() => setRdwVehicleFound(null))
        .finally(() => setRdwLookupLoading(false));
    } else {
      setRdwVehicleFound(null);
    }
  }

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // OTP state
  const [pendingId, setPendingId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // UI state
  const [minDateStr, setMinDateStr] = useState("");
  const [stepError, setStepError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  /**
   * Compute the earliest bookable date.
   * - In-stock tyre (stock > 0) or own tyres / other service: tomorrow.
   * - Out-of-stock NEW tyre (stock === 0): add 2 business days lead time
   *   so we can order & receive the tyres in time.
   *   Rules:
   *     - Tire IN STOCK (stock > 0): earliest appointment is tomorrow (skipping Sunday)
   *     - Tire ON ORDER (stock <= 0, new tire ordered from supplier/bandenleader):
   *       * Mon/Tue/Wed order: arrives in 2-3 days -> earliest appointment +3 days (Thu/Fri/Sat)
   *       * Thu/Fri/Sat order: weekend delivery delay 4-5 days -> earliest appointment Tue/Wed/Thu (+5 days)
   *       * Sun order: 4 days -> earliest appointment Thu (+4 days)
   *       * Skip Sundays since workshop is closed on Sunday
   */
  function calcMinDate(tyre: TyreItem | undefined): string {
    const isOrderTyre =
      serviceType === "FITTING" &&
      tyreSource === "shop" &&
      tyre &&
      Number(tyre.stock) <= 0;

    const base = new Date();
    if (isOrderTyre) {
      const currentDay = base.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      let daysToAdd = 3;

      if (currentDay === 1 || currentDay === 2 || currentDay === 3) {
        // Weekdays (Mon, Tue, Wed): arrives in 2-3 business days
        daysToAdd = 3;
      } else if (currentDay === 4) {
        // Thursday: delivery comes after weekend (Mon/Tue) -> min Tuesday (+5 days)
        daysToAdd = 5;
      } else if (currentDay === 5) {
        // Friday: delivery comes after weekend (Tue/Wed) -> min Wednesday (+5 days)
        daysToAdd = 5;
      } else if (currentDay === 6) {
        // Saturday: delivery comes Wed/Thu -> min Thursday (+5 days)
        daysToAdd = 5;
      } else if (currentDay === 0) {
        // Sunday: ordered on Sunday, arrives Thu -> min Thursday (+4 days)
        daysToAdd = 4;
      }

      const tempDay = new Date(base);
      tempDay.setDate(tempDay.getDate() + daysToAdd);

      // If lands on Sunday (shop closed), push to Monday
      if (tempDay.getDay() === 0) {
        tempDay.setDate(tempDay.getDate() + 1);
      }

      const yyyy = tempDay.getFullYear();
      const mm = String(tempDay.getMonth() + 1).padStart(2, "0");
      const dd = String(tempDay.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } else {
      // Standard: earliest is tomorrow (or Monday if tomorrow is Sunday)
      const tomorrow = new Date(base);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (tomorrow.getDay() === 0) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      if (user.name) setGuestName(user.name);
      if (user.email) setGuestEmail(user.email);
    }
  }, [user]);

  // Sync state if URL query params change dynamically
  useEffect(() => {
    if (serviceParam) {
      const upper = serviceParam.toUpperCase();
      if (["FITTING", "REPAIR", "INSPECTION", "OTHER"].includes(upper)) {
        setServiceType(upper);
      }
    }
    const { size, name } = extractTyreInfoFromParams(tireParam, sizeParam);
    if (tireParam || sizeParam || tireIdParam) {
      setTyreSource("shop");
      if (size) {
        setTyreSearchQuery(size);
        setTyreSize(size);
      } else if (name) {
        setTyreSearchQuery(name);
      }
      if (tireIdParam) {
        setSelectedTyreId(tireIdParam);
      }
    } else {
      const cart = getCart();
      if (cart.length > 0) {
        const primary = cart[0];
        if (primary.size) {
          setTyreSize(primary.size);
          setTyreSearchQuery(primary.size);
        }
        if (primary.id) {
          setSelectedTyreId(primary.id);
        }
      }
    }
    if (qtyParam === "2" || qtyParam === "4") {
      setShopTyreQuantity(Number(qtyParam) as 2 | 4);
    }
  }, [serviceParam, tireParam, sizeParam, tireIdParam, qtyParam]);

  // Fetch tyres if customer wants to purchase tyres from the shop
  useEffect(() => {
    if (serviceType === "FITTING" && tyreSource === "shop" && tyresCatalog.length === 0) {
      setLoadingTyres(true);
      fetch(`/api/tyres?_t=${Date.now()}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data: TyreItem[]) => {
          if (Array.isArray(data)) {
            setTyresCatalog(data);
            if (data.length > 0) {
              const { size, name } = extractTyreInfoFromParams(tireParam, sizeParam);
              let matched: TyreItem | undefined;

              // Priority 1: Match by exact tireId or slug
              if (tireIdParam) {
                matched = data.find((t) => t.id === tireIdParam || t.slug === tireIdParam);
              }

              // Priority 2: Match by exact size AND brand/model name
              if (!matched && size && name) {
                const normSize = size.toLowerCase().replace(/[\s\/-]/g, "");
                const normName = name.toLowerCase();
                matched = data.find((t) => {
                  const tNormSize = t.size.toLowerCase().replace(/[\s\/-]/g, "");
                  const tNormFull = `${t.brand} ${t.model}`.toLowerCase();
                  return tNormSize === normSize && (tNormFull.includes(normName) || normName.includes(t.brand.toLowerCase()));
                });
              }

              // Priority 3: Match by size only (if no specific tyre name provided)
              if (!matched && size && !name) {
                const normSize = size.toLowerCase().replace(/[\s\/-]/g, "");
                matched = data.find((t) => {
                  const tNormSize = t.size.toLowerCase().replace(/[\s\/-]/g, "");
                  return tNormSize === normSize;
                });
              }

              // Priority 4: Match by name if size was not supplied
              if (!matched && name) {
                const normName = name.toLowerCase();
                matched = data.find((t) => {
                  const tNormFull = `${t.brand} ${t.model}`.toLowerCase();
                  return tNormFull.includes(normName) || normName.includes(t.brand.toLowerCase());
                });
              }

              if (matched) {
                setSelectedTyreId(matched.id);
                setTyreSize(matched.size);
              } else if (!selectedTyreId) {
                setSelectedTyreId(data[0].id);
              }
            }
          }
        })
        .catch(() => { })
        .finally(() => setLoadingTyres(false));
    }
  }, [serviceType, tyreSource, tyresCatalog.length, selectedTyreId, tireParam, sizeParam, tireIdParam]);

  // Auto-fill tyre size in step 3 if user selects a shop tyre
  const chosenShopTyre = tyresCatalog.find((t) => t.id === selectedTyreId);
  useEffect(() => {
    if (serviceType === "FITTING" && tyreSource === "shop" && chosenShopTyre) {
      setTyreSize(chosenShopTyre.size);
    }
  }, [serviceType, tyreSource, chosenShopTyre]);

  // Recalculate minimum date whenever the chosen tyre or service type changes
  useEffect(() => {
    const newMin = calcMinDate(chosenShopTyre);
    setMinDateStr(newMin);
    // If the currently selected date is before the new minimum, reset it
    if (!selectedDate || selectedDate < newMin) {
      setSelectedDate(newMin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenShopTyre?.id, chosenShopTyre?.stock, serviceType, tyreSource]);

  // Price breakdown calculations for hybrid payment model
  const isBuyingShopTyres = serviceType === "FITTING" && tyreSource === "shop" && !!chosenShopTyre;
  const currentTyreQty = isBuyingShopTyres
    ? shopTyreQuantity
    : serviceType === "FITTING"
    ? (tyreCount === "other" ? 4 : Number(tyreCount) || 4)
    : serviceType === "REPAIR"
    ? Number(repairTyreCount) || 1
    : 1;

  const tyreSubtotal = isBuyingShopTyres && chosenShopTyre ? chosenShopTyre.price * shopTyreQuantity : 0;
  const montageUnit = serviceType === "REPAIR" ? 25.0 : 19.99;
  const montageSubtotal = montageUnit * currentTyreQty;
  const grandTotal = tyreSubtotal + montageSubtotal;

  // Real-time smart availability fetching
  useEffect(() => {
    if (!selectedDate) return;

    let active = true;
    setCheckingAvailability(true);
    setStepError("");

    fetch(`/api/appointments/availability?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.closed) {
          setIsClosedDay(true);
          setMorningSlots([]);
          setAfternoonSlots([]);
          setTotalAvailableSlots(0);
          setSelectedTime("");
        } else {
          setIsClosedDay(false);
          const morning: SlotInfo[] = data.morningSlots || [];
          const afternoon: SlotInfo[] = data.afternoonSlots || [];
          setMorningSlots(morning);
          setAfternoonSlots(afternoon);
          setTotalAvailableSlots(data.totalAvailable ?? 0);

          // Verify if currently selected time is still available
          if (selectedTime) {
            const allSlots = [...morning, ...afternoon];
            const currentSlot = allSlots.find((s) => s.time === selectedTime);
            if (!currentSlot || !currentSlot.available) {
              setSelectedTime("");
            }
          }
        }
      })
      .catch(() => {
        if (active) {
          setIsClosedDay(false);
        }
      })
      .finally(() => {
        if (active) setCheckingAvailability(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDate, selectedTime]);

  // Resend countdown timer for OTP
  useEffect(() => {
    if (currentStep !== "verify") return;
    setCanResend(false);
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, pendingId]);

  // Quick date selector helpers
  function setQuickDate(daysAhead: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    if (d.getDay() === 0) {
      // Sunday closed -> shift to Monday
      d.setDate(d.getDate() + 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }

  // ── Validation before next step ──────────────────────────────────────────────
  function goToStep(targetStep: number) {
    setStepError("");

    if (targetStep > 1) {
      if (!serviceType) {
        setStepError("Kies eerst een gewenste dienst.");
        return;
      }
      if (serviceType === "FITTING" && tyreSource === "shop" && !selectedTyreId) {
        setStepError("Selecteer a.u.b. een gewenste band uit onze catalogus of kies voor 'Eigen banden'.");
        return;
      }
    }

    if (targetStep > 2) {
      if (!selectedDate) {
        setStepError("Selecteer een datum voor uw afspraak.");
        return;
      }
      if (isClosedDay) {
        setStepError("Op deze dag zijn wij gesloten. Kies een andere openingsdag.");
        return;
      }
      if (!selectedTime) {
        setStepError("Kies een beschikbaar tijdstip.");
        return;
      }
    }

    setCurrentStep(targetStep as WizardStep);
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  // Filter tyres by condition and search term
  const filteredTyres = tyresCatalog.filter((t) => {
    if (tyreFilterCondition !== "ALL" && t.condition !== tyreFilterCondition) return false;
    if (tyreSearchQuery.trim()) {
      const q = tyreSearchQuery.toLowerCase().trim();
      const normQ = q.replace(/[\s\/-]/g, "");
      const normSize = t.size.toLowerCase().replace(/[\s\/-]/g, "");
      const fullText = `${t.brand} ${t.model} ${t.size}`.toLowerCase();

      const matchBrand = t.brand.toLowerCase().includes(q);
      const matchModel = t.model.toLowerCase().includes(q);
      const matchSize = t.size.toLowerCase().includes(q) || (normQ.length >= 3 && normSize.includes(normQ));
      const matchFull = fullText.includes(q);

      // Check multi-word tokens (e.g. "Kormoran 155/65 R15" or "155/65 R15")
      const words = q.split(/\s+/).filter(Boolean);
      const matchesAllWords = words.length > 1 && words.every((w) => {
        const normW = w.replace(/[\s\/-]/g, "");
        return (
          t.brand.toLowerCase().includes(w) ||
          t.model.toLowerCase().includes(w) ||
          t.size.toLowerCase().includes(w) ||
          (normW.length >= 3 && normSize.includes(normW))
        );
      });

      return matchBrand || matchModel || matchSize || matchFull || matchesAllWords;
    }
    return true;
  });

  // ── Final booking submission ─────────────────────────────────────────────────
  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStepError("");

    if (!user) {
      if (!guestName.trim()) {
        setStepError("Gelieve uw naam in te vullen.");
        return;
      }
      if (!guestPhone.trim()) {
        setStepError("Gelieve uw telefoonnummer in te vullen.");
        return;
      }
      if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        setStepError("Gelieve een geldig e-mailadres in te vullen.");
        return;
      }
    }

    if (!selectedDate || !selectedTime) {
      setStepError("Datum of tijdstip ontbreekt. Ga terug naar stap 2.");
      return;
    }

    const combinedDateTime = `${selectedDate}T${selectedTime}:00`;

    // Construct rich tyre & service description
    let tyreDetails = "";
    if (serviceType === "FITTING") {
      if (tyreSource === "shop" && chosenShopTyre) {
        const totalTyrePrice = (chosenShopTyre.price * shopTyreQuantity).toFixed(2);
        tyreDetails = `Aankoop & montage: ${shopTyreQuantity}x ${chosenShopTyre.brand} ${chosenShopTyre.model} (${chosenShopTyre.size}) - €${totalTyrePrice}`;
      } else {
        tyreDetails = `Eigen banden meegenomen (${tyreCount === "other" ? "Anders" : `${tyreCount} banden`})`;
      }
    } else if (serviceType === "REPAIR") {
      tyreDetails = `Bandenreparatie (${repairTyreCount} ${repairTyreCount === "1" ? "band" : "banden"})`;
    } else if (serviceType === "INSPECTION") {
      tyreDetails = "Inspectie / wielencontrole";
    } else {
      tyreDetails = "Advies / Maatwerk";
    }

    const fullVehicleInfo = [
      vehicleBrandModel.trim(),
      vehiclePlate.trim() ? `[${vehiclePlate.trim()}]` : "",
      tyreSize.trim() ? `Maat: ${tyreSize.trim()}` : "",
      tyreDetails,
    ]
      .filter(Boolean)
      .join(" - ");

    const finalNotes = [
      notes.trim(),
      serviceType === "FITTING" && tyreSource === "shop" && chosenShopTyre
        ? `[Reservering stock: ${shopTyreQuantity}x ${chosenShopTyre.brand} ${chosenShopTyre.model} ${chosenShopTyre.size} @ €${chosenShopTyre.price}/st]`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const payload = {
      guestName: user?.name || guestName.trim(),
      guestEmail: user?.email || guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      type: serviceType,
      dateTime: combinedDateTime,
      vehicleInfo: fullVehicleInfo || undefined,
      notes: finalNotes || undefined,
    };

    setLoading(true);

    // Hybrid flow: If customer chose direct online checkout
    if (paymentMethod === "online") {
      try {
        const checkoutRes = await fetch("/api/checkout/appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentData: payload,
            tyreId: isBuyingShopTyres && chosenShopTyre ? chosenShopTyre.id : undefined,
            quantity: currentTyreQty,
            payTires: isBuyingShopTyres,
            withMontage: true,
          }),
        });

        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok) {
          setStepError(checkoutData.error || "Fout bij starten van online betaling.");
          setLoading(false);
          return;
        }

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        } else {
          setStepError("Geen betaallink ontvangen van de betaalprovider.");
          setLoading(false);
          return;
        }
      } catch {
        setStepError("Verbindingsfout bij het starten van de online betaling.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/appointments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStepError(data.error ?? "Er is iets misgegaan bij het indienen.");
        return;
      }

      if (data.step === "done") {
        setSuccessData({
          name: payload.guestName,
          email: payload.guestEmail,
          dateTime: combinedDateTime,
          type: serviceType,
          vehicleInfo: fullVehicleInfo,
          notes: finalNotes,
        });
        setCurrentStep("done");
      } else {
        setPendingId(data.pendingId);
        setOtp(["", "", "", "", "", ""]);
        setCurrentStep("verify");
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      }
    } catch {
      setStepError("Verbindingsfout. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP Handlers ─────────────────────────────────────────────────────────────
  function handleOtpInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (digit && next.every((d) => d !== "")) {
      submitOtp(next.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      e.preventDefault();
      submitOtp(text);
    }
  }

  async function submitOtp(code: string) {
    setStepError("");
    setLoading(true);
    try {
      const res = await fetch("/api/appointments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStepError(data.error ?? "Onjuiste verificatiecode.");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        return;
      }

      const combinedDateTime = `${selectedDate}T${selectedTime}:00`;
      setSuccessData({
        name: guestName,
        email: guestEmail,
        dateTime: combinedDateTime,
        type: serviceType,
        vehicleInfo: vehicleBrandModel,
        notes: notes,
      });
      setCurrentStep("done");
    } catch {
      setStepError("Verbindingsfout bij verificatie.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setStepError("");
    setLoading(true);
    try {
      const combinedDateTime = `${selectedDate}T${selectedTime}:00`;
      const res = await fetch("/api/appointments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          guestEmail,
          guestPhone,
          type: serviceType,
          dateTime: combinedDateTime,
          vehicleInfo: vehicleBrandModel,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStepError(data.error ?? "Kon geen nieuwe code sturen.");
      } else {
        setPendingId(data.pendingId);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } catch {
      setStepError("Fout bij opnieuw verzenden.");
    } finally {
      setLoading(false);
    }
  }

  const selectedServiceObj = APPOINTMENT_TYPES.find((t) => t.value === serviceType);

  // Formatter for readable dates
  function formatHumanDate(dateStr: string) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr + "T12:00:00");
      return d.toLocaleDateString("nl-BE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  // ── Step 6: Confirmation Screen ──────────────────────────────────────────────
  if (currentStep === "done" && successData) {
    const formattedDt = new Date(successData.dateTime).toLocaleString("nl-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Afspraak Gent Bandenservice (${selectedServiceObj?.label || "Banden"})`
    )}&dates=${new Date(successData.dateTime).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(
      new Date(successData.dateTime).getTime() + 45 * 60000
    )
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(
        `Afspraak bij Gent Bandenservice BV voor ${selectedServiceObj?.label || "Banden"}`
      )}&location=${encodeURIComponent("Gent Bandenservice BV, Gent")}`;

    return (
      <div className="appt-page-wrap appt-page-wrap--standalone">
        <div className="appt-container">
          <div className="appt-success-card">
            <div className="appt-success-icon-wrap">
              <span className="appt-success-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <CheckIcon size={28} />
              </span>
            </div>

            <div className="appt-success-badge">Afspraak Bevestigd</div>
            <h1 className="appt-success-title">Bedankt, {successData.name}!</h1>
            <p className="appt-success-sub">
              Uw afspraak is succesvol geregistreerd. Een bevestigingsmail met alle details is verzonden naar{" "}
              <strong>{successData.email}</strong>.
            </p>

            <div className="appt-summary-box">
              <div className="appt-summary-row">
                <span className="appt-summary-label">Dienst:</span>
                <span className="appt-summary-val font-semibold" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {selectedServiceObj?.icon} <span>{selectedServiceObj?.label}</span>
                </span>
              </div>
              <div className="appt-summary-row">
                <span className="appt-summary-label">Tijdstip:</span>
                <span className="appt-summary-val font-semibold text-primary">{formattedDt}</span>
              </div>
              {successData.vehicleInfo && (
                <div className="appt-summary-row">
                  <span className="appt-summary-label">Voertuig & Details:</span>
                  <span className="appt-summary-val">{successData.vehicleInfo}</span>
                </div>
              )}
              <div className="appt-summary-row">
                <span className="appt-summary-label">Locatie:</span>
                <span className="appt-summary-val">Gent Bandenservice BV</span>
              </div>
            </div>

            <div className="appt-info-callout">
              <span className="appt-info-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                <LightbulbIcon size={20} />
              </span>
              <div className="appt-info-content">
                <strong>Handig om te weten:</strong> We verzoeken u vriendelijk 5 tot 10 minuten voor aanvang aanwezig te zijn. Mocht u verhinderd zijn, laat het ons tijdig weten via telefoon of e-mail.
              </div>
            </div>

            <div className="appt-success-buttons">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setActiveMode("manage");
                }}
                className="appt-btn appt-btn--primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <ClipboardListIcon size={18} />
                <span>Mijn afspraak bekijken &amp; beheren →</span>
              </button>
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="appt-btn appt-btn--outline"
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <CalendarIcon size={18} />
                <span>Toevoegen aan Google Agenda</span>
              </a>
              <Link href="/banden" className="appt-btn appt-btn--outline">
                Bandencatalogus bekijken
              </Link>
            </div>

            <Link href="/" className="appt-back-link">
              ← Terug naar homepagina
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 5: OTP Verification Screen ──────────────────────────────────────────
  if (currentStep === "verify") {
    return (
      <div className="appt-page-wrap appt-page-wrap--standalone">
        <div className="appt-container">
          <div className="appt-otp-card">
            <div className="appt-step-header text-center">
              <span className="appt-step-pill">Stap 5 van 5 • Verificatie</span>
              <div
                className="appt-otp-avatar"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(1, 110, 185, 0.1)",
                  color: "var(--primary)",
                  margin: "0 auto 12px",
                }}
              >
                <LockIcon size={26} />
              </div>
              <h2 className="appt-step-title">Verifieer uw e-mailadres</h2>
              <p className="appt-step-desc">
                We hebben een 6-cijferige verificatiecode verstuurd naar{" "}
                <strong className="text-primary">{guestEmail}</strong>.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submitOtp(otp.join("")); }} className="appt-otp-form">
              <div className="appt-otp-boxes" onPaste={handleOtpPaste}>
                {otp.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpInput(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`appt-otp-box ${val ? "appt-otp-box--filled" : ""}`}
                    disabled={loading}
                    autoComplete="one-time-code"
                    aria-label={`Code cijfer ${idx + 1}`}
                  />
                ))}
              </div>

              {stepError && <div className="appt-alert-error">{stepError}</div>}

              <button
                type="submit"
                className="appt-btn appt-btn--primary appt-btn--full"
                disabled={loading || otp.some((d) => !d)}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {loading ? (
                  <span className="appt-spinner" />
                ) : (
                  <>
                    <CheckIcon size={16} />
                    <span>Afspraak Bevestigen</span>
                  </>
                )}
              </button>
            </form>

            <div className="appt-otp-footer">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="appt-resend-link"
                  disabled={loading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <MailIcon size={15} />
                  <span>Geen code ontvangen? Stuur opnieuw</span>
                </button>
              ) : (
                <span className="appt-resend-timer">
                  Nieuwe code mogelijk over <strong>{resendTimer}s</strong>
                </span>
              )}
              <button
                type="button"
                onClick={() => { setCurrentStep(4); setStepError(""); }}
                className="appt-secondary-action"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <EditIcon size={15} />
                <span>E-mailadres aanpassen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1 - 4: Multi-Step Wizard ────────────────────────────────────────────
  return (
    <>
      {/* Hero Header with generous top padding to clear fixed header logo */}
      <div className="page-hero bg-dark">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>{activeMode === "manage" ? "Afspraken beheren" : "Afspraak maken"}</span>
          </div>
          <h1 className="h1 text-white" style={{ marginTop: 14 }}>
            {activeMode === "manage" ? "Mijn Afspraken Beheren" : "Online Afspraak Maken"}
          </h1>
          <p className="page-hero__sub">
            {activeMode === "manage"
              ? "Bekijk, verzet of annuleer uw geplande afspraken in onze werkplaats"
              : "Plan uw bandenwissel, montage of herstelling in 4 eenvoudige stappen met live beschikbaarheid"}
          </p>
        </div>
      </div>

      <div className="appt-page-wrap">
        <div className="appt-container">
          {/* Main Mode Toggle: Nieuwe afspraak vs Mijn afspraken beheren */}
          {fromCheckout && (
            <div
              className="appt-checkout-banner"
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "12px",
                padding: "14px 18px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.3rem" }}>🔧</span>
                <div>
                  <strong style={{ color: "#1e40af", fontSize: "0.92rem" }}>
                    Montage inplannen voor uw geselecteerde banden
                  </strong>
                  <p style={{ margin: "2px 0 0", color: "#3b82f6", fontSize: "0.82rem" }}>
                    Uw bandenmaat {tyreSize ? <strong>({tyreSize})</strong> : ""} is automatisch overgenomen. Uw winkelmand blijft bewaard.
                  </p>
                </div>
              </div>
              <Link
                href="/checkout"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1d4ed8",
                  textDecoration: "underline",
                  whiteSpace: "nowrap",
                }}
              >
                ← Terug naar winkelmand
              </Link>
            </div>
          )}

          <div className="appt-mode-toggle-wrap">
            <button
              type="button"
              className={`appt-mode-toggle-btn ${activeMode === "book" ? "appt-mode-toggle-btn--active" : ""}`}
              onClick={() => setActiveMode("book")}
            >
              <span className="appt-mode-icon">
                <CalendarIcon size={16} />
              </span>
              <span>Nieuwe afspraak maken</span>
            </button>
            <button
              type="button"
              className={`appt-mode-toggle-btn ${activeMode === "manage" ? "appt-mode-toggle-btn--active" : ""}`}
              onClick={() => setActiveMode("manage")}
            >
              <span className="appt-mode-icon">
                <ClipboardListIcon size={16} />
              </span>
              <span>Mijn afspraken beheren</span>
            </button>
          </div>

          {activeMode === "manage" ? (
            <ManageAppointments
              onBookNew={() => {
                setActiveMode("book");
                setCurrentStep(1);
              }}
              initialEmail={user?.email || ""}
            />
          ) : (
            <>
              {/* Stepper Progress Bar */}
              <div className="appt-stepper" aria-label="Voortgang afspraak">
            {[
              { num: 1, label: "Dienst", icon: <TyreIcon size={16} /> },
              { num: 2, label: "Datum & Uur", icon: <ClockIcon size={16} /> },
              { num: 3, label: "Voertuig", icon: <CarIcon size={16} /> },
              { num: 4, label: "Gegevens", icon: <UserIcon size={16} /> },
            ].map((s) => {
              const isPast = typeof currentStep === "number" && currentStep > s.num;
              const isActive = currentStep === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => goToStep(s.num)}
                  disabled={typeof currentStep === "number" && currentStep < s.num}
                  className={`appt-step-btn ${isActive ? "appt-step-btn--active" : ""} ${isPast ? "appt-step-btn--completed" : ""
                    }`}
                >
                  <div className="appt-step-circle">
                    {isPast ? <CheckIcon size={14} /> : s.icon}
                  </div>
                  <span className="appt-step-label">
                    <span className="appt-step-sub">Stap {s.num}</span>
                    <span className="appt-step-main">{s.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* User Logged-in Notice */}
          {user && (
            <div className="appt-auth-badge">
              <span className="appt-auth-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                <ShieldCheckIcon size={16} />
              </span>
              <span>
                Ingelogd als <strong>{user.name}</strong> ({user.email}) — uw afspraak wordt direct bevestigd zonder e-mailcode.
              </span>
            </div>
          )}

          {/* Error Message */}
          {stepError && <div className="appt-alert-error" role="alert">{stepError}</div>}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 1: SELECT SERVICE & SMART TYRE OPTIONS
              ───────────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="appt-step-card animate-step">
              <div className="appt-step-heading">
                <span className="appt-step-badge">Stap 1 van 4</span>
                <h2 className="appt-step-title">Kies het gewenste type service</h2>
                <p className="appt-step-desc">
                  Selecteer de werkzaamheden die wij voor u mogen uitvoeren in onze werkplaats.
                </p>
              </div>

              {/* Service Selection Grid */}
              <div className="appt-service-grid">
                {APPOINTMENT_TYPES.map((type) => {
                  const isSelected = serviceType === type.value;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setServiceType(type.value)}
                      className={`appt-service-card ${isSelected ? "appt-service-card--selected" : ""}`}
                    >
                      <div className="appt-service-header">
                        <span className="appt-service-icon" style={{ display: "inline-flex", alignItems: "center", color: isSelected ? "var(--primary)" : "inherit" }}>
                          {type.icon}
                        </span>
                        <span className="appt-service-duration">{type.duration}</span>
                      </div>
                      <h3 className="appt-service-name">{type.label}</h3>
                      <p className="appt-service-desc">{type.desc}</p>
                      <div className="appt-service-selector">
                        <span className={`appt-radio-dot ${isSelected ? "appt-radio-dot--checked" : ""}`} />
                        <span className="appt-radio-text">
                          {isSelected ? "Geselecteerd" : "Kiezen"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── CASE 1: FITTING (User may have own tyres OR buy from shop) ── */}
              {serviceType === "FITTING" && (
                <div className="appt-service-extra-box">
                  <label className="appt-subgroup-label text-base font-bold">
                    Heeft u al eigen banden, of wilt u banden bij ons aankopen?
                  </label>

                  <div className="appt-source-grid">
                    {/* Option 1: Own tyres */}
                    <div
                      onClick={() => setTyreSource("own")}
                      className={`appt-source-card ${tyreSource === "own" ? "appt-source-card--active" : ""}`}
                    >
                      <div className="appt-source-header">
                        <span className="appt-source-icon" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)" }}>
                          <PackageIcon size={20} />
                        </span>
                        <span className="appt-source-title">Ik heb al eigen banden</span>
                      </div>
                      <p className="appt-source-desc">
                        U brengt uw eigen nieuwe of gebruikte banden mee (bijv. in de kofferbak) voor professionele montage en balanceren.
                      </p>
                      <div className="appt-source-radio">
                        <span className={`appt-radio-dot ${tyreSource === "own" ? "appt-radio-dot--checked" : ""}`} />
                        <span className="text-xs font-semibold">{tyreSource === "own" ? "Gekozen" : "Selecteren"}</span>
                      </div>
                    </div>

                    {/* Option 2: Buy from shop */}
                    <div
                      onClick={() => setTyreSource("shop")}
                      className={`appt-source-card ${tyreSource === "shop" ? "appt-source-card--active" : ""}`}
                    >
                      <div className="appt-source-header">
                        <span className="appt-source-icon" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)" }}>
                          <ShoppingCartIcon size={20} />
                        </span>
                        <span className="appt-source-title">Banden aankopen bij Gent Bandenservice</span>
                      </div>
                      <p className="appt-source-desc">
                        Kies direct uit onze ruime werkplaatsvoorraad nieuwe of geteste tweedehands banden van topmerken.
                      </p>
                      <div className="appt-source-radio">
                        <span className={`appt-radio-dot ${tyreSource === "shop" ? "appt-radio-dot--checked" : ""}`} />
                        <span className="text-xs font-semibold">{tyreSource === "shop" ? "Gekozen" : "Selecteren"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-section A: Own tyres quantity */}
                  {tyreSource === "own" && (
                    <div className="appt-subgroup" style={{ marginTop: 18 }}>
                      <label className="appt-subgroup-label">Aantal banden dat u meebrengt voor montage:</label>
                      <div className="appt-pill-group">
                        {(
                          [
                            { id: "2", label: "2 banden (voor- of achteras)" },
                            { id: "4", label: "4 banden (complete set)" },
                            { id: "other", label: "1 band / anders" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTyreCount(opt.id)}
                            className={`appt-pill ${tyreCount === opt.id ? "appt-pill--active" : ""}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-section B: Buy tyres from shop - Catalogue browser */}
                  {tyreSource === "shop" && (
                    <div className="appt-shop-tyre-section">
                      <div className="appt-shop-tyre-header">
                        <div>
                          <h4 className="font-bold text-dark text-base">Selecteer uw gewenste banden uit onze voorraad</h4>
                          <p className="text-xs text-muted">Kies een band en het aantal stuks voor uw afspraak.</p>
                        </div>
                        {/* Quantity switch */}
                        <div className="appt-qty-switch">
                          <span className="text-xs font-semibold text-muted">Aantal:</span>
                          <button
                            type="button"
                            onClick={() => setShopTyreQuantity(2)}
                            className={`appt-qty-btn ${shopTyreQuantity === 2 ? "appt-qty-btn--active" : ""}`}
                          >
                            2 stuks
                          </button>
                          <button
                            type="button"
                            onClick={() => setShopTyreQuantity(4)}
                            className={`appt-qty-btn ${shopTyreQuantity === 4 ? "appt-qty-btn--active" : ""}`}
                          >
                            4 stuks (set)
                          </button>
                        </div>
                      </div>

                      {/* Search & Filter controls */}
                      <div className="appt-tyre-controls">
                        <div style={{ position: "relative", flex: 1 }}>
                          <input
                            type="text"
                            placeholder="Zoek op maat (bv. 205/55 R16) of merk (bv. Michelin)..."
                            value={tyreSearchQuery}
                            onChange={(e) => setTyreSearchQuery(e.target.value)}
                            className="appt-input appt-tyre-search"
                            style={{ width: "100%", paddingRight: tyreSearchQuery ? 32 : undefined }}
                          />
                          {tyreSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setTyreSearchQuery("")}
                              style={{
                                position: "absolute",
                                right: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                color: "var(--muted)",
                                cursor: "pointer",
                                padding: 4,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Zoekopdracht wissen"
                            >
                              <XIcon size={14} />
                            </button>
                          )}
                        </div>
                        <div className="appt-condition-tabs">
                          <button
                            type="button"
                            onClick={() => setTyreFilterCondition("ALL")}
                            className={`appt-cond-tab ${tyreFilterCondition === "ALL" ? "appt-cond-tab--active" : ""}`}
                          >
                            Alle
                          </button>
                          <button
                            type="button"
                            onClick={() => setTyreFilterCondition("NEW")}
                            className={`appt-cond-tab ${tyreFilterCondition === "NEW" ? "appt-cond-tab--active" : ""}`}
                          >
                            Nieuw
                          </button>
                          <button
                            type="button"
                            onClick={() => setTyreFilterCondition("USED")}
                            className={`appt-cond-tab ${tyreFilterCondition === "USED" ? "appt-cond-tab--active" : ""}`}
                          >
                            Tweedehands
                          </button>
                        </div>
                      </div>

                      {/* Tyre cards list */}
                      {loadingTyres ? (
                        <div className="appt-tyres-loading">
                          <span className="appt-spinner-dark" />
                          <span>Bandencatalogus laden...</span>
                        </div>
                      ) : filteredTyres.length === 0 ? (
                        <div className="appt-tyres-empty">
                          <p>Geen banden gevonden met &quot;{tyreSearchQuery}&quot;.</p>
                          <button
                            type="button"
                            onClick={() => { setTyreSearchQuery(""); setTyreFilterCondition("ALL"); }}
                            className="appt-btn appt-btn--outline btn--sm mt-2"
                          >
                            Filters wissen
                          </button>
                        </div>
                      ) : (
                        <div className="appt-tyres-scrollable-grid">
                          {filteredTyres.map((t) => {
                            const isChosen = selectedTyreId === t.id;
                            const totalPrice = (t.price * shopTyreQuantity).toFixed(2);
                            const imgUrl = t.images?.[0]?.url || (t.condition === "NEW" ? "/nieuw-banden.png" : "/tweedehands-banden.png");

                            return (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTyreId(t.id)}
                                className={`appt-tyre-item-card ${isChosen ? "appt-tyre-item-card--chosen" : ""}`}
                              >
                                <div className="appt-tyre-thumb">
                                  <Image
                                    src={imgUrl}
                                    alt={`${t.brand} ${t.model}`}
                                    width={56}
                                    height={56}
                                    className="object-contain"
                                    unoptimized
                                  />
                                </div>
                                <div className="appt-tyre-info">
                                  <div className="appt-tyre-brand-line">
                                    <span className="appt-tyre-brand font-bold">{t.brand}</span>
                                    <span className="appt-tyre-model">{t.model}</span>
                                    <span className={`appt-badge-cond ${t.condition === "NEW" ? "appt-badge-cond--new" : "appt-badge-cond--used"}`}>
                                      {t.condition === "NEW" ? "Nieuw" : `Gebruikt${t.treadDepth ? ` • ${t.treadDepth}mm` : ""}`}
                                    </span>
                                  </div>
                                  <div className="appt-tyre-size-line">
                                    <span className="appt-tyre-size font-semibold text-primary">{t.size}</span>
                                    <span className="appt-tyre-season text-xs text-muted" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                      {t.season === "SUMMER" ? (
                                        <>
                                          <SunIcon size={12} />
                                          <span>Zomer</span>
                                        </>
                                      ) : t.season === "WINTER" ? (
                                        <>
                                          <SnowflakeIcon size={12} />
                                          <span>Winter</span>
                                        </>
                                      ) : (
                                        <>
                                          <LeafIcon size={12} />
                                          <span>All-season</span>
                                        </>
                                      )}
                                    </span>
                                    {t.stock > 0 ? (
                                      <span className="appt-tyre-stock text-xs text-emerald-700 font-medium">● Direct op voorraad</span>
                                    ) : (
                                      <span className="appt-tyre-stock text-xs text-blue-700 font-medium">● Levertijd 2–3 werkdagen</span>
                                    )}
                                  </div>
                                </div>
                                <div className="appt-tyre-pricing">
                                  <span className="appt-tyre-unit-price font-bold text-dark">€{t.price.toFixed(2)} <span className="text-xs font-normal text-muted">/st</span></span>
                                  <span className="appt-tyre-total-price text-xs font-semibold text-primary">
                                    {shopTyreQuantity}x = €{totalPrice}
                                  </span>
                                  <div className={`appt-tyre-check ${isChosen ? "appt-tyre-check--checked" : ""}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                    {isChosen ? (
                                      <>
                                        <CheckIcon size={13} />
                                        <span>Gekozen</span>
                                      </>
                                    ) : (
                                      "Kiezen"
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Summary banner of chosen tyre */}
                      {chosenShopTyre && (
                        <div className="appt-tyre-selected-banner">
                          <span className="text-xl" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)" }}>
                            <TyreIcon size={22} />
                          </span>
                          <div className="flex-grow">
                            <span className="text-xs text-muted block">Geselecteerde aankoop bij montage:</span>
                            <strong className="text-sm text-dark">
                              {shopTyreQuantity}x {chosenShopTyre.brand} {chosenShopTyre.model} ({chosenShopTyre.size}) — €{(chosenShopTyre.price * shopTyreQuantity).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── CASE 2: REPAIR (Tyre selection NOT needed - just repair count) ── */}
              {serviceType === "REPAIR" && (
                <div className="appt-service-info-box">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)" }}>
                      <WrenchIcon size={24} />
                    </span>
                    <div>
                      <strong className="text-dark block font-bold text-sm">Bandenreparatie in onze werkplaats</strong>
                      <span className="text-xs text-muted">
                        Wij herstellen uw lekke band met een vakkundige prop of binnenband-vulcanisatie. U hoeft geen banden aan te kopen.
                      </span>
                    </div>
                  </div>
                  <div className="appt-subgroup" style={{ marginTop: 12 }}>
                    <label className="appt-subgroup-label">Aantal te herstellen banden:</label>
                    <div className="appt-pill-group">
                      <button
                        type="button"
                        onClick={() => setRepairTyreCount("1")}
                        className={`appt-pill ${repairTyreCount === "1" ? "appt-pill--active" : ""}`}
                      >
                        1 lekke band (standaard)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepairTyreCount("2")}
                        className={`appt-pill ${repairTyreCount === "2" ? "appt-pill--active" : ""}`}
                      >
                        2 banden
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CASE 3: INSPECTION (No tyre selection needed) ── */}
              {serviceType === "INSPECTION" && (
                <div className="appt-service-info-box">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)" }}>
                      <SearchIcon size={24} />
                    </span>
                    <div>
                      <strong className="text-dark block font-bold text-sm">Inspectie & Wielenwissel</strong>
                      <span className="text-xs text-muted">
                        Onze monteurs controleren uw bandenspanning, profieldiepte, loopvlak en algemene slijtage. Er is geen bandenselectie nodig; wij werken aan uw huidige wielen.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CASE 4: OTHER (No tyre selection needed) ── */}
              {serviceType === "OTHER" && (
                <div className="appt-service-info-box">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)" }}>
                      <MessageSquareIcon size={24} />
                    </span>
                    <div>
                      <strong className="text-dark block font-bold text-sm">Maatwerk of Specialistisch Advies</strong>
                      <span className="text-xs text-muted">
                        Geen bandenselectie nodig in deze stap. In stap 3 kunt u uw wensen, velgen of specifieke vragen vrij toelichten.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="appt-nav-actions">
                <div />
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="appt-btn appt-btn--primary appt-btn--lg"
                >
                  Volgende stap: Datum & Tijd →
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 2: DATE & TIME (SMART AVAILABILITY)
              ───────────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="appt-step-card animate-step">
              <div className="appt-step-heading">
                <span className="appt-step-badge">Stap 2 van 4</span>
                <h2 className="appt-step-title">Kies een datum en tijdstip</h2>
                <p className="appt-step-desc">
                  Beschikbare tijdsloten worden automatisch in real-time gecontroleerd.
                </p>
              </div>

              <div className="appt-datetime-layout">
                {/* Date selection */}
                <div className="appt-date-section">
                  <label className="appt-field-label">1. Kies een datum *</label>

                  {/* ── Lead-time notice for out-of-stock tyres ─────── */}
                  {serviceType === "FITTING" &&
                    tyreSource === "shop" &&
                    chosenShopTyre &&
                    Number(chosenShopTyre.stock) <= 0 && (
                    <div className="appt-leadtime-notice" role="status">
                      <span className="appt-leadtime-icon" aria-hidden="true">
                        <PackageIcon size={18} />
                      </span>
                      <div className="appt-leadtime-body">
                        <strong>Levering via centrale voorraad (2–3 werkdagen)</strong>
                        <p>
                          Voor <strong>{chosenShopTyre.brand} {chosenShopTyre.model} ({chosenShopTyre.size})</strong> worden uw banden tijdig klaargezet via onze leverancier. Uw vroegst mogelijke montagedatum is{" "}
                          <strong>
                            {new Date(minDateStr + "T12:00:00").toLocaleDateString("nl-BE", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── In-stock confirmation badge ─────────────────── */}
                  {serviceType === "FITTING" &&
                    tyreSource === "shop" &&
                    chosenShopTyre &&
                    Number(chosenShopTyre.stock) > 0 && (
                    <div className="appt-instock-notice" role="status">
                      <span aria-hidden="true">✓</span>
                      <span>
                        <strong>{chosenShopTyre.brand} {chosenShopTyre.model} ({chosenShopTyre.size})</strong> is direct op voorraad in onze werkplaats — montage is al mogelijk vanaf <strong>morgen</strong>.
                      </span>
                    </div>
                  )}

                  {/* Quick date picks */}
                  <div className="appt-quick-dates">
                    {/* Dynamically compute quick-pick dates that respect minDateStr */}
                    {(() => {
                      const min = minDateStr ? new Date(minDateStr + "T12:00:00") : new Date();

                      function nextOpen(base: Date, extraDays: number): string {
                        const d = new Date(base);
                        let added = 0;
                        while (added < extraDays) {
                          d.setDate(d.getDate() + 1);
                          if (d.getDay() !== 0) added++;
                        }
                        if (d.getDay() === 0) d.setDate(d.getDate() + 1);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      }

                      function labelFor(dateStr: string): string {
                        const d = new Date(dateStr + "T12:00:00");
                        return d.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });
                      }

                      const q1 = minDateStr; // earliest available
                      const q2 = nextOpen(min, 1);
                      const q3 = nextOpen(min, 2);

                      return [
                        { label: labelFor(q1), date: q1, hint: "Vroegste dag" },
                        { label: labelFor(q2), date: q2, hint: "+1 dag" },
                        { label: labelFor(q3), date: q3, hint: "+2 dagen" },
                      ].map(({ label, date, hint }) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          className={`appt-quick-date-btn ${selectedDate === date ? "appt-quick-date-btn--active" : ""}`}
                          title={hint}
                        >
                          {label}
                        </button>
                      ));
                    })()}
                  </div>

                  <input
                    type="date"
                    min={minDateStr}
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value >= minDateStr) {
                        setSelectedDate(e.target.value);
                      }
                    }}
                    className="appt-input appt-date-input"
                    required
                  />

                  {isClosedDay && (
                    <div className="appt-sunday-warning">
                      <AlertTriangleIcon size={16} />
                      <span>Wij zijn op <strong>zondag gesloten</strong>. Gelieve een werkdag of zaterdag te selecteren.</span>
                    </div>
                  )}

                  <div className="appt-opening-box">
                    <strong><ClockIcon size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />Openingsuren:</strong>
                    <div>Maandag – Vrijdag: 08:00 – 18:00</div>
                    <div>Zaterdag: 09:00 – 18:30</div>
                    <div>Zondag: Gesloten</div>
                  </div>
                </div>

                {/* Time selection */}
                <div className="appt-time-section">
                  <div className="appt-time-section-header">
                    <label className="appt-field-label">
                      2. Kies een tijdstip *
                    </label>

                    {/* Live availability indicator */}
                    {!isClosedDay && (
                      <span className="appt-avail-pill">
                        {checkingAvailability ? (
                          <span className="appt-avail-loading">Controleer sloten...</span>
                        ) : totalAvailableSlots !== null ? (
                          totalAvailableSlots > 0 ? (
                            <span className="text-emerald-700 font-semibold" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                              {totalAvailableSlots} slot{totalAvailableSlots === 1 ? "" : "en"} vrij
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <XCircleIcon size={14} /> Volzet op deze dag
                            </span>
                          )
                        ) : null}
                      </span>
                    )}
                  </div>

                  {isClosedDay ? (
                    <p className="appt-closed-msg">Kies eerst een openingsdag (maandag t.e.m. zaterdag).</p>
                  ) : checkingAvailability && morningSlots.length === 0 ? (
                    <div className="appt-slots-loading-box">
                      <span className="appt-spinner-dark" />
                      <span>Beschikbaarheid ophalen...</span>
                    </div>
                  ) : (
                    <>
                      {/* Morning slots */}
                      <div className="appt-timeslot-group">
                        <span className="appt-timeslot-group-title" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <SunriseIcon size={16} /> Ochtend
                        </span>
                        <div className="appt-slots-grid">
                          {morningSlots.map((slot) => {
                            const isSelected = selectedTime === slot.time;
                            const isClickable = slot.available;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!isClickable}
                                onClick={() => isClickable && setSelectedTime(slot.time)}
                                title={slot.reason}
                                className={`appt-slot-btn ${isSelected ? "appt-slot-btn--selected" : ""
                                  } ${slot.booked ? "appt-slot-btn--booked" : ""} ${slot.isPast ? "appt-slot-btn--past" : ""
                                  }`}
                              >
                                <span className="appt-slot-time-text">{slot.time}</span>
                                {slot.booked && <span className="appt-slot-status-tag">Bezet</span>}
                                {slot.isPast && <span className="appt-slot-status-tag">Voorbij</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Afternoon slots */}
                      <div className="appt-timeslot-group">
                        <span className="appt-timeslot-group-title" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <SunIcon size={16} /> Namiddag
                        </span>
                        <div className="appt-slots-grid">
                          {afternoonSlots.map((slot) => {
                            const isSelected = selectedTime === slot.time;
                            const isClickable = slot.available;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!isClickable}
                                onClick={() => isClickable && setSelectedTime(slot.time)}
                                title={slot.reason}
                                className={`appt-slot-btn ${isSelected ? "appt-slot-btn--selected" : ""
                                  } ${slot.booked ? "appt-slot-btn--booked" : ""} ${slot.isPast ? "appt-slot-btn--past" : ""
                                  }`}
                              >
                                <span className="appt-slot-time-text">{slot.time}</span>
                                {slot.booked && <span className="appt-slot-status-tag">Bezet</span>}
                                {slot.isPast && <span className="appt-slot-status-tag">Voorbij</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Selection summary pill */}
              {selectedDate && selectedTime && !isClosedDay && (
                <div className="appt-selection-callout">
                  <span className="appt-selection-icon">
                    <CalendarIcon size={18} />
                  </span>
                  <span>
                    Uw keuze: <strong>{formatHumanDate(selectedDate)}</strong> om <strong>{selectedTime} uur</strong>
                  </span>
                </div>
              )}

              <div className="appt-nav-actions">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="appt-btn appt-btn--outline"
                >
                  ← Vorige stap
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  disabled={!selectedDate || !selectedTime || isClosedDay}
                  className="appt-btn appt-btn--primary appt-btn--lg"
                >
                  Volgende stap: Voertuig →
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 3: VEHICLE & DETAILS
              ───────────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="appt-step-card animate-step">
              <div className="appt-step-heading">
                <span className="appt-step-badge">Stap 3 van 4</span>
                <h2 className="appt-step-title">Voertuiggegevens & Wensen</h2>
                <p className="appt-step-desc">
                  Help ons voor te bereiden door uw wagen of gewenste specificaties door te geven.
                </p>
              </div>

              <div className="appt-fields-stack">
                <div className="appt-field-row">
                  <div className="appt-field-col">
                    <label className="appt-field-label">Merk & Model wagen *</label>
                    <input
                      type="text"
                      className="appt-input"
                      placeholder="bijv. Volkswagen Golf 7, BMW 3 Serie, Renault Clio"
                      value={vehicleBrandModel}
                      onChange={(e) => setVehicleBrandModel(e.target.value)}
                    />
                  </div>
                  <div className="appt-field-col">
                    <label className="appt-field-label">
                      Nummerplaat / Kenteken (optioneel)
                    </label>
                    <div className={`appt-plate-badge-wrap ${plateResult.isValid ? "appt-plate-badge-wrap--valid" : ""}`}>
                      <div className={`appt-plate-euroband ${plateResult.country === "NL" ? "appt-plate-euroband--nl" : ""}`}>
                        <span className="appt-plate-euro-stars">★★★★</span>
                        <span className="appt-plate-country-code">{plateResult.country === "NL" ? "NL" : "B"}</span>
                      </div>
                      <input
                        type="text"
                        className="appt-plate-input"
                        placeholder="1-ABC-123"
                        value={vehiclePlate}
                        onChange={handlePlateInputChange}
                        maxLength={12}
                        autoComplete="off"
                        spellCheck="false"
                      />
                      {plateResult.isValid && (
                        <div className="appt-plate-indicator">
                          <span className="appt-plate-check-icon" title={plateResult.typeDesc}>
                            <CheckIcon size={12} strokeWidth={2.5} />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Real-time feedback / RDW auto-fill info */}
                    {vehiclePlate && (
                      <div className="appt-plate-feedback">
                        {plateResult.isValid ? (
                          <span className="appt-plate-feedback--success">
                            [{plateResult.country === "NL" ? "NL" : "BE"}] {plateResult.typeDesc}
                          </span>
                        ) : (
                          <span className="appt-plate-feedback--hint">
                            Formaat: <strong>1-ABC-123</strong> of <strong>ABC-123</strong>
                          </span>
                        )}

                        {rdwLookupLoading && (
                          <span className="appt-plate-rdw-loading">
                            <span className="appt-spinner-dark" style={{ width: 12, height: 12 }} />
                            <span>RDW voertuiggegevens ophalen...</span>
                          </span>
                        )}

                        {rdwVehicleFound && (
                          <div className="appt-plate-rdw-success" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <CarIcon size={16} /> <strong>Voertuig herkend (RDW):</strong> {rdwVehicleFound}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="appt-field-row">
                  <div className="appt-field-col">
                    <label className="appt-field-label">
                      Bandenmaat {serviceType === "FITTING" && tyreSource === "shop" && chosenShopTyre ? "(reeds geselecteerd)" : "(optioneel)"}
                    </label>
                    <input
                      type="text"
                      className="appt-input"
                      placeholder="bijv. 205/55 R16 91V"
                      value={tyreSize}
                      onChange={(e) => setTyreSize(e.target.value)}
                    />
                    <span className="appt-field-hint">
                      U vindt dit op de flank van uw huidige band (bv. 205/55 R16).
                    </span>
                  </div>
                </div>

                <div className="appt-field-col">
                  <label className="appt-field-label">Opmerkingen of specifieke instructies (optioneel)</label>
                  <textarea
                    rows={3}
                    className="appt-textarea"
                    placeholder="bijv. 'Banden liggen al achterin de kofferbak', 'Controleer ook de wielbouten', 'Trilling bij 120 km/u'..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="appt-nav-actions">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="appt-btn appt-btn--outline"
                >
                  ← Vorige stap
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="appt-btn appt-btn--primary appt-btn--lg"
                >
                  Volgende stap: Overzicht & Contact →
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 4: CONTACT & REVIEW
              ───────────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="appt-step-card animate-step">
              <div className="appt-step-heading">
                <span className="appt-step-badge">Stap 4 van 4</span>
                <h2 className="appt-step-title">Overzicht & Contactgegevens</h2>
                <p className="appt-step-desc">
                  Controleer uw afspraak en vul uw contactgegevens in om de reservatie te voltooien.
                </p>
              </div>

              {/* Review Card */}
              <div className="appt-review-card">
                <div className="appt-review-header">
                  <span className="appt-review-title" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <ClipboardListIcon size={18} /> Samenvatting van uw afspraak
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="appt-edit-btn"
                  >
                    Wijzigen
                  </button>
                </div>
                <div className="appt-review-grid">
                  <div className="appt-review-item">
                    <span className="appt-review-lbl">Dienst:</span>
                    <span className="appt-review-val font-semibold">
                      {selectedServiceObj?.icon} {selectedServiceObj?.label}
                    </span>
                  </div>

                  {/* Smart tyre details row in review */}
                  <div className="appt-review-item">
                    <span className="appt-review-lbl">Banden:</span>
                    <span className="appt-review-val">
                      {serviceType === "FITTING" ? (
                        tyreSource === "shop" && chosenShopTyre ? (
                          <span className="font-semibold text-primary">
                            Aankoop: {shopTyreQuantity}x {chosenShopTyre.brand} {chosenShopTyre.model} ({chosenShopTyre.size}) - €{(chosenShopTyre.price * shopTyreQuantity).toFixed(2)}
                          </span>
                        ) : (
                          <span>Eigen banden ({tyreCount === "other" ? "Anders" : `${tyreCount} banden`})</span>
                        )
                      ) : serviceType === "REPAIR" ? (
                        <span>Reparatie ({repairTyreCount} {repairTyreCount === "1" ? "band" : "banden"})</span>
                      ) : serviceType === "INSPECTION" ? (
                        <span>Inspectie huidige wielen</span>
                      ) : (
                        <span>Adviesgesprek</span>
                      )}
                    </span>
                  </div>

                  <div className="appt-review-item">
                    <span className="appt-review-lbl">Datum & Uur:</span>
                    <span className="appt-review-val font-semibold text-primary">
                      {formatHumanDate(selectedDate)} om {selectedTime} uur
                    </span>
                  </div>

                  <div className="appt-review-item">
                    <span className="appt-review-lbl">Voertuig:</span>
                    <span className="appt-review-val">
                      {vehicleBrandModel || vehiclePlate
                        ? `${vehicleBrandModel} ${vehiclePlate ? `(${vehiclePlate})` : ""}`
                        : "Niet opgegeven"}
                    </span>
                  </div>

                  {notes && (
                    <div className="appt-review-item appt-review-item--full">
                      <span className="appt-review-lbl">Opmerkingen:</span>
                      <span className="appt-review-val">{notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleFinalSubmit} className="appt-contact-form">
                {!user ? (
                  <div className="appt-fields-stack">
                    <h3 className="appt-contact-subtitle">Uw contactgegevens</h3>
                    <div className="appt-field-row">
                      <div className="appt-field-col">
                        <label className="appt-field-label">Volledige naam *</label>
                        <input
                          type="text"
                          className="appt-input"
                          placeholder="bijv. Jan De Smet"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="appt-field-col">
                        <label className="appt-field-label">Telefoonnummer *</label>
                        <input
                          type="tel"
                          className="appt-input"
                          placeholder="bijv. 0487 12 34 56"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="appt-field-col">
                      <label className="appt-field-label">E-mailadres *</label>
                      <input
                        type="email"
                        className="appt-input"
                        placeholder="bijv. jan.desmet@gmail.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                      <span className="appt-email-security-note" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <LockIcon size={14} /> <span><strong>Veiligheid:</strong> U ontvangt ter verificatie direct een eenmalige 6-cijferige bevestigingscode op dit adres.</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="appt-logged-in-box">
                    <div className="appt-logged-in-avatar">
                      <CheckIcon size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-dark">
                        Bevestigen als {user.name} ({user.email})
                      </div>
                      <div className="text-muted text-sm">
                        Uw contactgegevens zijn geverifieerd via uw account.
                      </div>
                    </div>
                  </div>
                )}

                {/* Betaalmethode keuze (Hybrid Payment Model) */}
                <div className="appt-payment-choice-card">
                  <div className="appt-payment-choice-header">
                    <div className="appt-payment-choice-icon">
                      <BanknoteIcon size={22} />
                    </div>
                    <div>
                      <h3 className="appt-payment-choice-title">Kies uw gewenste betaalmethode</h3>
                      <p className="appt-payment-choice-desc">
                        Betaal eenvoudig ter plaatse na de montage, of reken direct online af via Bancontact of iDEAL.
                      </p>
                    </div>
                  </div>

                  <div className="appt-payment-methods-grid">
                    {/* Optie 1: Ter plaatse betalen */}
                    <div
                      className={`appt-payment-method-card ${paymentMethod === "on_site" ? "appt-payment-method-card--selected" : ""}`}
                      onClick={() => setPaymentMethod("on_site")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPaymentMethod("on_site"); }}
                    >
                      <div className="appt-payment-method-radio">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="on_site"
                          checked={paymentMethod === "on_site"}
                          onChange={() => setPaymentMethod("on_site")}
                        />
                      </div>
                      <div className="appt-payment-method-content">
                        <div className="appt-payment-method-header">
                          <span className="appt-payment-method-badge appt-payment-method-badge--popular">
                            Meest Gekozen
                          </span>
                          <span className="appt-payment-method-title" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <StoreIcon size={16} /> Betalen ter plaatse bij montage
                          </span>
                        </div>
                        <p className="appt-payment-method-desc">
                          Betaal pas na voltooide montage in onze werkplaats te Gent.
                        </p>
                        <span className="appt-payment-method-note" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <CheckIcon size={13} strokeWidth={2.5} /> Geen voorschot vereist · Bancontact, Payconiq of Cash
                        </span>
                      </div>
                    </div>

                    {/* Optie 2: Direct online betalen */}
                    <div
                      className={`appt-payment-method-card ${paymentMethod === "online" ? "appt-payment-method-card--selected" : ""}`}
                      onClick={() => setPaymentMethod("online")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPaymentMethod("online"); }}
                    >
                      <div className="appt-payment-method-radio">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online"
                          checked={paymentMethod === "online"}
                          onChange={() => setPaymentMethod("online")}
                        />
                      </div>
                      <div className="appt-payment-method-content">
                        <div className="appt-payment-method-header">
                          <span className="appt-payment-method-badge appt-payment-method-badge--fast">
                            Direct Zorgeloos
                          </span>
                          <span className="appt-payment-method-title" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <CreditCardIcon size={16} /> Nu direct online afrekenen
                          </span>
                        </div>
                        <p className="appt-payment-method-desc">
                          Reken vooraf veilig af via Stripe. U rijdt na montage direct buiten zonder wachttijd.
                        </p>
                        <div className="appt-payment-icons-row">
                          <span className="appt-pay-tag">Bancontact</span>
                          <span className="appt-pay-tag">iDEAL</span>
                          <span className="appt-pay-tag">Visa / Mastercard</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live prijsoverzicht box */}
                  <div className="appt-payment-summary-box">
                    {isBuyingShopTyres && chosenShopTyre && (
                      <div className="appt-payment-summary-row">
                        <span>
                          {shopTyreQuantity}x {chosenShopTyre.brand} {chosenShopTyre.model} ({chosenShopTyre.size})
                        </span>
                        <span className="font-semibold">€{tyreSubtotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="appt-payment-summary-row">
                      <span>
                        {serviceType === "FITTING"
                          ? `Montage & balancering (${currentTyreQty} ${currentTyreQty === 1 ? "band" : "banden"} à €19.99)`
                          : serviceType === "REPAIR"
                          ? `Bandenreparatie (${currentTyreQty} ${currentTyreQty === 1 ? "band" : "banden"})`
                          : "Service & Controle"}
                      </span>
                      <span className="font-semibold">€{montageSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="appt-payment-summary-divider" />
                    <div className="appt-payment-summary-total">
                      <span>
                        {paymentMethod === "online" ? "Totaalbedrag nu online te voldoen:" : "Totaalbedrag (te betalen bij montage):"}
                      </span>
                      <span className="appt-payment-total-price">€{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="appt-nav-actions" style={{ marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="appt-btn appt-btn--outline"
                    disabled={loading}
                  >
                    ← Vorige stap
                  </button>
                  <button
                    type="submit"
                    className="appt-btn appt-btn--primary appt-btn--lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="appt-spinner" />
                    ) : paymentMethod === "online" ? (
                      `Nu Veilig Afrekenen (€${grandTotal.toFixed(2)}) →`
                    ) : user ? (
                      "Afspraak Bevestigen (Betalen bij montage) →"
                    ) : (
                      "Verstuur Verificatiecode →"
                    )}
                  </button>
                </div>
              </form>

              {!user && (
                <div className="appt-login-prompt">
                  Heeft u al een account bij Gent Bandenservice?{" "}
                  <Link href="/auth/signin?callbackUrl=/afspraak" className="appt-login-link">
                    Meld u aan
                  </Link>{" "}
                  om verificatiecodes over te slaan.
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function AppointmentPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)" }}>
            <span className="appt-spinner-dark" />
            <span>Afsprakenplanner laden...</span>
          </div>
        </div>
      }
    >
      <AppointmentContent />
    </Suspense>
  );
}

