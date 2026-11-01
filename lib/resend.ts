import { Resend } from "resend";
import { escapeHtml } from "@/lib/security";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM ?? "Gent Bandenservice <no-reply@resend.dev>";
const SHOP_EMAIL = process.env.SHOP_EMAIL ?? "info@gentbandenservice.be";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentEmailData {
  id: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  userName?: string | null;
  userEmail?: string | null;
  type: string;
  dateTime: Date | string;
  vehicleInfo?: string | null;
  notes?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  FITTING: "Banden monteren",
  REPAIR: "Reparatie",
  INSPECTION: "Inspectie",
  OTHER: "Andere",
};

function formatDT(dt: Date | string) {
  return new Date(dt).toLocaleString("nl-BE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Customer confirmation email ───────────────────────────────────────────────

export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const name = data.userName ?? data.guestName ?? "Klant";
  const email = data.userEmail ?? data.guestEmail;
  if (!email) return; // can't send without email

  const typeLabel = TYPE_LABELS[data.type] ?? data.type;
  const dtStr = formatDT(data.dateTime);

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Afspraakbevestiging – Gent Bandenservice</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e63946 0%,#ff6b6b 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.8);text-transform:uppercase;">Gent Bandenservice</p>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;">✅ Afspraak ontvangen</h1>
              <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">We bevestigen uw aanvraag binnenkort.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#e0e0e0;">Beste <strong style="color:#fff;">${name}</strong>,</p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#bbb;">
                Bedankt voor uw afspraakverzoek. Wij nemen zo snel mogelijk contact met u op ter bevestiging.
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;border-radius:12px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#e63946;text-transform:uppercase;">Uw afspraakdetails</p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;width:140px;font-size:13px;color:#888;">Type</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#fff;font-weight:600;">${typeLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Datum &amp; tijd</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#fff;font-weight:600;">${dtStr}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Locatie</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#22c55e;font-weight:600;">Dendermondsesteenweg 428, 9040 Gent</td>
                      </tr>
                      ${data.vehicleInfo ? `
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Voertuig</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#fff;">${data.vehicleInfo}</td>
                      </tr>` : ""}
                      ${data.notes ? `
                      <tr>
                        <td style="padding:8px 0;font-size:13px;color:#888;vertical-align:top;">Opmerkingen</td>
                        <td style="padding:8px 0;font-size:14px;color:#fff;">${data.notes}</td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#16213e;border-left:3px solid #016eb9;border-radius:0 8px 8px 0;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#ffffff;font-weight:700;">
                      📍 Werkplaatsadres: Dendermondsesteenweg 428, 9040 Gent
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#bbb;">
                      📞 Telefoon: <a href="tel:0467871205" style="color:#016eb9;font-weight:700;text-decoration:none;">0467 87 12 05</a><br/>
                      🕒 Openingsuren: <strong style="color:#fff;">Maandag t/m Zaterdag: 09:00 – 18:00 (Zondag gesloten)</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#888;">Heeft u vragen? Neem contact met ons op via <a href="tel:0467871205" style="color:#016eb9;text-decoration:none;font-weight:600;">0467 87 12 05</a> of <a href="mailto:info@gentbandenservice.be" style="color:#016eb9;text-decoration:none;">info@gentbandenservice.be</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0a0a;padding:24px 40px;text-align:center;border-top:1px solid #222;">
              <p style="margin:0;font-size:12px;color:#555;">Gent Bandenservice BV · Dendermondsesteenweg 428, 9040 Gent · BTW: BE 1041.093.575</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [email],
      subject: `Afspraakbevestiging – ${typeLabel} op ${new Date(data.dateTime).toLocaleDateString("nl-BE")}`,
      html,
    },
    { idempotencyKey: `appointment-confirm/${data.id}` }
  );

  if (error) {
    console.error("[Resend] customer confirmation failed:", error.message);
  }
}

// ── Shop notification email ───────────────────────────────────────────────────

export async function sendAppointmentNotification(data: AppointmentEmailData) {
  const name = data.userName ?? data.guestName ?? "Gast";
  const email = data.userEmail ?? data.guestEmail ?? "—";
  const phone = data.guestPhone ?? "—";
  const typeLabel = TYPE_LABELS[data.type] ?? data.type;
  const dtStr = formatDT(data.dateTime);

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"/><title>Nieuwe afspraak</title></head>
<body style="margin:0;padding:32px 16px;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;margin:auto;box-shadow:0 4px 20px rgba(0,0,0,.08);">
    <tr>
      <td style="background:#e63946;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;color:#fff;font-weight:700;">🔔 Nieuwe afspraak aangevraagd</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:140px;font-size:13px;">Type</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">${typeLabel}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">Datum &amp; tijd</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">${dtStr}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">Naam</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${name}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">E-mail</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${email}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">Telefoon</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${phone}</td></tr>
          ${data.vehicleInfo ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">Voertuig</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${data.vehicleInfo}</td></tr>` : ""}
          ${data.notes ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top;">Opmerkingen</td><td style="padding:8px 0;">${data.notes}</td></tr>` : ""}
        </table>
        <p style="margin:24px 0 0;font-size:13px;color:#999;">Beheer afspraken via het <a href="${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/admin" style="color:#e63946;">admin dashboard</a>.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [SHOP_EMAIL],
      subject: `[Nieuw] Afspraak: ${typeLabel} – ${name}`,
      html,
    },
    { idempotencyKey: `appointment-notify/${data.id}` }
  );

  if (error) {
    console.error("[Resend] shop notification failed:", error.message);
  }
}

