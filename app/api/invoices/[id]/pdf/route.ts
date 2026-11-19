import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN" || session.user.role === "ADMIN";
}

// GET /api/invoices/[id]/pdf — stream invoice PDF as download
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return NextResponse.json({ error: "Factuur niet gevonden" }, { status: 404 });
    }

    let items: Array<{ description: string; quantity: number; price: number; vatRate?: number }> = [];
    try {
      items = JSON.parse(invoice.items);
    } catch {
      items = [{ description: "Diensten / Banden", quantity: 1, price: invoice.totalAmount }];
    }

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail ?? "",
      customerPhone: invoice.customerPhone,
      companyName: invoice.companyName,
      vatNumber: invoice.vatNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paymentMethod: invoice.paymentMethod,
      items,
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      totalAmount: invoice.totalAmount,
      notes: invoice.notes,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Factuur-${invoice.invoiceNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    console.error("GET /api/invoices/[id]/pdf error:", error);
    return NextResponse.json({ error: "Fout bij genereren van PDF" }, { status: 500 });
  }
}
