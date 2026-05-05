import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma, withRetry } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const rows = await withRetry(() => prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Admin" WHERE email = ${email} LIMIT 1
    `);

    // Always return success to avoid email enumeration
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, message: "If that email is registered, you'll receive a reset link." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await withRetry(() => prisma.$executeRaw`
      UPDATE "Admin"
      SET "passwordResetToken" = ${token}, "passwordResetExpiry" = ${expiry}
      WHERE email = ${email}
    `);

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login/reset-password?token=${token}`;

    return NextResponse.json({ success: true, message: "Reset link generated.", resetLink });
  } catch (e) {
    console.error("[forgot-password] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