// ── Status change notification ────────────────────────────────────────────────

// ── Status change notification ────────────────────────────────────────────────

export async function sendAppointmentStatusChange(
  data: AppointmentEmailData,
  newStatus: string
) {
  const email = data.userEmail ?? data.guestEmail;
  if (!email) return;

  const name = data.userName ?? data.guestName ?? "Klant";
  const typeLabel = TYPE_LABELS[data.type] ?? data.type;
  const dtStr = formatDT(data.dateTime);

  const STATUS_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
    CONFIRMED: { emoji: "✅", label: "bevestigd", color: "#22c55e" },
    CANCELLED: { emoji: "❌", label: "geannuleerd", color: "#ef4444" },
    COMPLETED: { emoji: "🎉", label: "voltooid", color: "#3b82f6" },
  };

  const s = STATUS_LABELS[newStatus];
  if (!s) return; // don't email for PENDING

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"/><title>Afspraak ${s.label}</title></head>
<body style="margin:0;padding:32px 16px;background:#0f0f0f;font-family:system-ui,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;max-width:600px;margin:auto;">
    <tr>
      <td style="background:${s.color};padding:32px 40px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">${s.emoji} Afspraak ${s.label}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 24px;font-size:15px;color:#e0e0e0;">Beste <strong style="color:#fff;">${name}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#bbb;">
          Uw afspraak voor <strong style="color:#fff;">${typeLabel}</strong> op <strong style="color:#fff;">${dtStr}</strong> is <strong style="color:${s.color};">${s.label}</strong>.
        </p>
        ${newStatus === "CANCELLED" ? `<p style="margin:0 0 24px;font-size:14px;color:#bbb;">Indien u een nieuwe afspraak wilt inplannen, kunt u altijd terecht op onze website of telefonisch contact met ons opnemen.</p>` : ""}
        <p style="margin:0;font-size:14px;color:#888;">Locatie: Gent Bandenservice BV, Dendermondsesteenweg 428, 9040 Gent.<br/>Vragen? <a href="mailto:info@gentbandenservice.be" style="color:#e63946;">info@gentbandenservice.be</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [email],
      subject: `Afspraak ${s.label} – Gent Bandenservice`,
      html,
    },
    { idempotencyKey: `appointment-status/${data.id}/${newStatus}` }
  );

  if (error) {
    console.error("[Resend] status change email failed:", error.message);
  }
}

// ── Reschedule notification ──────────────────────────────────────────────────

export async function sendAppointmentRescheduled(
  data: AppointmentEmailData,
  oldDateTime: Date | string,
  newDateTime: Date | string
) {
  const email = data.userEmail ?? data.guestEmail;
  if (!email) return;

  const name = data.userName ?? data.guestName ?? "Klant";
  const typeLabel = TYPE_LABELS[data.type] ?? data.type;
  const oldDtStr = formatDT(oldDateTime);
  const newDtStr = formatDT(newDateTime);

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"/><title>Afspraak Gewijzigd</title></head>
<body style="margin:0;padding:32px 16px;background:#0f0f0f;font-family:system-ui,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;max-width:600px;margin:auto;">
    <tr>
      <td style="background:#016eb9;padding:32px 40px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">🗓️ Afspraak Verzet</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 24px;font-size:15px;color:#e0e0e0;">Beste <strong style="color:#fff;">${name}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#bbb;">
          Uw afspraak voor <strong style="color:#fff;">${typeLabel}</strong> is succesvol verzet naar een nieuw tijdstip:
        </p>
        <div style="background:#0f0f0f;border-left:4px solid #016eb9;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:14px;color:#888;">Oorspronkelijk: <span style="text-decoration:line-through;color:#aaa;">${oldDtStr}</span></p>
          <p style="margin:0;font-size:16px;color:#22c55e;font-weight:700;">Nieuw tijdstip: ${newDtStr}</p>
        </div>
        ${data.vehicleInfo ? `<p style="margin:0 0 16px;font-size:14px;color:#bbb;"><strong>Voertuig:</strong> ${data.vehicleInfo}</p>` : ""}
        <p style="margin:0;font-size:14px;color:#888;">Locatie: Gent Bandenservice BV, Dendermondsesteenweg 428, 9040 Gent.<br/>Vragen? <a href="mailto:info@gentbandenservice.be" style="color:#e63946;">info@gentbandenservice.be</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Email to customer
  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [email],
      subject: `🗓️ Afspraak verzet naar ${newDtStr} – Gent Bandenservice`,
      html,
    },
    { idempotencyKey: `appointment-reschedule/${data.id}/${new Date(newDateTime).getTime()}` }
  );

  if (error) {
    console.error("[Resend] reschedule email to customer failed:", error.message);
  }

  // Also notify shop
  resend.emails.send({
    from: FROM,
    to: [SHOP_EMAIL],
    subject: `[Verzet] Afspraak door ${name}: nu op ${newDtStr}`,
    html: `<p>Afspraak #${data.id} voor ${name} (${email}) is verzet van ${oldDtStr} naar <strong>${newDtStr}</strong>.</p>`,
  }).catch((err) => console.error("[Resend] reschedule shop notice failed:", err));
}


