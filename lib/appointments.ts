/**
 * Appointment date and time utilities for Gent Bandenservice (Europe/Brussels).
 * Ensures consistency across local dev, Docker, and cloud hosting (UTC servers).
 */

export const BRUSSELS_TZ = "Europe/Brussels";

/**
 * Parses a date-time string (e.g. "2026-11-20T09:30:00") into a JavaScript Date
 * interpreted in the Europe/Brussels time zone (handling CET/CEST DST automatically).
 */
export function parseBrusselsDateTime(dtStr: string): Date {
  if (!dtStr) return new Date(NaN);

  // If already contains explicit timezone offset or Z, parse directly
  if (dtStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dtStr)) {
    return new Date(dtStr);
  }

  const match = dtStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return new Date(dtStr);

  const [, y, m, d, hr, min, sec] = match;
  const tentativeUtc = new Date(Date.UTC(+y, +m - 1, +d, +hr, +min, +(sec || 0)));

  // Query Intl to find what wall-clock time Europe/Brussels sees for this tentative UTC timestamp
  const brusselsStr = new Intl.DateTimeFormat("en-US", {
    timeZone: BRUSSELS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(tentativeUtc);

  // Parse brussels parts: MM/DD/YYYY, HH:mm:ss
  const [bDate, bTime] = brusselsStr.split(", ");
  const [bM, bD, bY] = bDate.split("/");
  const [bH, bMin, bS] = bTime.split(":");
  const brusselsAsUtc = Date.UTC(+bY, +bM - 1, +bD, +bH === 24 ? 0 : +bH, +bMin, +bS);

  // If Brussels is +1h (3600000 ms) ahead of UTC, target UTC is tentativeUtc - 1h
  const diffMs = brusselsAsUtc - tentativeUtc.getTime();
  return new Date(tentativeUtc.getTime() - diffMs);
}

/**
 * Formats a Date object into Brussels local date (YYYY-MM-DD), time (HH:MM), and day-of-week (0=Sun, 6=Sat).
 */
export function getBrusselsParts(date: Date): { date: string; time: string; dayOfWeek: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRUSSELS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [bDate, bTime] = formatter.format(date).split(", ");

  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BRUSSELS_TZ,
    weekday: "short",
  });
  const dayStr = weekdayFormatter.format(date);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    date: bDate,
    time: bTime,
    dayOfWeek: dayMap[dayStr] ?? 0,
  };
}

/**
 * Formats a Date into a human-readable Belgian Dutch string.
 * e.g. "vrijdag 20 november 2026 om 09:30"
 */
export function formatBrusselsReadable(date: Date | string): string {
  const d = typeof date === "string" ? parseBrusselsDateTime(date) : date;
  return d.toLocaleString("nl-BE", {
    timeZone: BRUSSELS_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
