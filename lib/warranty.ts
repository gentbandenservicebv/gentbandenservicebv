/**
 * Helper utilities for managing warranty ("Garantie") options on invoices & orders.
 */

export interface WarrantyPreset {
  id: string;
  label: string;
  text: string;
}

export const WARRANTY_PRESETS: WarrantyPreset[] = [
  {
    id: "none",
    label: "Geen specifieke garantie vermelden",
    text: "",
  },
  {
    id: "used_3m",
    label: "3 maanden garantie (Tweedehands banden)",
    text: "3 maanden garantie op karkasintegriteit en gelijkmatige werking",
  },
  {
    id: "used_6m",
    label: "6 maanden garantie (Kwalitatieve Tweedehands banden)",
    text: "6 maanden garantie op karkas en profielkwaliteit",
  },
  {
    id: "new_1y",
    label: "1 jaar garantie (Nieuwe banden / Herstelling)",
    text: "1 jaar volledige garantie op fabricagefouten en vakkundige montage",
  },
  {
    id: "new_2y",
    label: "2 jaar wettelijke fabrieksgarantie (Nieuwe banden)",
    text: "2 jaar wettelijke fabrieksgarantie conform Belgische consumentenwetgeving (Boek VI WER)",
  },
  {
    id: "fitting_lifetime",
    label: "Montage & balanceergarantie",
    text: "Volledige montage- en balanceergarantie uitgevoerd door Gent Bandenservice BV",
  },
  {
    id: "custom",
    label: "Aangepaste garantie invoeren...",
    text: "",
  },
];

const WARRANTY_PREFIX = "[GARANTIE:";
const WARRANTY_SUFFIX = "]";

/**
 * Extracts warranty string and clean user notes from raw notes text.
 */
export function parseWarrantyFromNotes(rawNotes?: string | null): {
  warranty: string | null;
  notes: string;
} {
  if (!rawNotes) {
    return { warranty: null, notes: "" };
  }

  const str = rawNotes.trim();
  const startIdx = str.indexOf(WARRANTY_PREFIX);

  if (startIdx !== -1) {
    const endIdx = str.indexOf(WARRANTY_SUFFIX, startIdx + WARRANTY_PREFIX.length);
    if (endIdx !== -1) {
      const warranty = str.slice(startIdx + WARRANTY_PREFIX.length, endIdx).trim();
      const before = str.slice(0, startIdx).trim();
      const after = str.slice(endIdx + WARRANTY_SUFFIX.length).trim();
      const notes = [before, after].filter(Boolean).join("\n").trim();
      return {
        warranty: warranty || null,
        notes,
      };
    }
  }

  // Check if starts with plain "Garantie:" text
  const match = str.match(/^Garantie:\s*([^\n\r]+)/i);
  if (match) {
    const warranty = match[1].trim();
    const notes = str.replace(match[0], "").trim();
    return {
      warranty: warranty || null,
      notes,
    };
  }

  return {
    warranty: null,
    notes: str,
  };
}

/**
 * Combines notes and warranty into a single storage string.
 */
export function combineNotesAndWarranty(
  notes?: string | null,
  warranty?: string | null
): string {
  const cleanNotes = (notes || "").trim();
  const cleanWarranty = (warranty || "").trim();

  if (!cleanWarranty) {
    return cleanNotes;
  }

  const tag = `${WARRANTY_PREFIX} ${cleanWarranty} ${WARRANTY_SUFFIX}`;
  if (!cleanNotes) {
    return tag;
  }

  return `${tag}\n${cleanNotes}`;
}
