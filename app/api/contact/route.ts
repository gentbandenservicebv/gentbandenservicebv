import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Resend } from "resend";
import {
  escapeHtml,
  sanitizeString,
  sanitizeOptionalString,
  isValidEmail,
  sanitizePhone,
  checkRateLimit,
} from "@/lib/security";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "Gent Bandenservice <noreply@gentbandenservice.be>";
const SHOP_EMAIL = process.env.SHOP_EMAIL ?? "info@gentbandenservice.be";

export async function POST(req: Request) {
  try {
    // 1. IP rate limiting (5 messages per 10 minutes)
    const headerList = await headers();
    const clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "anonymous";

    const rateLimitResult = checkRateLimit(`contact:${clientIp}`, 5, 10 * 60 * 1000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: `Te veel berichten verstuurd. Probeer het over ${Math.ceil(
            rateLimitResult.retryAfterSec / 60
          )} minuten opnieuw.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfterSec) },
        }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Ongeldig JSON formaat" }, { status: 400 });
    }

    const { name, email, phone, subject, message } = body;

    // Validate required fields
    const cleanName = sanitizeString(name, 100);
    if (!cleanName) {
      return NextResponse.json(
        { error: "Naam is verplicht" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Voer een geldig e-mailadres in" },
        { status: 400 }
      );
    }
    const cleanEmail = email.trim().toLowerCase().slice(0, 150);

    const cleanMessage = sanitizeString(message, 3000);
    if (!cleanMessage) {
      return NextResponse.json(
        { error: "Bericht is verplicht" },
        { status: 400 }
      );
    }

    const cleanSubject = sanitizeOptionalString(subject, 150) ?? "Algemene vraag";
    const cleanPhone = sanitizePhone(phone);

    // HTML-escaped values for secure email template rendering
    const safeName = escapeHtml(cleanName);
    const safeEmail = escapeHtml(cleanEmail);
    const safeSubject = escapeHtml(cleanSubject);
    const safePhone = cleanPhone ? escapeHtml(cleanPhone) : "Niet opgegeven";
    const safeMessage = escapeHtml(cleanMessage);

    const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"/><title>Nieuw contactbericht</title></head>
<body style="margin:0;padding:32px 16px;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;margin:auto;box-shadow:0 4px 20px rgba(0,0,0,.08);">
    <tr>
      <td style="background:#016eb9;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;color:#fff;font-weight:700;">📩 Nieuw bericht via het contactformulier</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:130px;font-size:13px;">Onderwerp</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:700;color:#016eb9;">${safeSubject}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">Afzender</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">${safeName}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">E-mail</td><td style="padding:8px 0;border-bottom:1px solid #eee;"><a href="mailto:${safeEmail}" style="color:#016eb9;">${safeEmail}</a></td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">Telefoon</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${safePhone}</td></tr>
        </table>
        
        <div style="background:#f8fafc;border-left:4px solid #016eb9;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1px;color:#64748b;text-transform:uppercase;">Berichtinhoud</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">${safeMessage}</p>
        </div>

        <p style="margin:0;font-size:13px;color:#94a3b8;">U kunt direct antwoorden op deze e-mail om de klant te contacteren via ${safeEmail}.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email notification to shop
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: [SHOP_EMAIL],
        replyTo: cleanEmail,
        subject: `[Contactformulier] ${cleanSubject} – ${cleanName}`,
        html,
      });

      if (error) {
        console.error("[Contact API] Resend email error:", error.message);
      }
    } catch (emailErr) {
      console.error("[Contact API] Resend invocation error:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Uw bericht is succesvol verzonden. Wij nemen zo spoedig mogelijk contact met u op.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Contact API] Error:", errorMsg, err);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verzenden van uw bericht." },
      { status: 500 }
    );
  }
}
