import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBrusselsDateTime, getBrusselsParts } from "@/lib/appointments";

const WEEKDAY_MORNING_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30"];
const WEEKDAY_AFTERNOON_SLOTS = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

const SATURDAY_MORNING_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30"];
const SATURDAY_AFTERNOON_SLOTS = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

const MAX_PER_SLOT = 1; // 1 vehicle per time slot for dedicated attention

// GET /api/appointments/availability?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Ongeldige datum parameter (gebruik YYYY-MM-DD)" }, { status: 400 });
  }

  const requestedDate = parseBrusselsDateTime(`${dateStr}T12:00:00`);
  if (isNaN(requestedDate.getTime())) {
    return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
  }

  const { dayOfWeek } = getBrusselsParts(requestedDate);

  // Sunday is closed
  if (dayOfWeek === 0) {
    return NextResponse.json({
      date: dateStr,
      closed: true,
      reason: "Gesloten op zondag",
      morningSlots: [],
      afternoonSlots: [],
      totalAvailable: 0,
    });
  }

  const isSaturday = dayOfWeek === 6;
  const morningList = isSaturday ? SATURDAY_MORNING_SLOTS : WEEKDAY_MORNING_SLOTS;
  const afternoonList = isSaturday ? SATURDAY_AFTERNOON_SLOTS : WEEKDAY_AFTERNOON_SLOTS;

  // Search window around the requested date (+/- 36 hours buffer)
  const windowStart = new Date(requestedDate.getTime() - 36 * 60 * 60 * 1000);
  const windowEnd = new Date(requestedDate.getTime() + 36 * 60 * 60 * 1000);

  // 1. Fetch confirmed/pending appointments from DB
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: windowStart,
        lte: windowEnd,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      dateTime: true,
    },
  });

  // 2. Fetch active pending OTP verifications
  const pendingOtps = await prisma.pendingAppointmentOtp.findMany({
    where: {
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      appointmentData: true,
    },
  });

  // Extract booked slot times specifically for dateStr
  const bookedCounts: Record<string, number> = {};

  for (const appt of existingAppointments) {
    const { date, time } = getBrusselsParts(appt.dateTime);
    if (date === dateStr) {
      bookedCounts[time] = (bookedCounts[time] || 0) + 1;
    }
  }

  for (const item of pendingOtps) {
    try {
      const data = JSON.parse(item.appointmentData);
      if (data.dateTime) {
        const itemDate = parseBrusselsDateTime(data.dateTime);
        const { date, time } = getBrusselsParts(itemDate);
        if (date === dateStr) {
          bookedCounts[time] = (bookedCounts[time] || 0) + 1;
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const now = Date.now();

  function evaluateSlot(time: string, period: "morning" | "afternoon") {
    const slotDateTime = parseBrusselsDateTime(`${dateStr}T${time}:00`);
    const isPast = slotDateTime.getTime() <= now;
    const count = bookedCounts[time] || 0;
    const isBooked = count >= MAX_PER_SLOT;
    const available = !isPast && !isBooked;

    let reason = "Beschikbaar";
    if (isPast) reason = "Verlopen";
    else if (isBooked) reason = "Bezet";

    return {
      time,
      period,
      available,
      booked: isBooked,
      isPast,
      reason,
      remaining: Math.max(0, MAX_PER_SLOT - count),
    };
  }

  const morningSlots = morningList.map((t) => evaluateSlot(t, "morning"));
  const afternoonSlots = afternoonList.map((t) => evaluateSlot(t, "afternoon"));

  const allSlots = [...morningSlots, ...afternoonSlots];
  const totalAvailable = allSlots.filter((s) => s.available).length;

  return NextResponse.json({
    date: dateStr,
    closed: false,
    isSaturday,
    morningSlots,
    afternoonSlots,
    totalAvailable,
    totalSlots: allSlots.length,
  });
}
