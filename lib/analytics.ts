export const VISITOR_COOKIE_NAME = "gbs_vid";
export const SESSION_COOKIE_NAME = "gbs_sid";

export interface ParsedUserAgent {
  device: "Desktop" | "Mobile" | "Tablet";
  browser: string;
  os: string;
}

export function parseUserAgent(uaString?: string | null): ParsedUserAgent {
  if (!uaString) {
    return { device: "Desktop", browser: "Onbekend", os: "Onbekend" };
  }

  const ua = uaString.toLowerCase();

  // 1. Device detection
  let device: "Desktop" | "Mobile" | "Tablet" = "Desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    device = "Tablet";
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    device = "Mobile";
  }

  // 2. OS detection
  let os = "Overig";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "Chrome OS";

  // 3. Browser detection
  let browser = "Overig";
  if (/edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/opr|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";

  return { device, browser, os };
}

export function categorizeReferrer(referrer?: string | null): string {
  if (!referrer) return "Direct";
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();

    if (host.includes("gentbandenservice.be") || host.includes("localhost")) {
      return "Intern";
    }
    if (host.includes("google")) return "Google";
    if (host.includes("bing")) return "Bing";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("twitter") || host.includes("x.com")) return "Twitter / X";
    if (host.includes("marktplaats") || host.includes("2dehands")) return "2dehands";

    return host.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
}
