import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, withRetry } from "@/lib/prisma";
import { getAdminFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const rows = await withRetry(() => prisma.$queryRaw<{ passwordHash: string }[]>`
      SELECT "passwordHash" FROM "Admin" WHERE id = ${admin.id} LIMIT 1
    `);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, rows[0].passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await withRetry(() => prisma.$executeRaw`
      UPDATE "Admin" SET "passwordHash" = ${passwordHash} WHERE id = ${admin.id}
    `);

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (e) {
    console.error("[change-password] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
