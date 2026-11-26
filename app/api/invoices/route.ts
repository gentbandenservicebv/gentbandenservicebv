import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendInvoiceEmail } from "@/lib/resend";
import { parseWarrantyFromNotes, combineNotesAndWarranty } from "@/lib/warranty";

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN" || session.user.role === "ADMIN";
}

// Generate invoice number e.g. "GBV-2026-0001"
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  const seq = String(count + 1).padStart(4, "0");
  const candidate = `GBV-${year}-${seq}`;

  // Check if exists, if so increment
  const exists = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });
  if (!exists) return candidate;

  return `GBV-${year}-${String(count + 2).padStart(4, "0")}`;
}

// GET /api/invoices - list all invoices
export async function GET(req: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const status = searchParams.get("status") || "ALL";

  try {
    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const mappedInvoices = invoices.map((inv) => {
      const { warranty, notes: cleanNotes } = parseWarrantyFromNotes(inv.notes);
      return {
        ...inv,
        warranty,
        notes: cleanNotes,
        rawNotes: inv.notes,
      };
    });

    return NextResponse.json(mappedInvoices);
  } catch (error: any) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ error: "Fout bij ophalen facturen" }, { status: 500 });
  }
}

// POST /api/invoices - create a new invoice
export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerStreet,
      customerCity,
      customerPostal,
      customerCountry = "België",
      companyName,
      vatNumber,
      status = "PENDING",
      issueDate,
      dueDate,
      paymentMethod = "Overschrijving",
      items,
      notes,
      warranty,
      sendDirectly = false,
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Klantnaam is verplicht" }, { status: 400 });
    }

    if (!customerEmail || !customerEmail.trim()) {
      return NextResponse.json({ error: "E-mailadres is verplicht" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Voeg minimaal één factuurregel toe" }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    let totalVat = 0;

    const validatedItems = items.map((it: any) => {
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const price = Math.max(0, parseFloat(it.price) || 0);
      const vatRate = typeof it.vatRate === "number" ? it.vatRate : 21;
      const lineSubtotal = (price / (1 + vatRate / 100)) * qty;
      const lineVat = (price - price / (1 + vatRate / 100)) * qty;

      subtotal += lineSubtotal;
      totalVat += lineVat;

      return {
        description: String(it.description || "Dienst / Product").trim(),
        quantity: qty,
        price,
        vatRate,
      };
    });

    const totalAmount = subtotal + totalVat;
    const invoiceNumber = body.invoiceNumber?.trim() || (await generateInvoiceNumber());

    const created = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone?.trim() || null,
        customerStreet: customerStreet?.trim() || null,
        customerCity: customerCity?.trim() || null,
        customerPostal: customerPostal?.trim() || null,
        customerCountry: customerCountry?.trim() || "België",
        companyName: companyName?.trim() || null,
        vatNumber: vatNumber?.trim() || null,
        status,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        paymentMethod: paymentMethod || "Overschrijving",
        items: JSON.stringify(validatedItems),
        subtotal: Math.round(subtotal * 100) / 100,
        vatAmount: Math.round(totalVat * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        notes: combineNotesAndWarranty(notes, warranty) || null,
      },
    });

    // Optionally send directly via email
    if (sendDirectly) {
      sendInvoiceEmail({
        id: created.id,
        invoiceNumber: created.invoiceNumber,
        customerName: created.customerName,
        customerEmail: created.customerEmail,
        customerPhone: created.customerPhone,
        companyName: created.companyName,
        vatNumber: created.vatNumber,
        issueDate: created.issueDate,
        dueDate: created.dueDate,
        items: validatedItems,
        subtotal: created.subtotal,
        vatAmount: created.vatAmount,
        totalAmount: created.totalAmount,
        status: created.status,
        paymentMethod: created.paymentMethod,
        notes: created.notes,
      })
        .then(async (res) => {
          if (res.success) {
            await prisma.invoice.update({
              where: { id: created.id },
              data: { sentAt: new Date() },
            });
          }
        })
        .catch(console.error);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ error: error.message || "Fout bij aanmaken factuur" }, { status: 500 });
  }
}