// ── OTP verification email ────────────────────────────────────────────────────

export async function sendOtpEmail(email: string, name: string, otp: string) {
  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifieer uw e-mailadres – Gent Bandenservice</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e63946 0%,#ff6b6b 100%);padding:36px 40px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.75);text-transform:uppercase;">Gent Bandenservice</p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">📧 Verifieer uw e-mail</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#e0e0e0;">Beste <strong style="color:#fff;">${name}</strong>,</p>
              <p style="margin:0 0 32px;font-size:14px;line-height:1.6;color:#bbb;">
                U heeft een afspraak aangevraagd bij Gent Bandenservice. Voer de onderstaande code in om uw e-mailadres te bevestigen en uw afspraak te voltooien.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <div style="background:#0f0f0f;border:2px solid #e63946;border-radius:12px;padding:24px 32px;display:inline-block;">
                      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;color:#e63946;text-transform:uppercase;">Uw verificatiecode</p>
                      <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:#fff;font-variant-numeric:tabular-nums;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#16213e;border-left:3px solid #e63946;border-radius:0 8px 8px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#bbb;">
                      ⏱ Deze code vervalt na <strong style="color:#fff;">10 minuten</strong>.<br/>
                      Heeft u deze aanvraag niet gedaan? Negeer dan deze e-mail.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#666;">Vragen? <a href="mailto:info@gentbandenservice.be" style="color:#e63946;text-decoration:none;">info@gentbandenservice.be</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0a0a;padding:20px 40px;text-align:center;border-top:1px solid #222;">
              <p style="margin:0;font-size:12px;color:#444;">Gent Bandenservice BV · Dendermondsesteenweg 428, 9040 Gent · BTW: BE 1041.093.575</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject: `${otp} – Uw verificatiecode voor Gent Bandenservice`,
    html,
  });

  if (error) {
    console.error("[Resend] OTP email failed:", error.message);
    throw new Error("OTP email kon niet worden verstuurd.");
  }
}

// ── Contact form inquiry email ────────────────────────────────────────────────

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}

export async function sendContactFormNotification(data: ContactFormData) {
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
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:130px;font-size:13px;">Onderwerp</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:700;color:#016eb9;">${data.subject}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">Afzender</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">${data.name}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">E-mail</td><td style="padding:8px 0;border-bottom:1px solid #eee;"><a href="mailto:${data.email}" style="color:#016eb9;">${data.email}</a></td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">Telefoon</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${data.phone || "Niet opgegeven"}</td></tr>
        </table>
        
        <div style="background:#f8fafc;border-left:4px solid #016eb9;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1px;color:#64748b;text-transform:uppercase;">Berichtinhoud</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">${data.message}</p>
        </div>

        <p style="margin:0;font-size:13px;color:#94a3b8;">U kunt direct antwoorden op deze e-mail om de klant te contacteren via ${data.email}.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [SHOP_EMAIL],
      replyTo: data.email,
      subject: `[Contactformulier] ${data.subject} – ${data.name}`,
      html,
    });
    if (error) {
      console.error("[Resend] contact notification failed:", error.message);
    }
  } catch (err) {
    console.error("[Resend] unexpected error sending contact notification:", err);
  }
}

// ── Order Confirmation & Invoice Email ────────────────────────────────────────

