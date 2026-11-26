import PDFDocument from "pdfkit";
import { generateEpcQrBuffer, DEFAULT_COMPANY_IBAN } from "@/lib/invoice-qr";
import { parseWarrantyFromNotes } from "@/lib/warranty";
import path from "path";
import fs from "fs";

export interface InvoicePdfData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerStreet?: string | null;
  customerCity?: string | null;
  customerPostal?: string | null;
  customerCountry?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
  status: string; // "PENDING" | "PAID" | "CANCELLED"
  issueDate: Date | string;
  dueDate: Date | string;
  paymentMethod?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    vatRate?: number;
  }>;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string | null;
  warranty?: string | null;
}

export async function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  const isPaid = data.status === "PAID";
  const isOverschrijving = !data.paymentMethod || data.paymentMethod.toLowerCase().includes("overschrijving");

  let qrBuffer: Buffer | null = null;
  if (!isPaid && isOverschrijving) {
    try {
      qrBuffer = await generateEpcQrBuffer({
        amount: data.totalAmount,
        invoiceNumber: data.invoiceNumber,
      });
    } catch (qrErr) {
      console.error("[PDF] QR generation failed:", qrErr);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `Factuur ${data.invoiceNumber} - Gent Bandenservice BV`,
          Author: "Gent Bandenservice BV",
          Subject: `Factuur ${data.invoiceNumber}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));
      const issueDateStr = new Date(data.issueDate).toLocaleDateString("nl-BE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const dueDateStr = new Date(data.dueDate).toLocaleDateString("nl-BE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // ── Top Brand Header ──
      // Top colored bar
      doc.rect(40, 40, 515, 4).fill("#016eb9");

      // Company info & Logo (Left)
      const logoPath = path.join(process.cwd(), "public", "logo-transparent.png");
      const hasLogo = fs.existsSync(logoPath);
      if (hasLogo) {
        doc.image(logoPath, 40, 52, { width: 50 });
      }

      const textStartX = hasLogo ? 100 : 40;
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(16).text("Gent Bandenservice BV", textStartX, 52);
      doc.fillColor("#64748b").font("Helvetica").fontSize(8.5).text("Vakkundig bandencentrum & werkplaats", textStartX, 72);

      doc.fillColor("#334155").fontSize(8).lineGap(2);
      doc.text("Dendermondsesteenweg 428", textStartX, 88);
      doc.text("9040 Gent (Sint-Amandsberg), België", textStartX, 100);
      doc.text("Tel: 0467 87 12 05 · E-mail: info@gentbandenservice.be", textStartX, 112);
      doc.font("Helvetica-Bold").text("BTW / Ondernemingsnr: BE 1041.093.575 · RPR Gent", textStartX, 124);

      // Invoice Details Box (Right)
      const rightX = 350;
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("FACTUUR", rightX, 55, { align: "right", width: 205 });
      doc.fillColor("#016eb9").font("Helvetica-Bold").fontSize(11).text(`#${data.invoiceNumber}`, rightX, 76, { align: "right", width: 205 });

      // Status Pill on top right
      const badgeY = 92;
      const badgeW = 90;
      const badgeH = 18;
      const badgeX = 555 - badgeW;
      if (isPaid) {
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4).fillAndStroke("#dcfce7", "#86efac");
        doc.fillColor("#15803d").font("Helvetica-Bold").fontSize(8.5).text("✓ BETAALD", badgeX, badgeY + 4, { align: "center", width: badgeW });
      } else {
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4).fillAndStroke("#fef3c7", "#fde68a");
        doc.fillColor("#b45309").font("Helvetica-Bold").fontSize(8.5).text("⏳ OPENSTAAND", badgeX, badgeY + 4, { align: "center", width: badgeW });
      }

      doc.fillColor("#475569").font("Helvetica").fontSize(8).lineGap(2);
      doc.text(`Factuurdatum: ${issueDateStr}`, rightX, 118, { align: "right", width: 205 });
      doc.text(`Vervaldatum: ${dueDateStr}`, rightX, 129, { align: "right", width: 205 });
      if (data.paymentMethod) {
        doc.text(`Betaalwijze: ${data.paymentMethod}`, rightX, 140, { align: "right", width: 205 });
      }

      // Divider Line
      doc.moveTo(40, 160).lineTo(555, 160).strokeColor("#e2e8f0").lineWidth(1).stroke();

      // ── Customer / Recipient Info ──
      const custY = 175;
      doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(8).text("GEFACTUREERD AAN:", 40, custY);
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(data.customerName, 40, custY + 14);

      let currentY = custY + 28;
      doc.fillColor("#334155").font("Helvetica").fontSize(8.5).lineGap(2);

      if (data.companyName) {
        doc.font("Helvetica-Bold").fillColor("#016eb9").text(data.companyName, 40, currentY);
        currentY += 12;
      }

      if (data.vatNumber) {
        doc.font("Helvetica").fillColor("#334155").text(`BTW-nr: ${data.vatNumber}`, 40, currentY);
        currentY += 12;
      }

      if (data.customerStreet) {
        doc.text(data.customerStreet, 40, currentY);
        currentY += 12;
      }

      if (data.customerPostal || data.customerCity) {
        doc.text(`${data.customerPostal || ""} ${data.customerCity || ""}`.trim(), 40, currentY);
        currentY += 12;
      }

      doc.text(`${data.customerEmail}${data.customerPhone ? ` · ${data.customerPhone}` : ""}`, 40, currentY);

      // ── Table of Line Items ──
      const tableTop = Math.max(currentY + 24, 255);

      // Table Header Row
      doc.rect(40, tableTop, 515, 22).fill("#0f172a");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
      doc.text("OMSCHRIJVING", 50, tableTop + 6);
      doc.text("AANTAL", 320, tableTop + 6, { width: 50, align: "center" });
      doc.text("PRIJS", 380, tableTop + 6, { width: 75, align: "right" });
      doc.text("TOTAAL (EUR)", 465, tableTop + 6, { width: 80, align: "right" });

      let rowY = tableTop + 22;
      data.items.forEach((item, index) => {
        const lineTotal = item.quantity * item.price;
        const isEven = index % 2 === 0;

        // Row background
        if (isEven) {
          doc.rect(40, rowY, 515, 22).fill("#f8fafc");
        }

        // Cell border
        doc.rect(40, rowY, 515, 22).strokeColor("#e2e8f0").lineWidth(0.5).stroke();

        doc.fillColor("#0f172a").font("Helvetica").fontSize(8.5);
        doc.text(item.description, 50, rowY + 6, { width: 265, height: 16, ellipsis: true });
        doc.text(String(item.quantity), 320, rowY + 6, { width: 50, align: "center" });
        doc.text(`€${item.price.toFixed(2)}`, 380, rowY + 6, { width: 75, align: "right" });
        doc.font("Helvetica-Bold").text(`€${lineTotal.toFixed(2)}`, 465, rowY + 6, { width: 80, align: "right" });

        rowY += 22;
      });

      // ── Totals Box ──
      const totalsY = rowY + 14;
      const totalsBoxW = 210;
      const totalsBoxX = 555 - totalsBoxW;

      doc.rect(totalsBoxX, totalsY, totalsBoxW, 70).fill("#f8fafc");
      doc.rect(totalsBoxX, totalsY, totalsBoxW, 70).strokeColor("#cbd5e1").lineWidth(1).stroke();

      doc.fillColor("#475569").font("Helvetica").fontSize(8.5);
      doc.text("Subtotaal excl. BTW:", totalsBoxX + 12, totalsY + 10);
      doc.fillColor("#0f172a").font("Helvetica-Bold").text(`€${data.subtotal.toFixed(2)}`, totalsBoxX + 120, totalsY + 10, { width: 78, align: "right" });

      doc.fillColor("#475569").font("Helvetica").text("BTW (21%):", totalsBoxX + 12, totalsY + 26);
      doc.fillColor("#0f172a").font("Helvetica-Bold").text(`€${data.vatAmount.toFixed(2)}`, totalsBoxX + 120, totalsY + 26, { width: 78, align: "right" });

      // Final total line
      doc.moveTo(totalsBoxX + 12, totalsY + 42).lineTo(totalsBoxX + totalsBoxW - 12, totalsY + 42).strokeColor("#cbd5e1").stroke();
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text("TOTAAL:", totalsBoxX + 12, totalsY + 50);
      doc.fillColor("#016eb9").font("Helvetica-Bold").fontSize(12).text(`€${data.totalAmount.toFixed(2)}`, totalsBoxX + 100, totalsY + 48, { width: 98, align: "right" });

      // Extract warranty and clean notes
      const { warranty: parsedWarranty, notes: cleanNotes } = parseWarrantyFromNotes(data.notes);
      const effectiveWarranty = (data.warranty || parsedWarranty || "").trim();

      // Notes / Payment instructions (Left of totals)
      const noteW = totalsBoxX - 55;
      const noteH = qrBuffer ? 85 : 70;

      if (!isPaid) {
        doc.roundedRect(40, totalsY, noteW, noteH, 6).fillAndStroke("#fffbeb", "#fde68a");

        if (qrBuffer) {
          // Embed the EPC QR code image
          doc.image(qrBuffer, 40 + noteW - 76, totalsY + 6, { width: 72, height: 72 });

          doc.fillColor("#92400e").font("Helvetica-Bold").fontSize(8).text("BETALINGSINSTRUCTIES (SCAN & BETAAL):", 50, totalsY + 8);
          doc.fillColor("#78350f").font("Helvetica").fontSize(7.5).lineGap(1.5);
          doc.text(`IBAN: ${DEFAULT_COMPANY_IBAN.replace(/(.{4})/g, "$1 ").trim()}`, 50, totalsY + 22);
          doc.text(`Bedrag: €${data.totalAmount.toFixed(2)}  ·  Vóór: ${dueDateStr}`, 50, totalsY + 34);
          doc.text(`Mededeling: #${data.invoiceNumber}`, 50, totalsY + 46);
          doc.fillColor("#b45309").font("Helvetica-Oblique").fontSize(6.5).text("Scan met bank-app (KBC, Belfius, ING, etc.)", 50, totalsY + 60, { width: noteW - 85 });
        } else {
          doc.fillColor("#92400e").font("Helvetica-Bold").fontSize(8.5).text("BETALINGSINSTRUCTIES:", 50, totalsY + 8);
          doc.fillColor("#78350f").font("Helvetica").fontSize(8).lineGap(2);
          doc.text(
            `Gelieve het bedrag van €${data.totalAmount.toFixed(2)} over te maken vóór ${dueDateStr} met vermelding van factuurnummer #${data.invoiceNumber}.`,
            50,
            totalsY + 22,
            { width: noteW - 20 }
          );
        }
      } else if (cleanNotes && !effectiveWarranty) {
        doc.roundedRect(40, totalsY, noteW, 70, 6).fillAndStroke("#f8fafc", "#e2e8f0");
        doc.fillColor("#475569").font("Helvetica-Bold").fontSize(8.5).text("OPMERKINGEN:", 50, totalsY + 8);
        doc.fillColor("#334155").font("Helvetica").fontSize(8).lineGap(2);
        doc.text(cleanNotes, 50, totalsY + 22, { width: noteW - 20 });
      }

      // ── Dedicated Warranty (Garantie) & Notes Section below totals ──
      let sectionY = totalsY + Math.max(70, isPaid ? 70 : noteH) + 12;

      if (effectiveWarranty) {
        doc.roundedRect(40, sectionY, 515, 42, 6).fillAndStroke("#f0fdf4", "#86efac");
        doc.fillColor("#15803d").font("Helvetica-Bold").fontSize(8.5).text("OFFICIEEL GARANTIEBEWIJS (GENT BANDENSERVICE BV)", 52, sectionY + 8);
        doc.fillColor("#166534").font("Helvetica").fontSize(8).lineGap(1.5).text(
          `${effectiveWarranty} · Vakkundige montage en karkasdekking door Gent Bandenservice BV te Sint-Amandsberg. Bewaar deze factuur als officieel garantiebewijs.`,
          52,
          sectionY + 22,
          { width: 490 }
        );
        sectionY += 50;
      }

      if (cleanNotes && (!isPaid || effectiveWarranty)) {
        doc.roundedRect(40, sectionY, 515, 36, 6).fillAndStroke("#f8fafc", "#e2e8f0");
        doc.fillColor("#475569").font("Helvetica-Bold").fontSize(8).text("OPMERKINGEN / EXTRA INFO:", 50, sectionY + 7);
        doc.fillColor("#334155").font("Helvetica").fontSize(7.5).lineGap(1.5).text(cleanNotes, 50, sectionY + 19, { width: 490 });
      }

      // ── Footer ──
      const footerY = 770;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor("#e2e8f0").lineWidth(1).stroke();
      doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(8).text(
        "Gent Bandenservice BV · Dendermondsesteenweg 428, 9040 Gent · BTW: BE 1041.093.575 · RPR Gent",
        40,
        footerY + 10,
        { align: "center", width: 515 }
      );
      doc.font("Helvetica").fontSize(7.5).text(
        "Bedankt voor uw vertrouwen in Gent Bandenservice BV! Vragen? Bel 0467 87 12 05 of mail naar info@gentbandenservice.be",
        40,
        footerY + 22,
        { align: "center", width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
