import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range") || "7d"; // 24h, 7d, 30d, all

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === "24h") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "all") {
      startDate = new Date(0);
    }

    // 1. Live online visitors in last 15 min
    const activeVisitors = await prisma.visitorSession.count({
      where: {
        lastSeen: { gte: fifteenMinutesAgo },
      },
    });

    // 2. Metrics for today
    const [pageViewsToday, sessionsToday] = await Promise.all([
      prisma.pageView.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.visitorSession.count({
        where: { lastSeen: { gte: todayStart } },
      }),
    ]);

    // 3. Period aggregate counts
    const [periodSessions, periodPageViews] = await Promise.all([
      prisma.visitorSession.count({
        where: { lastSeen: { gte: startDate } },
      }),
      prisma.pageView.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    // 4. Average session duration in seconds
    const durationAggregate = await prisma.visitorSession.aggregate({
      where: { lastSeen: { gte: startDate } },
      _avg: { duration: true },
    });
    const avgDuration = Math.round(durationAggregate._avg.duration || 0);

    // 5. Top visited pages
    const pageViewsGroup = await prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: startDate } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 15,
    });

    // Fetch titles and sample stats for top paths
    const topPages = await Promise.all(
      pageViewsGroup.map(async (item) => {
        const sample = await prisma.pageView.findFirst({
          where: { path: item.path },
          select: { title: true },
          orderBy: { createdAt: "desc" },
        });

        const uniqueVisitors = await prisma.pageView.groupBy({
          by: ["visitorId"],
          where: { path: item.path, createdAt: { gte: startDate } },
        });

        return {
          path: item.path,
          title: sample?.title || item.path,
          views: item._count.path,
          uniqueVisitors: uniqueVisitors.length,
        };
      })
    );

    // 6. Device breakdown
    const devicesGroup = await prisma.visitorSession.groupBy({
      by: ["device"],
      where: { lastSeen: { gte: startDate } },
      _count: { device: true },
    });

    const deviceStats = devicesGroup.map((d) => ({
      name: d.device || "Desktop",
      count: d._count.device,
    }));

    // 7. Browser breakdown
    const browserGroup = await prisma.visitorSession.groupBy({
      by: ["browser"],
      where: { lastSeen: { gte: startDate } },
      _count: { browser: true },
      orderBy: { _count: { browser: "desc" } },
      take: 6,
    });

    const browserStats = browserGroup.map((b) => ({
      name: b.browser || "Overig",
      count: b._count.browser,
    }));

    // 8. Recent Visitor Sessions with full PageView breadcrumbs
    const recentSessions = await prisma.visitorSession.findMany({
      where: { lastSeen: { gte: startDate } },
      orderBy: { lastSeen: "desc" },
      take: 40,
      include: {
        pageViews: {
          orderBy: { createdAt: "asc" },
          take: 30,
        },
      },
    });

    return NextResponse.json({
      activeVisitors,
      today: {
        pageViews: pageViewsToday,
        sessions: sessionsToday,
      },
      period: {
        range,
        pageViews: periodPageViews,
        sessions: periodSessions,
        avgDuration,
      },
      topPages,
      deviceStats,
      browserStats,
      recentSessions,
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("[Admin Analytics API Error]:", error);
    return NextResponse.json(
      { error: "Kon analytics data niet laden" },
      { status: 500 }
    );
  }
}