export interface OrderEmailData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  totalAmount: number;
  withMontage: boolean;
  deliveryAddress?: string | null;
  notes?: string | null;
  items: Array<{
    brand: string;
    model: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  invoiceUrl: string;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  if (!data.customerEmail) return;

  const totalTyreCount = data.items.reduce((acc, it) => acc + it.quantity, 0);
  const montageTotal = data.withMontage ? 19.99 * totalTyreCount : 0;

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#0b192c;">
          <strong>${item.brand} ${item.model}</strong><br/>
          <span style="font-size:12px;color:#64748b;">Maat: ${item.size}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#475569;text-align:center;">
          ${item.quantity}×
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#0b192c;text-align:right;font-weight:600;">
          €${(item.price * item.quantity).toFixed(2)}
          <div style="font-size:11px;color:#94a3b8;font-weight:normal;">(€${item.price.toFixed(2)}/st)</div>
        </td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bestelling &amp; Factuur – Gent Bandenservice</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#016eb9 0%,#004d84 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.8);text-transform:uppercase;">Gent Bandenservice BV</p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;">🎉 Bedankt voor uw bestelling!</h1>
              <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Bestelnummer: <strong>#${data.orderNumber}</strong></p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#0b192c;">Beste <strong>${data.customerName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                Wij hebben uw bestelling en betaling via Stripe succesvol ontvangen. Hieronder vindt u een overzicht van uw aankoop en uw factuurdetails.
              </p>

              <!-- Fulfillment Service Banner -->
              ${
                data.withMontage
                  ? `
              <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:18px 20px;margin-bottom:28px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <span style="font-size:18px;">🔧</span>
                  <strong style="color:#14532d;font-size:15px;">Montage &amp; Balancering inbegrepen</strong>
                </div>
                <p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">
                  Uw banden worden klaargezet in onze werkplaats. Kom gerust langs tijdens onze openingsuren (Ma–Za: 09:00–18:00) aan de <strong>Dendermondsesteenweg 428, 9040 Gent</strong>.
                </p>
              </div>`
                  : `
              <div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:12px;padding:18px 20px;margin-bottom:28px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <span style="font-size:18px;">📦</span>
                  <strong style="color:#0b192c;font-size:15px;">Levering aan huis (Gratis)</strong>
                </div>
                <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">
                  Uw bestelling wordt met zorg verpakt en verzonden naar:<br/>
                  <strong style="color:#0b192c;">${data.deliveryAddress || "Opgegeven bezorgadres"}</strong>
                </p>
              </div>`
              }

              <!-- Purchased Items Table -->
              <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;">
                Bestelde banden
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
                <thead>
                  <tr style="border-bottom:2px solid #e2e8f0;font-size:12px;color:#64748b;text-align:left;">
                    <th style="padding-bottom:8px;">Omschrijving</th>
                    <th style="padding-bottom:8px;text-align:center;">Aantal</th>
                    <th style="padding-bottom:8px;text-align:right;">Bedrag</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  ${
                    data.withMontage
                      ? `
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#166534;">
                      <strong>Montage &amp; Balancering</strong><br/>
                      <span style="font-size:12px;color:#15803d;">Werkplaats Dendermondsesteenweg 428 (${totalTyreCount}× €19.99)</span>
                    </td>
                    <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#166534;text-align:center;">
                      ${totalTyreCount}×
                    </td>
                    <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#166534;text-align:right;font-weight:600;">
                      €${montageTotal.toFixed(2)}
                    </td>
                  </tr>`
                      : ""
                  }
                </tbody>
              </table>

              <!-- Total Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                <tr>
                  <td style="font-size:16px;font-weight:800;color:#0b192c;">
                    Totaal betaald
                    <div style="font-size:12px;color:#64748b;font-weight:normal;">Inclusief 21% BTW</div>
                  </td>
                  <td style="font-size:22px;font-weight:900;color:#016eb9;text-align:right;">
                    €${data.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </table>

              <!-- Invoice Action Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a
                  href="${data.invoiceUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display:inline-block;padding:14px 28px;background:#016eb9;color:#ffffff;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;box-shadow:0 4px 14px rgba(1,110,185,0.3);"
                >
                  📄 Bekijk &amp; Print Uw Officiële Factuur
                </a>
                <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">
                  U kunt uw factuur op elk gewenst moment online bekijken en opslaan als PDF.
                </p>
              </div>

              <!-- Contact & Support -->
              <p style="margin:0;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:20px;line-height:1.5;">
                Heeft u vragen over uw bestelling of montage? Neem gerust contact op:<br/>
                📞 <a href="tel:0467871205" style="color:#016eb9;text-decoration:none;">0467 87 12 05</a> · 
                ✉️ <a href="mailto:info@gentbandenservice.be" style="color:#016eb9;text-decoration:none;">info@gentbandenservice.be</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0b192c;padding:24px 40px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.5;">
              <strong style="color:#ffffff;">Gent Bandenservice BV</strong><br/>
              Dendermondsesteenweg 428, 9040 Gent, België · BTW: BE 1041.093.575
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // 1. Send confirmation to customer
  try {
    const { error: customerError } = await resend.emails.send({
      from: FROM,
      to: [data.customerEmail],
      subject: `Orderbevestiging & Factuur #${data.orderNumber} – Gent Bandenservice`,
      html,
    });
    if (customerError) {
      console.error("[Resend] Customer order confirmation failed:", customerError.message);
    } else {
      console.log(`[Resend] Customer order confirmation sent to ${data.customerEmail}`);
    }
  } catch (err) {
    console.error("[Resend] Error sending customer confirmation:", err);
  }

  // 2. Notify shop owner
  try {
    const shopSubject = `[Nieuwe Bestelling] #${data.orderNumber} – €${data.totalAmount.toFixed(2)} (${data.withMontage ? "Montage Gent" : "Thuislevering"})`;
    const { error: shopError } = await resend.emails.send({
      from: FROM,
      to: [SHOP_EMAIL],
      subject: shopSubject,
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Nieuwe bestelling ontvangen!</h2>
          <p><strong>Bestelnummer:</strong> #${data.orderNumber}</p>
          <p><strong>Klant:</strong> ${data.customerName} (${data.customerEmail}, ${data.customerPhone || "geen tel"})</p>
          <p><strong>Service:</strong> ${data.withMontage ? "🔧 Montage ter plaatse in Gent" : "📦 Thuislevering: " + (data.deliveryAddress || "Geen adres")}</p>
          <p><strong>Totaal:</strong> €${data.totalAmount.toFixed(2)}</p>
          <p><strong>Factuur:</strong> <a href="${data.invoiceUrl}">${data.invoiceUrl}</a></p>
        </div>
      `,
    });
    if (shopError) {
      console.error("[Resend] Shop order notification failed:", shopError.message);
    }
  } catch (err) {
    console.error("[Resend] Error sending shop notification:", err);
  }
}

// ── Order Status Update Email ────────────────────────────────────────────────

export interface OrderStatusEmailData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  withMontage: boolean;
  deliveryAddress?: string | null;
  notes?: string | null;
  items: Array<{
    brand: string;
    model: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  invoiceUrl: string;
}

const ORDER_STATUS_CONFIG: Record<
  string,
  {
    title: (withMontage: boolean) => string;
    badge: string;
    color: string;
    emoji: string;
    lead: (withMontage: boolean) => string;
    actionText?: (withMontage: boolean) => string;
  }
> = {
  CONFIRMED: {
    title: () => "Bestelling Bevestigd",
    badge: "In Behandeling",
    color: "#016eb9",
    emoji: "✅",
    lead: (montage) =>
      montage
        ? "Uw bestelling is bevestigd. Onze monteurs zetten uw banden klaar in onze werkplaats in Gent."
        : "Uw bestelling is bevestigd en wordt klaargemaakt voor verzending.",
    actionText: (montage) =>
      montage
        ? "Zodra uw banden klaarstaan voor montage in de werkplaats, ontvangt u een bericht."
        : "Zodra uw pakket klaarstaat voor verzending, brengen wij u op de hoogte.",
  },
  READY: {
    title: (montage) =>
      montage ? "Banden Klaar voor Montage!" : "Bestelling Klaar voor Verzending!",
    badge: "Klaar voor montage / afhaling",
    color: "#16a34a",
    emoji: "🔧",
    lead: (montage) =>
      montage
        ? "Goed nieuws! Uw banden liggen klaar in onze werkplaats. U kunt langskomen voor montage en balancering."
        : "Goed nieuws! Uw bestelling is verpakt en staat gereed voor verzending.",
    actionText: (montage) =>
      montage
        ? "📍 <strong>Dendermondsesteenweg 428, 9040 Gent</strong><br/>🕒 Openingsuren: Maandag t/m Zaterdag: 09:00 – 18:00<br/>📞 Bel ons direct bij vragen: <a href='tel:0467871205' style='color:#16a34a;font-weight:700;text-decoration:none;'>0467 87 12 05</a>"
        : "Uw pakket wordt binnenkort overgedragen aan de koerier.",
  },
  COMPLETED: {
    title: (montage) =>
      montage ? "Montage & Bestelling Voltooid" : "Bestelling Voltooid",
    badge: "Voltooid",
    color: "#059669",
    emoji: "🎉",
    lead: () =>
      "Uw bestelling is succesvol voltooid en afgehandeld. Bedankt voor uw vertrouwen in Gent Bandenservice BV!",
    actionText: () =>
      "We wensen u veilige kilometers toe! Heeft u later nog bandenservice, balanceren of inspectie nodig? Ons team staat altijd voor u klaar.",
  },
  CANCELLED: {
    title: () => "Bestelling Geannuleerd",
    badge: "Geannuleerd",
    color: "#dc2626",
    emoji: "❌",
    lead: () => "Uw bestelling is geannuleerd.",
    actionText: () =>
      "Heeft u hier vragen over of wenst u informatie over de eventuele terugbetaling? Neem contact met ons op via <a href='mailto:info@gentbandenservice.be' style='color:#dc2626;'>info@gentbandenservice.be</a> of <strong>0467 87 12 05</strong>.",
  },
};

export async function sendOrderStatusUpdateEmail(data: OrderStatusEmailData) {
  if (!data.customerEmail) return;

  const config = ORDER_STATUS_CONFIG[data.status];
  if (!config) return; // Don't send for unhandled statuses (like PENDING)

  const title = config.title(data.withMontage);
  const leadText = config.lead(data.withMontage);
  const actionText = config.actionText ? config.actionText(data.withMontage) : "";

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#0b192c;">
          <strong>${item.brand} ${item.model}</strong><br/>
          <span style="font-size:12px;color:#64748b;">Maat: ${item.size}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#475569;text-align:center;">
          ${item.quantity}×
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#0b192c;text-align:right;font-weight:600;">
          €${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Statusupdate Bestelling #${data.orderNumber} – Gent Bandenservice</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">

          <!-- Header -->
          <tr>
            <td style="background:${config.color};padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.8);text-transform:uppercase;">Gent Bandenservice BV</p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;">${config.emoji} ${title}</h1>
              <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Bestelnummer: <strong>#${data.orderNumber}</strong></p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#0b192c;">Beste <strong>${data.customerName}</strong>,</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                ${leadText}
              </p>

              <!-- Status Info Card -->
              <div style="background:#f8fafc;border-left:4px solid ${config.color};border-radius:0 10px 10px 0;padding:18px 20px;margin-bottom:28px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Status</div>
                <div style="display:inline-block;padding:4px 12px;border-radius:999px;background:${config.color};color:#ffffff;font-size:13px;font-weight:700;margin-bottom:10px;">
                  ${config.badge}
                </div>
                ${
                  actionText
                    ? `<div style="font-size:14px;color:#1e293b;line-height:1.6;">${actionText}</div>`
                    : ""
                }
              </div>

              <!-- Purchased Items Table -->
              <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;">
                Overzicht van uw bestelling
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
                <thead>
                  <tr style="border-bottom:2px solid #e2e8f0;font-size:12px;color:#64748b;text-align:left;">
                    <th style="padding-bottom:8px;">Banden</th>
                    <th style="padding-bottom:8px;text-align:center;">Aantal</th>
                    <th style="padding-bottom:8px;text-align:right;">Prijs</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
                <tr>
                  <td style="font-size:15px;font-weight:700;color:#0b192c;">
                    Totaalbedrag
                    <span style="font-size:12px;color:#64748b;font-weight:normal;"> (incl. BTW)</span>
                  </td>
                  <td style="font-size:18px;font-weight:800;color:#016eb9;text-align:right;">
                    €${data.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </table>

              <!-- Invoice Button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a
                  href="${data.invoiceUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display:inline-block;padding:12px 26px;background:#016eb9;color:#ffffff;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;box-shadow:0 4px 12px rgba(1,110,185,0.25);"
                >
                  📄 Bekijk Factuur
                </a>
              </div>

              <!-- Contact & Support -->
              <p style="margin:0;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:20px;line-height:1.5;">
                Vragen? Onze klantendienst helpt u graag verder:<br/>
                📞 <a href="tel:0467871205" style="color:#016eb9;text-decoration:none;">0467 87 12 05</a> · 
                ✉️ <a href="mailto:info@gentbandenservice.be" style="color:#016eb9;text-decoration:none;">info@gentbandenservice.be</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0b192c;padding:22px 40px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.5;">
              <strong style="color:#ffffff;">Gent Bandenservice BV</strong><br/>
              Dendermondsesteenweg 428, 9040 Gent, België · BTW: BE 1041.093.575
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send(
      {
        from: FROM,
        to: [data.customerEmail],
        subject: `${title} #${data.orderNumber} – Gent Bandenservice`,
        html,
      },
      { idempotencyKey: `order-status/${data.id}/${data.status}` }
    );

    if (error) {
      console.error("[Resend] Status update email failed:", error.message);
    } else {
      console.log(
        `[Resend] Order status email (${data.status}) sent to ${data.customerEmail}`
      );
    }
  } catch (err) {
    console.error("[Resend] Error sending order status update email:", err);
  }
}

// ── Password Reset Email ──────────────────────────────────────────────────────

export interface PasswordResetEmailData {
  email: string;
  name?: string | null;
  resetUrl: string;
  token?: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const greeting = data.name ? `Beste ${data.name}` : "Beste klant";
  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wachtwoord opnieuw instellen – Gent Bandenservice</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background:#0b192c;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                Gent Bandenservice BV
              </h1>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">
                Uw betrouwbare bandspecialist in Gent
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background:#eff6ff;color:#016eb9;font-size:28px;">
                  🔐
                </span>
              </div>

              <h2 style="margin:0 0 16px;color:#0b192c;font-size:20px;font-weight:700;text-align:center;">
                Wachtwoord opnieuw instellen
              </h2>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                ${greeting},
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
                We hebben een aanvraag ontvangen om het wachtwoord van uw Gent Bandenservice account opnieuw in te stellen. Klik op de onderstaande knop om een nieuw wachtwoord te kiezen:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.resetUrl}" 
                       target="_blank" 
                       style="display:inline-block;padding:14px 32px;background:#016eb9;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:999px;box-shadow:0 4px 12px rgba(1,110,185,0.3);">
                      Wachtwoord opnieuw instellen →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice box -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">
                  ⏱️ <strong>Geldigheid:</strong> Deze link is <strong>1 uur</strong> geldig vanaf het moment van aanvragen.
                </p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">
                  🛡️ <strong>Veiligheid:</strong> Hebt u deze aanvraag niet zelf gedaan? Negeer deze e-mail dan gerust; uw wachtwoord blijft ongewijzigd en veilig.
                </p>
              </div>

              <!-- Fallback URL -->
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;word-break:break-all;">
                Werkt de knop niet? Kopieer en plak de volgende link in uw browser:<br/>
                <a href="${data.resetUrl}" style="color:#016eb9;text-decoration:underline;">${data.resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Contact bar -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#64748b;">
                Vragen of hulp nodig? Neem contact met ons op via<br/>
                📞 <a href="tel:0467871205" style="color:#016eb9;text-decoration:none;font-weight:600;">0467 87 12 05</a> · 
                ✉️ <a href="mailto:info@gentbandenservice.be" style="color:#016eb9;text-decoration:none;font-weight:600;">info@gentbandenservice.be</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0b192c;padding:22px 40px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.5;">
              <strong style="color:#ffffff;">Gent Bandenservice BV</strong><br/>
              Dendermondsesteenweg 428, 9040 Gent, België · BTW: BE 1041.093.575
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send(
      {
        from: FROM,
        to: [data.email],
        subject: "Wachtwoord opnieuw instellen – Gent Bandenservice",
        html,
      },
      data.token ? { idempotencyKey: `pw-reset/${data.token}` } : undefined
    );

    if (error) {
      console.error("[Resend] Password reset email failed:", error.message);
    } else {
      console.log(`[Resend] Password reset email sent to ${data.email}`);
    }
  } catch (err) {
    console.error("[Resend] Error sending password reset email:", err);
  }
}

