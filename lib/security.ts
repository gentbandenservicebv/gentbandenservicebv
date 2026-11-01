/**
 * Security and sanitization utilities for user input and email rendering.
 * Protects against XSS, HTML Injection, Email Header Injection, DoS via payload bloat,
 * and malicious protocol schemes (e.g. javascript:).
 */

/**
 * Escapes HTML control characters to prevent HTML/XSS injection in email templates.
 */
export function escapeHtml(val: unknown): string {
  if (val == null) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips null bytes, trims leading/trailing whitespace, and clamps to maxLength.
 */
export function sanitizeString(val: unknown, maxLength = 255): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/\0/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Strips null bytes, trims, and clamps to maxLength. Returns null if empty.
 */
export function sanitizeOptionalString(val: unknown, maxLength = 255): string | null {
  if (val == null) return null;
  const cleaned = sanitizeString(val, maxLength);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Validates email structure and blocks CRLF (\r\n) injection attacks.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254 || trimmed.length < 5) return false;
  if (/[\r\n]/.test(trimmed)) return false; // Block header injection
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Sanitizes phone numbers: allows only numbers, +, (, ), -, ., and spaces. Max 30 chars.
 */
export function sanitizePhone(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const cleaned = phone.replace(/[^0-9+() \-\.]/g, "").trim().slice(0, 30);
  return cleaned.length >= 5 ? cleaned : null;
}

/**
 * Strictly verifies that a URL uses https: protocol to prevent javascript: or data: XSS.
 */
export function isValidHttpsUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Parses and sanitizes a photo string (JSON array or comma-separated) into
 * an array of strictly verified https:// URLs, capped at maxCount.
 */
export function sanitizePhotosList(raw: unknown, maxCount = 8): string[] {
  if (!raw) return [];
  let candidateList: unknown[] = [];

  if (Array.isArray(raw)) {
    candidateList = raw;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) candidateList = parsed;
      } catch {
        candidateList = trimmed.split(",");
      }
    } else {
      candidateList = trimmed.split(",");
    }
  }

  return candidateList
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((url) => isValidHttpsUrl(url))
    .slice(0, maxCount);
}

/**
 * In-memory rate limiter per IP/identifier to protect public endpoints from flood / abuse.
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

// Automatically purge expired buckets every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitMap.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export function checkRateLimit(
  identifier: string,
  limit = 5,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateLimitMap.get(identifier);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}
