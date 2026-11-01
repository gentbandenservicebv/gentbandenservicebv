import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Huidig en nieuw wachtwoord zijn vereist" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Nieuw wachtwoord moet minstens 8 tekens lang zijn" }, { status: 400 });
  }

  // Get the account record with hashed password
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "credential",
    },
    select: { id: true, password: true },
  });

  if (!account?.password) {
    return NextResponse.json(
      { error: "Wachtwoord wijzigen is niet mogelijk voor dit account type" },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(currentPassword, account.password);
  if (!isValid) {
    return NextResponse.json({ error: "Huidig wachtwoord is onjuist" }, { status: 400 });
  }

  const hashedNew = await bcrypt.hash(newPassword, 12);

  await prisma.account.update({
    where: { id: account.id },
    data: { password: hashedNew },
  });

  return NextResponse.json({ success: true });
}