// ── Secondhand submission emails ──────────────────────────────────────────────

export interface SecondhandSubmissionEmailData {
  id: string;
  name: string;
  email: string;
  brand: string;
  model?: string | null;
  size: string;
  season?: string | null;
  quantity: number;
  treadDepth?: number | null;
  dotYear?: string | null;
  condition?: string | null;
  photosCount?: number;
}

const SEASON_NL: Record<string, string> = {
  SUMMER: "Zomer",
  WINTER: "Winter",
  ALL_SEASON: "All-season",
};

/**
 * Sent immediately when the customer submits the sell-my-tyres form.
 * Confirms that we received their request and will review it.
 */
export async function sendSecondhandSubmissionConfirmation(
  data: SecondhandSubmissionEmailData
) {
  const safeName = escapeHtml(data.name);
  const safeBrand = escapeHtml(data.brand);
  const safeModel = data.model ? escapeHtml(data.model) : "";
  const safeSize = escapeHtml(data.size);
  const rawSeason = data.season ? (SEASON_NL[data.season] ?? data.season) : null;
  const seasonLabel = rawSeason ? escapeHtml(rawSeason) : null;
  const safeQuantity = Number(data.quantity) || 4;
  const safeTreadDepth = typeof data.treadDepth === "number" ? Number(data.treadDepth.toFixed(1)) : null;
  const safeDotYear = data.dotYear ? escapeHtml(data.dotYear) : null;
  const safePhotosCount = typeof data.photosCount === "number" ? data.photosCount : null;

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aanvraag ontvangen – Gent Bandenservice</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#016eb9 0%,#1a8ce8 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.75);text-transform:uppercase;">Gent Bandenservice BV</p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">🛞 Aanvraag ontvangen</h1>
              <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">Wij beoordelen uw aanvraag zo snel mogelijk.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#e0e0e0;">Beste <strong style="color:#fff;">${safeName}</strong>,</p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#bbb;">
                Bedankt voor uw aanvraag om uw tweedehands banden te verkopen aan Gent Bandenservice. 
                Onze expert bekijkt uw aanvraag en contacteert u binnen <strong style="color:#fff;">1–2 werkdagen</strong> met ons bod.
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;border-radius:12px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#016eb9;text-transform:uppercase;">Uw aanvraagdetails</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;width:140px;font-size:13px;color:#888;">Merk</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#fff;font-weight:600;">${safeBrand}${safeModel ? ` ${safeModel}` : ""}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Maat</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#fff;font-weight:600;">${safeSize}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Aantal</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#fff;font-weight:600;">${safeQuantity} stuks</td>
                      </tr>
                      ${seasonLabel ? `<tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Seizoen</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#fff;">${seasonLabel}</td>
                      </tr>` : ""}
                      ${safeTreadDepth !== null ? `<tr>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Profieldiepte</td>
                        <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#fff;">${safeTreadDepth} mm</td>
                      </tr>` : ""}
                      ${safeDotYear ? `<tr>
                        <td style="padding:8px 0;${safePhotosCount ? "border-bottom:1px solid #222;" : ""}font-size:13px;color:#888;">DOT-jaar</td>
                        <td style="padding:8px 0;${safePhotosCount ? "border-bottom:1px solid #222;" : ""}font-size:14px;color:#fff;">${safeDotYear}</td>
                      </tr>` : ""}
                      ${safePhotosCount ? `<tr>
                        <td style="padding:8px 0;font-size:13px;color:#888;">Foto's</td>
                        <td style="padding:8px 0;font-size:14px;color:#10b981;font-weight:600;">${safePhotosCount} foto's ontvangen</td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#16213e;border-left:3px solid #016eb9;border-radius:0 8px 8px 0;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#fff;">📍 Gent Bandenservice BV</p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#bbb;">
                      Dendermondsesteenweg 428, 9040 Gent<br/>
                      📞 <a href="tel:0467871205" style="color:#60afff;font-weight:600;text-decoration:none;">0467 87 12 05</a><br/>
                      🕒 Maandag t/m Zaterdag: 09:00 – 18:00
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#888;">Heeft u vragen? Stuur ons een mail op <a href="mailto:info@gentbandenservice.be" style="color:#60afff;text-decoration:none;">info@gentbandenservice.be</a> of bel ons op <a href="tel:0467871205" style="color:#60afff;text-decoration:none;">0467 87 12 05</a>.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0a0a;padding:20px 40px;text-align:center;border-top:1px solid #222;">
              <p style="margin:0;font-size:12px;color:#555;">Gent Bandenservice BV · Dendermondsesteenweg 428, 9040 Gent · BTW: BE 1041.093.575</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [data.email],
      subject: `Aanvraag ontvangen – ${safeQuantity}× ${safeBrand} ${safeSize} | Gent Bandenservice`,
      html,
    },
    { idempotencyKey: `secondhand-confirm/${data.id}` }
  );

  if (error) {
    console.error("[Resend] secondhand confirmation failed:", error.message);
  }
}

/**
 * Sent when the admin accepts or rejects the customer's secondhand tyre offer.
 */
export async function sendSecondhandReviewResult(data: {
  id: string;
  name: string;
  email: string;
  brand: string;
  size: string;
  quantity: number;
  status: "ACCEPTED" | "REJECTED";
  offerPrice?: number | null;
  adminNotes?: string | null;
}) {
  const safeName = escapeHtml(data.name);
  const safeBrand = escapeHtml(data.brand);
  const safeSize = escapeHtml(data.size);
  const safeQuantity = Number(data.quantity) || 4;
  const safeAdminNotes = data.adminNotes ? escapeHtml(data.adminNotes) : null;
  const accepted = data.status === "ACCEPTED";
  const numPrice = typeof data.offerPrice === "number" && Number.isFinite(data.offerPrice) ? data.offerPrice : null;

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aanvraag ${accepted ? "goedgekeurd" : "afgewezen"} – Gent Bandenservice</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${accepted ? "linear-gradient(135deg,#16a34a,#22c55e)" : "linear-gradient(135deg,#dc2626,#ef4444)"};padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.75);text-transform:uppercase;">Gent Bandenservice BV</p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">${accepted ? "✅ Bod geaccepteerd!" : "❌ Aanvraag afgewezen"}</h1>
              <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">
                ${accepted ? "Goed nieuws — wij willen uw banden kopen!" : "Helaas kunnen wij uw banden momenteel niet inkopen."}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#e0e0e0;">Beste <strong style="color:#fff;">${safeName}</strong>,</p>

              ${accepted ? `
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#bbb;">
                Wij hebben uw aanvraag voor <strong style="color:#fff;">${safeQuantity}× ${safeBrand} ${safeSize}</strong> bekeken en 
                zijn geïnteresseerd in de aankoop.
              </p>

              ${numPrice !== null ? `
              <!-- Offer price -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:28px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#22c55e;text-transform:uppercase;">Ons bod</p>
                    <p style="margin:0 0 4px;font-size:42px;font-weight:900;color:#fff;letter-spacing:-0.02em;">€${numPrice.toFixed(2)}</p>
                    <p style="margin:0;font-size:13px;color:#888;">per band · ${safeQuantity} stuks · totaal €${(numPrice * safeQuantity).toFixed(2)}</p>
                  </td>
                </tr>
              </table>` : ""}

              <!-- Next steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#16213e;border-left:3px solid #22c55e;border-radius:0 8px 8px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#fff;">📋 Volgende stappen</p>
                    <p style="margin:0;font-size:13px;line-height:1.7;color:#bbb;">
                      1. Neem contact met ons op om een moment af te spreken<br/>
                      2. Breng de banden langs in onze werkplaats<br/>
                      3. Wij betalen u ter plaatse bij afgifte
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:13px;color:#888;">📍 Ons adres</p>
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff;">Gent Bandenservice BV</p>
                    <p style="margin:0 0 10px;font-size:13px;color:#bbb;">Dendermondsesteenweg 428, 9040 Gent</p>
                    <p style="margin:0;font-size:13px;color:#bbb;">
                      📞 <a href="tel:0467871205" style="color:#60afff;font-weight:600;text-decoration:none;">0467 87 12 05</a> · 
                      🕒 Ma–Za: 09:00–18:00
                    </p>
                  </td>
                </tr>
              </table>
              ` : `
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#bbb;">
                Helaas kunnen wij uw aanvraag voor <strong style="color:#fff;">${safeQuantity}× ${safeBrand} ${safeSize}</strong> 
                momenteel niet inkopen. Dit kan te maken hebben met de huidige vraag, staat van de banden, of onze huidige voorraad.
              </p>
              `}

              ${safeAdminNotes ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;border-radius:10px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;">Opmerking van ons team</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#ddd;">${safeAdminNotes}</p>
                  </td>
                </tr>
              </table>` : ""}

              <p style="margin:0;font-size:14px;color:#888;">Heeft u vragen? Neem gerust contact op via <a href="mailto:info@gentbandenservice.be" style="color:#60afff;text-decoration:none;">info@gentbandenservice.be</a> of <a href="tel:0467871205" style="color:#60afff;text-decoration:none;">0467 87 12 05</a>.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0a0a;padding:20px 40px;text-align:center;border-top:1px solid #222;">
              <p style="margin:0;font-size:12px;color:#555;">Gent Bandenservice BV · Dendermondsesteenweg 428, 9040 Gent · BTW: BE 1041.093.575</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const subject = accepted
    ? `✅ Ons bod voor uw banden – ${safeBrand} ${safeSize} | Gent Bandenservice`
    : `Aanvraag tweedehands banden – Gent Bandenservice`;

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [data.email],
      subject,
      html,
    },
    { idempotencyKey: `secondhand-review/${data.id}/${data.status}` }
  );

  if (error) {
    console.error("[Resend] secondhand review result email failed:", error.message);
  }
}
