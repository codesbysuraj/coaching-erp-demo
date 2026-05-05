import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, withRetry } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const now = new Date();
    const rows = await withRetry(() => prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Admin"
      WHERE "passwordResetToken" = ${token}
        AND "passwordResetExpiry" > ${now}
      LIMIT 1
    `);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await withRetry(() => prisma.$executeRaw`
      UPDATE "Admin"
      SET "passwordHash" = ${passwordHash},
          "passwordResetToken" = NULL,
          "passwordResetExpiry" = NULL
      WHERE id = ${rows[0].id}
    `);

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (e) {
    console.error("[reset-password] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
