import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendInvoiceEmail } from "@/lib/resend";

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN" || session.user.role === "ADMIN";
}

// POST /api/invoices/[id]/send - send invoice via Resend email
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factuur niet gevonden" }, { status: 404 });
    }

    if (!invoice.customerEmail) {
      return NextResponse.json({ error: "Klant heeft geen geldig e-mailadres" }, { status: 400 });
    }

    let items: any[] = [];
    try {
      items = JSON.parse(invoice.items);
    } catch {
      items = [{ description: "Diensten / Banden", quantity: 1, price: invoice.totalAmount }];
    }

    const emailResult = await sendInvoiceEmail({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      companyName: invoice.companyName,
      vatNumber: invoice.vatNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items,
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes,
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error || "E-mail kon niet worden verzonden" }, { status: 500 });
    }

    // Update sent timestamp
    const updated = await prisma.invoice.update({
      where: { id },
      data: { sentAt: new Date() },
    });

    return NextResponse.json({ success: true, sentAt: updated.sentAt });
  } catch (error: any) {
    console.error("POST /api/invoices/[id]/send error:", error);
    return NextResponse.json({ error: "Fout bij versturen van factuur" }, { status: 500 });
  }
}
