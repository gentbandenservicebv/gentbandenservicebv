import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN" || session.user.role === "ADMIN";
}

// GET /api/invoices/[id] - fetch invoice by ID or invoiceNumber
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factuur niet gevonden" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Fout bij ophalen factuur" }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] - update invoice
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const dataToUpdate: any = {};

    if (body.customerName !== undefined) dataToUpdate.customerName = body.customerName.trim();
    if (body.customerEmail !== undefined) dataToUpdate.customerEmail = body.customerEmail.trim();
    if (body.customerPhone !== undefined) dataToUpdate.customerPhone = body.customerPhone?.trim() || null;
    if (body.customerStreet !== undefined) dataToUpdate.customerStreet = body.customerStreet?.trim() || null;
    if (body.customerCity !== undefined) dataToUpdate.customerCity = body.customerCity?.trim() || null;
    if (body.customerPostal !== undefined) dataToUpdate.customerPostal = body.customerPostal?.trim() || null;
    if (body.customerCountry !== undefined) dataToUpdate.customerCountry = body.customerCountry?.trim() || "België";
    if (body.companyName !== undefined) dataToUpdate.companyName = body.companyName?.trim() || null;
    if (body.vatNumber !== undefined) dataToUpdate.vatNumber = body.vatNumber?.trim() || null;

    if (body.issueDate !== undefined) dataToUpdate.issueDate = new Date(body.issueDate);
    if (body.dueDate !== undefined) dataToUpdate.dueDate = new Date(body.dueDate);
    if (body.paymentMethod !== undefined) dataToUpdate.paymentMethod = body.paymentMethod;
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;

    if (body.status !== undefined) {
      dataToUpdate.status = body.status;
      if (body.status === "PAID") {
        dataToUpdate.paidAt = new Date();
      } else if (body.status === "PENDING") {
        dataToUpdate.paidAt = null;
      }
    }

    if (body.items !== undefined) {
      const items = typeof body.items === "string" ? JSON.parse(body.items) : body.items;
      dataToUpdate.items = JSON.stringify(items);

      if (body.subtotal !== undefined && body.vatAmount !== undefined && body.totalAmount !== undefined) {
        dataToUpdate.subtotal = parseFloat(body.subtotal);
        dataToUpdate.vatAmount = parseFloat(body.vatAmount);
        dataToUpdate.totalAmount = parseFloat(body.totalAmount);
      } else {
        // Calculate totals from items
        const calculatedTotal = items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
        const calculatedSubtotal = items.reduce((sum: number, it: any) => {
          const rate = it.vatRate || 21;
          return sum + ((it.price / (1 + rate / 100)) * it.quantity);
        }, 0);
        const calculatedVat = calculatedTotal - calculatedSubtotal;

        dataToUpdate.totalAmount = calculatedTotal;
        dataToUpdate.subtotal = calculatedSubtotal;
        dataToUpdate.vatAmount = calculatedVat;
      }
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Fout bij bijwerken factuur" }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] - remove invoice
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Fout bij verwijderen factuur" }, { status: 500 });
  }
}
