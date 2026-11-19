import { prisma } from "@/lib/prisma";
import { SiteSettings, DEFAULT_SITE_SETTINGS } from "./settings-types";

export type { SiteSettings };
export { DEFAULT_SITE_SETTINGS };

/**
 * Server-only helper: retrieves the current site settings from the database, falling back to defaults.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.siteSetting.findMany();
    const map: Record<string, string> = { ...DEFAULT_SITE_SETTINGS };
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map as unknown as SiteSettings;
  } catch (err) {
    console.error("Error loading site settings:", err);
    return DEFAULT_SITE_SETTINGS;
  }
}
