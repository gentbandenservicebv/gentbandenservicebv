import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

const { GET: _GET, POST: _POST } = toNextJsHandler(auth);

/**
 * Rate limit thresholds per endpoint:
 *  - sign-in/email  : 10 attempts per 15 min per IP  (brute force protection)
 *  - sign-up/email  : 5 sign-ups per 60 min per IP   (spam / account farming)
 *  - forgot-password: 5 requests per 60 min per IP   (email flood protection)
 */
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "sign-in/email":   { limit: 10, windowMs: 15 * 60 * 1000 },
  "sign-up/email":   { limit: 5,  windowMs: 60 * 60 * 1000 },
  "forget-password": { limit: 5,  windowMs: 60 * 60 * 1000 },
  "reset-password":  { limit: 10, windowMs: 15 * 60 * 1000 },
};

function rateLimitedResponse(retryAfterSec: number) {
  return NextResponse.json(
    {
      error: "Te veel pogingen. Probeer het later opnieuw.",
      retryAfter: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": "0",
      },
    }
  );
}

export async function GET(request: NextRequest) {
  return _GET(request);
}

export async function POST(request: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  const params = await context.params;
  // params.all is e.g. ["sign-in", "email"] → join to "sign-in/email"
  const endpoint = (params.all ?? []).join("/");
  const rule = RATE_LIMITS[endpoint];

  if (rule) {
    const ip = getClientIp(request);
    const result = checkRateLimit(`auth:${endpoint}:${ip}`, rule.limit, rule.windowMs);
    if (!result.allowed) {
      return rateLimitedResponse(result.retryAfterSec);
    }
  }

  return _POST(request);
}
