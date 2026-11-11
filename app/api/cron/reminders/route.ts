import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminder } from "@/lib/resend";

/**
 * Calculates start and end of target date in Europe/Brussels (UTC bounds).
 * Default is tomorrow in Belgium time.
 */
function getBrusselsDateBounds(targetDateStr?: string) {
  const now = new Date();
  const brusselsFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  let dateStr = targetDateStr;
  if (!dateStr) {
    const todayStr = brusselsFormatter.format(now);
    const [y, m, d] = todayStr.split("-").map(Number);
    const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
    dateStr = brusselsFormatter.format(tomorrow);
  }

  // Calculate timezone offset for Europe/Brussels on that date
  const dummy = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    timeZoneName: "shortOffset",
  }).formatToParts(dummy);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value;

  let offsetMinutes = 60; // CET fallback (UTC+1)
  if (tzPart) {
    const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (match) {
      const sign = match[1] === "+" ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const mins = match[3] ? parseInt(match[3], 10) : 0;
      offsetMinutes = sign * (hours * 60 + mins);
    }
  }

  const signStr = offsetMinutes >= 0 ? "+" : "-";
  const absH = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
  const absM = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
  const offsetStr = `${signStr}${absH}:${absM}`;

  const start = new Date(`${dateStr}T00:00:00.000${offsetStr}`);
  const end = new Date(`${dateStr}T23:59:59.999${offsetStr}`);

  return { dateStr, start, end };
}

/**
 * Validates request authorization token against CRON_SECRET.
 * Accepts:
 * - Authorization: Bearer <CRON_SECRET>
 * - x-cron-secret: <CRON_SECRET>
 * - ?secret=<CRON_SECRET>
 */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // If CRON_SECRET is not configured in env, reject in production
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Cron] Warning: CRON_SECRET is not set in development mode. Allowing request.");
      return true;
    }
    return false;
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const headerSecret = req.headers.get("x-cron-secret")?.trim();
  const querySecret = req.nextUrl.searchParams.get("secret")?.trim();

  return (
    bearerToken === secret ||
    headerSecret === secret ||
    querySecret === secret
  );
}

async function handleReminders(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized: ongeldige of ontbrekende cron secret" },
      { status: 401 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const customDate = searchParams.get("date") || undefined;
  const dryRun = searchParams.get("dryRun") === "true";

  const bounds = getBrusselsDateBounds(customDate);

  console.log(`[Cron Reminders] Searching appointments for Brussels date ${bounds.dateStr}`);
  console.log(`[Cron Reminders] UTC Window: ${bounds.start.toISOString()} -> ${bounds.end.toISOString()}`);

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: bounds.start,
          lte: bounds.end,
        },
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
        reminderSentAt: null,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dateTime: "asc",
      },
    });

    console.log(`[Cron Reminders] Found ${appointments.length} appointment(s) needing reminder`);

    const results: Array<{
      id: string;
      customerName: string;
      email: string | null;
      dateTime: string;
      status: "sent" | "failed" | "skipped" | "dry_run";
      error?: string;
    }> = [];

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const appt of appointments) {
      const email = appt.user?.email || appt.guestEmail;
      const name = appt.user?.name || appt.guestName || "Klant";

      if (!email) {
        skippedCount++;
        results.push({
          id: appt.id,
          customerName: name,
          email: null,
          dateTime: appt.dateTime.toISOString(),
          status: "skipped",
          error: "Geen e-mailadres gevonden",
        });
        continue;
      }

      if (dryRun) {
        results.push({
          id: appt.id,
          customerName: name,
          email,
          dateTime: appt.dateTime.toISOString(),
          status: "dry_run",
        });
        continue;
      }

      // Send reminder email
      const sendResult = await sendAppointmentReminder({
        id: appt.id,
        guestName: appt.guestName,
        guestEmail: appt.guestEmail,
        guestPhone: appt.guestPhone,
        userName: appt.user?.name ?? null,
        userEmail: appt.user?.email ?? null,
        type: appt.type,
        dateTime: appt.dateTime,
        vehicleInfo: appt.vehicleInfo,
        notes: appt.notes,
      });

      if (sendResult.success) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSentAt: new Date() },
        });

        sentCount++;
        results.push({
          id: appt.id,
          customerName: name,
          email,
          dateTime: appt.dateTime.toISOString(),
          status: "sent",
        });
      } else {
        failedCount++;
        results.push({
          id: appt.id,
          customerName: name,
          email,
          dateTime: appt.dateTime.toISOString(),
          status: "failed",
          error: sendResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      targetDateBrussels: bounds.dateStr,
      window: {
        start: bounds.start.toISOString(),
        end: bounds.end.toISOString(),
      },
      dryRun,
      totalFound: appointments.length,
      sentCount: dryRun ? 0 : sentCount,
      failedCount,
      skippedCount,
      results,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Cron Reminders] Fatal error during reminder execution:", errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: "Er is een fout opgetreden bij het verwerken van afspraakherinneringen",
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}

// cron-job.org can be configured to use GET or POST
export async function GET(req: NextRequest) {
  return handleReminders(req);
}

export async function POST(req: NextRequest) {
  return handleReminders(req);
}

