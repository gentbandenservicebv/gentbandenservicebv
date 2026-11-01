import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  VISITOR_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  parseUserAgent,
} from "@/lib/analytics";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      path = "/",
      title = "",
      referrer = "",
      duration = 0, // seconds spent on previous page or heartbeat
      isHeartbeat = false,
      previousPath = "",
    } = body;

    // Ignore tracker calls for internal API routes or static files if any slipped through
    if (path.startsWith("/api") || path.startsWith("/_next") || path.includes(".")) {
      return NextResponse.json({ success: true, ignored: true });
    }

    // 1. Resolve or create cookies
    const cookieVid = req.cookies.get(VISITOR_COOKIE_NAME)?.value;
    const cookieSid = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    const visitorId =
      cookieVid && cookieVid.length > 5
        ? cookieVid
        : `vid_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    const sessionId =
      cookieSid && cookieSid.length > 5
        ? cookieSid
        : `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const isNewSession = !cookieSid || cookieSid !== sessionId;

    // 2. Client info & headers
    const userAgent = req.headers.get("user-agent") || "";
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const { device, browser, os } = parseUserAgent(userAgent);

    // 3. Optional user session resolution
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // Non-blocking if auth fails or user is anonymous
    }

    const now = new Date();
    const durationSec = Math.max(0, Math.min(Math.round(Number(duration) || 0), 7200));

    // 4. Handle Heartbeat / Tab leave duration update
    if (isHeartbeat) {
      if (sessionId) {
        await prisma.visitorSession.updateMany({
          where: { id: sessionId },
          data: {
            lastSeen: now,
            duration: { increment: durationSec },
            ...(userId ? { userId } : {}),
          },
        });

        // Update the duration on the most recent page view in this session
        if (durationSec > 0) {
          const latestView = await prisma.pageView.findFirst({
            where: { sessionId },
            orderBy: { createdAt: "desc" },
            select: { id: true, duration: true },
          });

          if (latestView) {
            await prisma.pageView.update({
              where: { id: latestView.id },
              data: {
                duration: (latestView.duration || 0) + durationSec,
              },
            });
          }
        }
      }
    } else {
      // 5. If navigating to a new page, optionally update duration on the previous page
      if (previousPath && durationSec > 0 && !isNewSession) {
        const prevPageView = await prisma.pageView.findFirst({
          where: {
            sessionId,
            path: previousPath,
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, duration: true },
        });

        if (prevPageView) {
          await prisma.pageView.update({
            where: { id: prevPageView.id },
            data: {
              duration: Math.max(prevPageView.duration || 0, durationSec),
            },
          });
        }
      }

      // 6. Upsert Session & create PageView
      await prisma.visitorSession.upsert({
        where: { id: sessionId },
        create: {
          id: sessionId,
          visitorId,
          userId,
          ip,
          userAgent: userAgent.slice(0, 500),
          device,
          browser,
          os,
          referrer: referrer ? referrer.slice(0, 500) : null,
          entryPath: path,
          exitPath: path,
          pageViewsCount: 1,
          duration: 0,
          firstSeen: now,
          lastSeen: now,
        },
        update: {
          lastSeen: now,
          exitPath: path,
          pageViewsCount: { increment: 1 },
          ...(durationSec > 0 ? { duration: { increment: durationSec } } : {}),
          ...(userId ? { userId } : {}),
        },
      });

      // Record the new page view
      await prisma.pageView.create({
        data: {
          sessionId,
          visitorId,
          path,
          title: title ? title.slice(0, 255) : null,
          referrer: referrer ? referrer.slice(0, 500) : null,
          duration: 0,
        },
      });
    }

    // 7. Prepare response with updated/extended cookies
    const res = NextResponse.json({
      success: true,
      visitorId,
      sessionId,
    });

    const isProd = process.env.NODE_ENV === "production";

    // Set persistent visitor cookie (1 year)
    res.cookies.set({
      name: VISITOR_COOKIE_NAME,
      value: visitorId,
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: isProd,
      httpOnly: false,
    });

    // Set session cookie (30 minutes sliding window)
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      maxAge: 30 * 60,
      path: "/",
      sameSite: "lax",
      secure: isProd,
      httpOnly: false,
    });

    return res;
  } catch (error) {
    console.error("[Tracking API Error]:", error);
    return NextResponse.json({ success: false, error: "Tracking failed" }, { status: 500 });
  }
}
