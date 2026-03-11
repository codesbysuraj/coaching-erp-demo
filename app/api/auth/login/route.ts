import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, withRetry } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";

interface AdminRow {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const rows = await withRetry(() =>
      prisma.$queryRaw<AdminRow[]>`
        SELECT id, name, email, "passwordHash", role
        FROM "Admin"
        WHERE email = ${email}
        LIMIT 1
      `
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Log the sign-in
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    await withRetry(() =>
      prisma.$executeRaw`
        INSERT INTO "AdminLoginLog" ("adminId", email, name, "ipAddress", "userAgent", "loggedInAt")
        VALUES (${admin.id}, ${admin.email}, ${admin.name}, ${ip}, ${ua}, NOW())
      `
    );

    const token = signToken({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });

    const res = NextResponse.json({ success: true, name: admin.name, role: admin.role });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e) {
    console.error("[login] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
